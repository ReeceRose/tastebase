import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeCollectionItems,
  recipeCollections,
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeModifications,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import {
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "@/lib/server-actions/recipe-actions";
import { reorderRecipeImages } from "@/lib/server-actions/recipe-image-actions";
import {
  createRecipeList,
  deleteRecipeList,
} from "@/lib/server-actions/recipe-list-actions";
import { PhotoRole, RecipeSwatch } from "@/lib/types";

vi.mock("@/db", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const testDb = drizzle(new Database(":memory:"), { schema });
  migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return { db: testDb };
});

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: async () => ({ user: { id: "user-1" } }),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const FAIL_INSTRUCTIONS_TRIGGER = "fail_instruction_writes";

const recipeInput = {
  title: "Salad-e Shirazi (Persian Cucumber, Tomato and Onion Salad)",
  isPublic: false,
  swatch: RecipeSwatch.TOMATO,
  ingredients: [{ name: "Persian cucumbers", isOptional: false }],
  instructions: [{ instruction: "Dice the cucumbers." }],
  tags: ["salad", "side dish", "salad"],
};

async function createTestRecipe() {
  const result = await createRecipe(recipeInput);
  if (!result.success || !result.data) {
    throw new Error(`Recipe wasn't created: ${result.error}`);
  }
  return result.data;
}

async function tagNamesFor(recipeId: string) {
  const rows = await db
    .select({ name: recipeTags.name })
    .from(recipeTagRelations)
    .innerJoin(recipeTags, eq(recipeTags.id, recipeTagRelations.tagId))
    .where(eq(recipeTagRelations.recipeId, recipeId));
  return rows.map((row) => row.name).sort();
}

describe("recipe transactions", () => {
  beforeEach(async () => {
    await db.run(
      sql.raw(`DROP TRIGGER IF EXISTS ${FAIL_INSTRUCTIONS_TRIGGER}`),
    );
    await db.delete(recipeCollections);
    await db.delete(recipes);
    await db.delete(recipeTags);
    await db.delete(users);
    await db
      .insert(users)
      .values({ id: "user-1", name: "Test", email: "test@example.com" });
  });

  it("creates a recipe with its ingredients, steps, tags and swatch", async () => {
    const recipe = await createTestRecipe();

    expect(recipe.slug).toBe(
      "salad-e-shirazi-persian-cucumber-tomato-and-onion",
    );
    const [saved] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipe.id));
    expect(saved.swatch).toBe(RecipeSwatch.TOMATO);
    expect(
      await db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipe.id)),
    ).toHaveLength(1);
    expect(await tagNamesFor(recipe.id)).toEqual(["salad", "side dish"]);
  });

  it("gives a second recipe with the same long title a valid slug", async () => {
    await createTestRecipe();
    const second = await createTestRecipe();

    expect(second.slug).toBe(
      "salad-e-shirazi-persian-cucumber-tomato-and-onio-1",
    );
  });

  it("saves an edit and reports success", async () => {
    const recipe = await createTestRecipe();

    const result = await updateRecipe({
      ...recipeInput,
      id: recipe.id,
      title: "Shirazi Salad",
      ingredients: [
        { name: "Cucumbers", isOptional: false },
        { name: "Tomatoes", isOptional: false },
      ],
      tags: ["persian", "persian"],
    });

    expect(result.success).toBe(true);
    expect(result.data?.slug).toBe("shirazi-salad");
    expect(
      await db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipe.id)),
    ).toHaveLength(2);
    expect(await tagNamesFor(recipe.id)).toEqual(["persian"]);
    expect(
      await db
        .select()
        .from(recipeModifications)
        .where(eq(recipeModifications.recipeId, recipe.id)),
    ).toHaveLength(1);
  });

  it("rolls back the whole edit when one write fails", async () => {
    const recipe = await createTestRecipe();
    await db.run(
      sql.raw(`CREATE TRIGGER ${FAIL_INSTRUCTIONS_TRIGGER}
        BEFORE INSERT ON recipe_instructions
        BEGIN SELECT RAISE(ABORT, 'write failed'); END`),
    );

    const result = await updateRecipe({
      ...recipeInput,
      id: recipe.id,
      title: "This edit should not stick",
      ingredients: [{ name: "Replaced", isOptional: false }],
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.success).toBe(false);
    const [saved] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipe.id));
    expect(saved.title).toBe(recipeInput.title);
    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id));
    expect(ingredients.map((row) => row.name)).toEqual(["Persian cucumbers"]);
    expect(
      await db
        .select()
        .from(recipeInstructions)
        .where(eq(recipeInstructions.recipeId, recipe.id)),
    ).toHaveLength(1);
  });

  it("rolls back a new recipe when one write fails", async () => {
    await db.run(
      sql.raw(`CREATE TRIGGER ${FAIL_INSTRUCTIONS_TRIGGER}
        BEFORE INSERT ON recipe_instructions
        BEGIN SELECT RAISE(ABORT, 'write failed'); END`),
    );

    const result = await createRecipe(recipeInput);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.success).toBe(false);
    expect(await db.select().from(recipes)).toHaveLength(0);
  });

  it("deletes a recipe and everything attached to it", async () => {
    const recipe = await createTestRecipe();

    expect((await deleteRecipe(recipe.id)).success).toBe(true);

    expect(await db.select().from(recipes)).toHaveLength(0);
    expect(await db.select().from(recipeIngredients)).toHaveLength(0);
  });

  it("reorders recipe images", async () => {
    const recipe = await createTestRecipe();
    const [first, second] = ["image-a", "image-b"];
    for (const [sortOrder, id] of [first, second].entries()) {
      await db.insert(recipeImages).values({
        id,
        recipeId: recipe.id,
        filename: `${id}.jpg`,
        originalName: `${id}.jpg`,
        mimeType: "image/jpeg",
        fileSize: 1,
        isHero: sortOrder === 0,
        sortOrder,
      });
    }

    const result = await reorderRecipeImages(recipe.id, [second, first]);

    expect(result.success).toBe(true);
    const images = await db
      .select()
      .from(recipeImages)
      .orderBy(recipeImages.sortOrder);
    expect(images.map((image) => [image.id, image.isHero])).toEqual([
      [second, true],
      [first, false],
    ]);
  });

  it("saves photo tags with an edit and drops tags on missing steps", async () => {
    const recipe = await createTestRecipe();
    for (const [sortOrder, id] of ["image-a", "image-b", "image-c"].entries()) {
      await db.insert(recipeImages).values({
        id,
        recipeId: recipe.id,
        filename: `${id}.jpg`,
        originalName: `${id}.jpg`,
        mimeType: "image/jpeg",
        fileSize: 1,
        isHero: sortOrder === 0,
        sortOrder,
        photoRole: id === "image-c" ? PhotoRole.FINISHED : null,
      });
    }

    const result = await updateRecipe({
      ...recipeInput,
      id: recipe.id,
      instructions: [
        { instruction: "Dice the cucumbers." },
        { instruction: "Toss with lime." },
      ],
      photoTags: [
        { imageId: "image-a", role: PhotoRole.STEP, stepNumber: 2 },
        { imageId: "image-b", role: PhotoRole.STEP, stepNumber: 3 },
      ],
    });

    expect(result.success).toBe(true);
    const images = await db
      .select()
      .from(recipeImages)
      .orderBy(recipeImages.sortOrder);
    expect(
      images.map((image) => [image.id, image.photoRole, image.stepNumber]),
    ).toEqual([
      ["image-a", PhotoRole.STEP, 2],
      ["image-b", null, null],
      ["image-c", null, null],
    ]);
  });

  it("creates and deletes a recipe list", async () => {
    const recipe = await createTestRecipe();
    const listId = nanoid();

    const created = await createRecipeList(
      listId,
      { name: "Weeknight", swatch: null },
      recipe.id,
    );
    expect(created.success).toBe(true);
    expect(await db.select().from(recipeCollectionItems)).toHaveLength(1);

    const deleted = await deleteRecipeList(listId);
    expect(deleted.success).toBe(true);
    expect(await db.select().from(recipeCollections)).toHaveLength(0);
    expect(await db.select().from(recipeCollectionItems)).toHaveLength(0);
  });

  it("never passes an async callback to a transaction", () => {
    const sourceFiles = readdirSync("src", {
      recursive: true,
      encoding: "utf8",
    })
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) => !file.includes("__tests__"));

    const offenders = sourceFiles.filter((file) =>
      /\.transaction\(\s*async/.test(readFileSync(join("src", file), "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
