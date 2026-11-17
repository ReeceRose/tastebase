import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  journalEntries,
  journalEntryRecipes,
  journalPhotos,
} from "@/db/schema.journal";
import { recipeCooks, recipes } from "@/db/schema.recipes";
import {
  getJournalPhotos,
  getOldFavourites,
  getOnThisDay,
  getRecipeHistory,
  getYearReview,
} from "@/lib/server-actions/journal-lookback-actions";
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

describe("journal look-back actions", () => {
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

  it("shows entries from this day in earlier years", async () => {
    await entry("last-year", "2025-11-15");
    await entry("two-years", "2024-11-15", { kind: JournalEntryKind.NOTE });
    await entry("yesterday-last-year", "2025-11-14");
    await entry("this-year", "2026-11-15");

    const { groups } = await getOnThisDay();
    expect(groups.map((group) => [group.label, group.entries[0].id])).toEqual([
      ["A year ago", "last-year"],
      ["2 years ago", "two-years"],
    ]);
  });

  it("falls back to a month ago", async () => {
    await entry("month-ago", "2026-10-15");
    const { groups } = await getOnThisDay();
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("A month ago");
  });

  it("reviews a year of cooks and entries", async () => {
    await cook("pizza", "2026-02-01T18:00:00Z");
    await cook("pizza", "2026-02-02T18:00:00Z");
    await cook("pizza", "2026-02-03T18:00:00Z");
    await cook("stew", "2026-06-10T18:00:00Z");
    await cook("stew", "2025-03-01T18:00:00Z");
    await cook("salad", "2026-06-10T19:00:00Z", "user-2");
    await entry("best", "2026-02-02", { rating: 5 });
    await entry("fine", "2026-02-03", { rating: 3 });
    await entry(
      "note",
      "2026-04-01",
      { kind: JournalEntryKind.NOTE, title: "Menu" },
      null,
    );
    await db.insert(journalPhotos).values({
      id: "photo-1",
      entryId: "best",
      filename: "best.jpg",
      mimeType: "image/jpeg",
      fileSize: 1,
      sortOrder: 0,
    });

    const review = await getYearReview(2026);
    expect(review?.totals).toEqual({
      cooks: 4,
      recipes: 2,
      newRecipes: 1,
      cookingDays: 4,
      longestStreak: 3,
      photos: 1,
      notes: 1,
    });
    expect(
      review?.topRecipes.map((item) => [item.recipe.title, item.count]),
    ).toEqual([
      ["Pizza", 3],
      ["Stew", 1],
    ]);
    expect(review?.busiestMonth?.label).toBe("Feb");
    expect(review?.highlights.map((item) => item.id)).toEqual(["best"]);
    expect(review?.years).toEqual([2026, 2025]);
  });

  it("lists every journal photo with a caption", async () => {
    await entry("best", "2026-02-02");
    await db.insert(journalPhotos).values({
      id: "photo-1",
      entryId: "best",
      filename: "best.jpg",
      mimeType: "image/jpeg",
      fileSize: 1,
      sortOrder: 0,
    });
    const photos = await getJournalPhotos();
    expect(photos.map((photo) => [photo.caption, photo.recipeSlug])).toEqual([
      ["Made Pizza", "pizza"],
    ]);
  });

  it("summarises one recipe's history for the viewer", async () => {
    await cook("pizza", "2025-03-01T18:00:00Z");
    await cook("pizza", "2026-11-01T18:00:00Z");
    await cook("pizza", "2026-11-02T18:00:00Z", "user-2");
    await entry("first", "2025-03-01", { rating: 3 });
    await entry("second", "2026-11-01", { rating: 5 });

    const history = await getRecipeHistory("pizza");
    expect(history.count).toBe(2);
    expect(history.firstAt?.toISOString()).toBe("2025-03-01T18:00:00.000Z");
    expect(history.ratings).toEqual([
      { entryId: "first", day: "2025-03-01", rating: 3 },
      { entryId: "second", day: "2026-11-01", rating: 5 },
    ]);
  });

  it("finds recipes made often but not lately", async () => {
    await cook("stew", "2026-01-01T18:00:00Z");
    await cook("stew", "2026-02-01T18:00:00Z");
    await cook("pizza", "2026-01-01T18:00:00Z");
    await cook("pizza", "2026-11-10T18:00:00Z");
    await cook("salad", "2026-01-01T18:00:00Z");

    const recipesFound = await getOldFavourites(5);
    expect(recipesFound.map((recipe) => recipe.title)).toEqual(["Stew"]);
  });
});
