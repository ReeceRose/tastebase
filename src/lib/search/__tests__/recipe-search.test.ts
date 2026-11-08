import { describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeIngredients,
  recipeInstructions,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { searchRecipes } from "@/lib/search/recipe-search";
import { parseSearchTerms } from "@/lib/search/recipe-text-search";
import { SortOrder } from "@/lib/types";

vi.mock("@/db", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const testDb = drizzle(new Database(":memory:"), { schema });
  migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return { db: testDb };
});

async function seed() {
  await db.delete(recipes);
  await db.delete(recipeTags);
  await db.delete(users);
  await db.insert(users).values([
    { id: "user-1", name: "One", email: "one@example.com" },
    { id: "user-2", name: "Two", email: "two@example.com" },
  ]);
  await db.insert(recipes).values([
    {
      id: "plain",
      userId: "user-1",
      slug: "chicken-rice",
      title: "Chicken and Rice",
      isPublic: true,
      sourceUrl: "https://www.seriouseats.com/chicken-rice",
      createdAt: new Date("2026-01-01"),
    },
    {
      id: "spicy",
      userId: "user-1",
      slug: "spicy-rice",
      title: "Spicy Rice with Grilled Chicken",
      isPublic: true,
      createdAt: new Date("2026-01-02"),
    },
    {
      id: "steps",
      userId: "user-1",
      slug: "stock",
      title: "Stock",
      isPublic: true,
      createdAt: new Date("2026-01-03"),
    },
    {
      id: "private",
      userId: "user-2",
      slug: "secret-chicken",
      title: "Secret Chicken",
      isPublic: false,
      createdAt: new Date("2026-01-04"),
    },
    {
      id: "percent",
      userId: "user-1",
      slug: "dark-chocolate",
      title: "70% Dark Chocolate Tart",
      isPublic: true,
      createdAt: new Date("2026-01-05"),
    },
  ]);
  await db.insert(recipeIngredients).values({
    id: "ingredient-1",
    recipeId: "spicy",
    name: "garlic",
    sortOrder: 0,
  });
  await db.insert(recipeInstructions).values({
    id: "instruction-1",
    recipeId: "steps",
    stepNumber: 1,
    instruction: "Simmer the chicken bones and rice water for an hour.",
  });
  await db.insert(recipeTags).values({ id: "tag-1", name: "weeknight" });
  await db
    .insert(recipeTagRelations)
    .values({ recipeId: "plain", tagId: "tag-1" });
}

async function search(query: string) {
  const result = await searchRecipes("user-1", {
    query,
    sortBy: "relevance",
    sortOrder: SortOrder.DESC,
    recordHistory: false,
    limit: 20,
    offset: 0,
  });
  return result.recipes.map((recipe) => recipe.id);
}

describe("parseSearchTerms", () => {
  it("drops filler words and lone punctuation", () => {
    expect(parseSearchTerms("mac & cheese")).toEqual(["mac", "cheese"]);
    expect(parseSearchTerms("mac and cheese")).toEqual(["mac", "cheese"]);
    expect(parseSearchTerms(" chicken, rice! ")).toEqual(["chicken", "rice"]);
  });

  it("keeps what it can when nothing else is left", () => {
    expect(parseSearchTerms("the")).toEqual(["the"]);
    expect(parseSearchTerms("&")).toEqual(["&"]);
    expect(parseSearchTerms("   ")).toEqual([]);
  });

  it("limits how many words it uses", () => {
    const words = Array.from({ length: 2000 }, (_, i) => `word${i}`);
    expect(parseSearchTerms(words.join(" "))).toHaveLength(12);
  });
});

describe("searchRecipes text search", () => {
  it("finds words in any order, with title matches first", async () => {
    await seed();

    expect(await search("chicken rice")).toEqual(["spicy", "plain", "steps"]);
    expect(await search("rice chicken")).toEqual(["spicy", "plain", "steps"]);
  });

  it("requires every word", async () => {
    await seed();

    expect(await search("chicken garlic")).toEqual(["spicy"]);
    expect(await search("chicken lemon")).toEqual([]);
  });

  it("searches ingredients, steps, tags and source", async () => {
    await seed();

    expect(await search("garlic")).toEqual(["spicy"]);
    expect(await search("simmer")).toEqual(["steps"]);
    expect(await search("weeknight")).toEqual(["plain"]);
    expect(await search("seriouseats")).toEqual(["plain"]);
  });

  it("matches part of a word regardless of case", async () => {
    await seed();

    expect(await search("CHICK")).toEqual(["spicy", "plain", "steps"]);
  });

  it("treats LIKE wildcards as plain text", async () => {
    await seed();

    expect(await search("70%")).toEqual(["percent"]);
    expect(await search("%")).toEqual(["percent"]);
    expect(await search("_")).toEqual([]);
  });

  it("doesn't return another person's private recipes", async () => {
    await seed();

    expect(await search("secret")).toEqual([]);
  });
});
