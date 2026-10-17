import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/db/index";
import { accounts, users } from "@/db/schema.base";
import {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { seedRecipes } from "@/db/seed-data/recipes";
import { seedTags } from "@/db/seed-data/tags";
import { SEED_USER_PASSWORD, seedUsers } from "@/db/seed-data/users";
import { deleteRecipeImage, saveRecipeImage } from "@/lib/file-storage";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { SeedRecipe } from "@/lib/types/seed-types";

const logger = createOperationLogger("database-seed");

const SEED_EMAIL_PATTERN = "%@example.com";
const SEED_IMAGES_DIR = path.join(process.cwd(), "src/db/seed-data/images");

function recipeIdFor(recipe: SeedRecipe): string {
  return `seed-${recipe.slug}`;
}

// Only removes the example household; real members and their recipes stay put
async function clearSeedData() {
  const seedRecipeIds = seedRecipes.map(recipeIdFor);
  const exampleUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, SEED_EMAIL_PATTERN));
  const exampleUserIds = exampleUsers.map((user) => user.id);

  const seedRecipeFilter =
    exampleUserIds.length > 0
      ? or(
          inArray(recipes.id, seedRecipeIds),
          inArray(recipes.userId, exampleUserIds),
        )
      : inArray(recipes.id, seedRecipeIds);
  const oldImages = await db
    .select({ filename: recipeImages.filename })
    .from(recipeImages)
    .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
    .where(seedRecipeFilter);
  for (const image of oldImages) {
    await deleteRecipeImage(image.filename);
  }

  await db.delete(recipes).where(inArray(recipes.id, seedRecipeIds));
  if (exampleUserIds.length > 0) {
    await db.delete(recipes).where(inArray(recipes.userId, exampleUserIds));
    await db.delete(accounts).where(inArray(accounts.userId, exampleUserIds));
    await db.delete(users).where(inArray(users.id, exampleUserIds));
  }

  logger.info(
    { removedUsers: exampleUserIds.length },
    "Cleared example household",
  );
}

async function insertUsers() {
  const passwordHash = await hashPassword(SEED_USER_PASSWORD);
  await db.insert(users).values(seedUsers);
  await db.insert(accounts).values(
    seedUsers.map((user) => ({
      id: `${user.id}-credential`,
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: passwordHash,
    })),
  );
  logger.info({ count: seedUsers.length }, "Created example members");
}

async function insertImage(recipe: SeedRecipe, recipeId: string) {
  const originalName = `${recipe.slug}.jpg`;
  const buffer = await readFile(path.join(SEED_IMAGES_DIR, originalName));
  const saved = await saveRecipeImage(
    new File([buffer], originalName, { type: "image/jpeg" }),
  );
  if ("error" in saved) {
    throw new Error(
      `Could not save seed image ${originalName}: ${saved.error}`,
    );
  }

  await db.insert(recipeImages).values({
    id: `${recipeId}-image`,
    recipeId,
    filename: saved.filename,
    originalName,
    mimeType: saved.mimeType,
    fileSize: saved.fileSize,
    width: saved.width,
    height: saved.height,
    altText: recipe.image.altText,
    isHero: true,
    sortOrder: 0,
    metadata: {
      source: "wikimedia-commons",
      author: recipe.image.author,
      license: recipe.image.license,
      sourceUrl: recipe.image.sourceUrl,
    },
  });
}

async function insertRecipe(recipe: SeedRecipe) {
  const recipeId = recipeIdFor(recipe);

  await db.insert(recipes).values({
    id: recipeId,
    slug: recipe.slug,
    userId: recipe.userId,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    cuisine: recipe.cuisine,
    swatch: recipe.swatch,
    sourceUrl: recipe.sourceUrl,
    sourceName: recipe.sourceName,
    isPublic: recipe.isPublic,
    isArchived: false,
  });

  const ingredients = recipe.ingredientGroups.flatMap((ingredientGroup) =>
    ingredientGroup.items.map((item) => ({
      ...item,
      groupName: ingredientGroup.name,
    })),
  );
  await db.insert(recipeIngredients).values(
    ingredients.map((item, index) => ({
      ...item,
      id: `${recipeId}-ingredient-${index + 1}`,
      recipeId,
      sortOrder: index + 1,
    })),
  );

  await db.insert(recipeInstructions).values(
    recipe.instructions.map((instruction, index) => ({
      ...instruction,
      id: `${recipeId}-step-${index + 1}`,
      recipeId,
      stepNumber: index + 1,
      notes: null,
      groupName: null,
    })),
  );

  if (recipe.tagIds.length > 0) {
    await db
      .insert(recipeTagRelations)
      .values(recipe.tagIds.map((tagId) => ({ recipeId, tagId })));
  }

  await insertImage(recipe, recipeId);

  logger.info({ recipeId, title: recipe.title }, "Created recipe");
}

async function seed() {
  logger.info("Starting database seed");

  try {
    await clearSeedData();

    await db.insert(recipeTags).values(seedTags).onConflictDoNothing();
    logger.info({ count: seedTags.length }, "Ensured recipe tags");

    await insertUsers();

    for (const recipe of seedRecipes) {
      await insertRecipe(recipe);
    }

    logger.info(
      {
        users: seedUsers.length,
        tags: seedTags.length,
        recipes: seedRecipes.length,
      },
      "Database seed completed successfully",
    );
  } catch (error) {
    logError(logger, "Database seed failed", error);
    throw error;
  }
}

async function main() {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    logError(logger, "Seed process failed", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
