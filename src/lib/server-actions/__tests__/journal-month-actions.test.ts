import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  journalEntries,
  journalEntryRecipes,
  journalPhotos,
} from "@/db/schema.journal";
import { recipeCooks, recipes } from "@/db/schema.recipes";
import { getMonthReview } from "@/lib/server-actions/journal-month-actions";
import { JournalEntryKind } from "@/lib/types";
import { dayToTimestamp } from "@/lib/utils/journal";

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
    api: { getSession: async () => ({ user: { id: "user-1" } }) },
  },
}));

const NOW = new Date("2026-11-15T15:00:00.000Z");
let cookCount = 0;

async function cook(recipeId: string, when: string, userId = "user-1") {
  cookCount += 1;
  await db.insert(recipeCooks).values({
    id: `cook-${cookCount}`,
    recipeId,
    userId,
    cookedAt: new Date(when),
  });
}

async function entry(
  id: string,
  day: string,
  values: Partial<typeof journalEntries.$inferInsert> = {},
  recipeId: string | null = "pizza",
) {
  await db.insert(journalEntries).values({
    id,
    userId: "user-1",
    kind: JournalEntryKind.COOKED,
    happenedAt: dayToTimestamp(day),
    ...values,
  });
  if (recipeId) {
    await db.insert(journalEntryRecipes).values({
      id: `link-${id}`,
      entryId: id,
      recipeId,
      recipeTitle: recipeId,
      sortOrder: 0,
    });
  }
}

describe("getMonthReview", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    cookCount = 0;
    await db.delete(journalEntries);
    await db.delete(recipeCooks);
    await db.delete(recipes);
    await db.delete(users);
    await db.insert(users).values([
      { id: "user-1", name: "Ree", email: "ree@example.com" },
      { id: "user-2", name: "Sam", email: "sam@example.com" },
    ]);
    await db.insert(recipes).values([
      { id: "pizza", slug: "pizza", userId: "user-1", title: "Pizza" },
      { id: "stew", slug: "stew", userId: "user-1", title: "Stew" },
      { id: "salad", slug: "salad", userId: "user-1", title: "Salad" },
    ]);
  });

  it("recaps a month against the one before", async () => {
    await cook("pizza", "2026-11-02T18:00:00Z");
    await cook("pizza", "2026-11-09T18:00:00Z");
    await cook("salad", "2026-11-09T19:00:00Z");
    await cook("stew", "2026-10-20T18:00:00Z");
    await cook("salad", "2026-11-03T18:00:00Z", "user-2");
    await entry("pizza-night", "2026-11-09", { rating: 5 });
    await entry(
      "menu",
      "2026-11-04",
      { kind: JournalEntryKind.NOTE, title: "Menu" },
      null,
    );
    await entry("october", "2026-10-20");
    await db.insert(journalPhotos).values({
      id: "photo-1",
      entryId: "pizza-night",
      filename: "pizza.jpg",
      mimeType: "image/jpeg",
      fileSize: 1,
      sortOrder: 0,
    });

    const review = await getMonthReview(2026, 11);
    expect(review?.totals).toEqual({
      cooks: 3,
      recipes: 2,
      newRecipes: 2,
      cookingDays: 2,
      photos: 1,
      notes: 1,
    });
    expect(review?.previousCooks).toBe(1);
    expect(
      review?.topRecipes.map((item) => [item.recipe.id, item.count]),
    ).toEqual([
      ["pizza", 2],
      ["salad", 1],
    ]);
    expect(review?.firstTries.map((recipe) => recipe.id).sort()).toEqual([
      "pizza",
      "salad",
    ]);
    expect(review?.entries.map((item) => item.id)).toEqual([
      "pizza-night",
      "menu",
    ]);

    const ninth = review?.weeks.flat().find((day) => day.day === "2026-11-09");
    expect(ninth).toMatchObject({
      inMonth: true,
      cooks: 2,
      photo: "pizza.jpg",
      entries: 1,
    });
    expect(ninth?.recipes.map((recipe) => recipe.id)).toEqual([
      "pizza",
      "salad",
    ]);
    expect(review?.older).toEqual({ year: 2026, month: 10 });
    expect(review?.newer).toBeNull();
  });

  it("links forward from earlier months", async () => {
    const review = await getMonthReview(2026, 9);
    expect(review?.newer).toEqual({ year: 2026, month: 10 });
    expect(review?.totals.cooks).toBe(0);
  });
});
