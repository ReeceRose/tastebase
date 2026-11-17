import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { journalEntries, journalPhotos } from "@/db/schema.journal";
import { recipeCooks, recipeImages, recipes } from "@/db/schema.recipes";
import {
  deleteJournalEntry,
  getJournal,
  getRecipeJournal,
  saveJournalEntry,
} from "@/lib/server-actions/journal-actions";
import { deleteRecipe } from "@/lib/server-actions/recipe-actions";
import { JournalEntryKind, JournalFilter } from "@/lib/types";
import type { JournalEntryInput } from "@/lib/types/journal-types";

const deletedFiles = vi.hoisted(() => [] as string[]);

vi.mock("@/db", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const testDb = drizzle(new Database(":memory:"), { schema });
  migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return { db: testDb };
});

const session = vi.hoisted(() => ({ userId: "user-1" }));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: async () => ({ user: { id: session.userId } }),
    },
  },
}));

vi.mock("@/lib/file-storage", () => ({
  deleteRecipeImage: async (filename: string) => {
    deletedFiles.push(filename);
    return true;
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function photo(filename: string) {
  return {
    filename,
    originalName: null,
    mimeType: "image/jpeg",
    fileSize: 1000,
    width: 800,
    height: 600,
  };
}

const LASAGNA = { recipeId: "lasagna", title: "Lasagna" };
const SALAD = { recipeId: "salad", title: "Salad" };

function cookedEntry(overrides: Partial<JournalEntryInput> = {}) {
  return {
    id: null,
    kind: JournalEntryKind.COOKED,
    recipes: [LASAGNA],
    title: null,
    content: "Made it for Mom's birthday",
    rating: 5,
    isPrivate: false,
    happenedOn: "2026-11-01",
    photos: [photo("first.jpg")],
    ...overrides,
  } satisfies JournalEntryInput;
}

async function onlyEntryId() {
  const [entry] = await db.select().from(journalEntries);
  return entry.id;
}

describe("journal actions", () => {
  beforeEach(async () => {
    session.userId = "user-1";
    deletedFiles.length = 0;
    await db.delete(journalEntries);
    await db.delete(recipes);
    await db.delete(users);
    await db.insert(users).values([
      { id: "user-1", name: "Ree", email: "ree@example.com" },
      { id: "user-2", name: "Sam", email: "sam@example.com" },
    ]);
    await db.insert(recipes).values([
      { id: "lasagna", slug: "lasagna", userId: "user-1", title: "Lasagna" },
      { id: "salad", slug: "salad", userId: "user-1", title: "Salad" },
      {
        id: "sams-secret",
        slug: "sams-secret",
        userId: "user-2",
        title: "Secret stew",
        isPublic: false,
      },
    ]);
  });

  it("logs a cook with photos and counts it as cooked", async () => {
    const result = await saveJournalEntry(cookedEntry());
    expect(result).toEqual({ success: true, error: null });

    const journal = await getJournal(JournalFilter.ALL);
    expect(journal.entries).toHaveLength(1);
    const [entry] = journal.entries;
    expect(entry.recipes.map((recipe) => recipe.title)).toEqual(["Lasagna"]);
    expect(entry.rating).toBe(5);
    expect(entry.photos.map((item) => item.filename)).toEqual(["first.jpg"]);
    expect(
      await db
        .select()
        .from(recipeCooks)
        .where(eq(recipeCooks.recipeId, "lasagna")),
    ).toHaveLength(1);
  });

  it("doesn't count the same cook twice", async () => {
    await db.insert(recipeCooks).values({
      id: "cook-1",
      recipeId: "lasagna",
      userId: "user-1",
      cookedAt: new Date("2026-11-01T23:30:00.000Z"),
    });
    await saveJournalEntry(cookedEntry());
    expect(await db.select().from(recipeCooks)).toHaveLength(1);
  });

  it("keeps notes without a recipe and filters by kind", async () => {
    await saveJournalEntry(cookedEntry());
    const note = await saveJournalEntry({
      ...cookedEntry({ photos: [] }),
      kind: JournalEntryKind.NOTE,
      recipes: [],
      title: "Dinner party menu",
      rating: 4,
    });
    expect(note.success).toBe(true);

    const notes = await getJournal(JournalFilter.NOTES);
    expect(notes.entries).toHaveLength(1);
    expect(notes.entries[0].title).toBe("Dinner party menu");
    expect(notes.entries[0].rating).toBeNull();
    expect((await getJournal(JournalFilter.COOKED)).entries).toHaveLength(1);
  });

  it("needs a recipe for a cook and something in a note", async () => {
    expect((await saveJournalEntry(cookedEntry({ recipes: [] }))).success).toBe(
      false,
    );
    expect(
      (
        await saveJournalEntry({
          ...cookedEntry({ photos: [], content: "  " }),
          kind: JournalEntryKind.NOTE,
          recipes: [],
        })
      ).success,
    ).toBe(false);
  });

  it("won't log a recipe the user can't see", async () => {
    const result = await saveJournalEntry(
      cookedEntry({
        recipes: [{ recipeId: "sams-secret", title: "Secret stew" }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("won't take a photo another recipe already uses", async () => {
    await db.insert(recipeImages).values({
      id: "image-1",
      recipeId: "lasagna",
      filename: "taken.jpg",
      mimeType: "image/jpeg",
      fileSize: 1,
      sortOrder: 0,
    });
    const result = await saveJournalEntry(
      cookedEntry({ photos: [photo("taken.jpg")] }),
    );
    expect(result.success).toBe(false);
    expect(await db.select().from(journalEntries)).toHaveLength(0);
  });

  it("removes the files of photos taken out of an entry", async () => {
    await saveJournalEntry(cookedEntry());
    const id = await onlyEntryId();
    const result = await saveJournalEntry(
      cookedEntry({ id, photos: [photo("second.jpg")] }),
    );
    expect(result.success).toBe(true);
    expect(deletedFiles).toEqual(["first.jpg"]);
    expect(
      (await db.select().from(journalPhotos)).map((row) => row.filename),
    ).toEqual(["second.jpg"]);
  });

  it("deletes an entry with its photos", async () => {
    await saveJournalEntry(cookedEntry());
    const result = await deleteJournalEntry(await onlyEntryId());
    expect(result.success).toBe(true);
    expect(await db.select().from(journalPhotos)).toHaveLength(0);
    expect(deletedFiles).toEqual(["first.jpg"]);
  });

  it("only lets the author change or delete an entry", async () => {
    await saveJournalEntry(cookedEntry());
    const id = await onlyEntryId();
    session.userId = "user-2";
    expect((await deleteJournalEntry(id)).success).toBe(false);
    expect((await saveJournalEntry(cookedEntry({ id }))).success).toBe(false);
  });

  it("shows others' entries on a recipe unless they're private", async () => {
    await saveJournalEntry(cookedEntry());
    await saveJournalEntry(cookedEntry({ isPrivate: true, content: "Mine" }));
    session.userId = "user-2";
    await db.update(recipes).set({ isPublic: true });

    const visible = await getRecipeJournal("lasagna");
    expect(visible.entries.map((entry) => entry.content)).toEqual([
      "Made it for Mom's birthday",
    ]);
    expect((await getJournal(JournalFilter.ALL)).entries).toHaveLength(0);
  });

  it("keeps the entry when its recipe is deleted", async () => {
    await saveJournalEntry(cookedEntry());
    expect((await deleteRecipe("lasagna")).success).toBe(true);

    const [entry] = (await getJournal(JournalFilter.ALL)).entries;
    expect(entry.recipes).toEqual([
      { recipeId: null, slug: null, title: "Lasagna", swatch: null },
    ]);

    const edit = await saveJournalEntry(
      cookedEntry({
        id: entry.id,
        recipes: [{ recipeId: null, title: "Lasagna" }],
        content: "Still good",
      }),
    );
    expect(edit.success).toBe(true);
    expect(
      (
        await saveJournalEntry(
          cookedEntry({
            id: entry.id,
            recipes: [{ recipeId: null, title: "Made up" }],
          }),
        )
      ).success,
    ).toBe(false);
  });

  it("logs several recipes in one entry", async () => {
    const result = await saveJournalEntry(
      cookedEntry({ recipes: [SALAD, LASAGNA] }),
    );
    expect(result.success).toBe(true);

    const [entry] = (await getJournal(JournalFilter.ALL)).entries;
    expect(entry.recipes.map((recipe) => recipe.recipeId)).toEqual([
      "salad",
      "lasagna",
    ]);
    expect(
      (await db.select().from(recipeCooks)).map((cook) => cook.recipeId).sort(),
    ).toEqual(["lasagna", "salad"]);
    expect((await getRecipeJournal("salad")).entries).toHaveLength(1);
    expect((await getRecipeJournal("lasagna")).entries).toHaveLength(1);
  });

  it("counts a cook for a recipe added while editing", async () => {
    await saveJournalEntry(cookedEntry());
    const id = await onlyEntryId();
    await saveJournalEntry(cookedEntry({ id, recipes: [LASAGNA, SALAD] }));
    await saveJournalEntry(cookedEntry({ id, recipes: [LASAGNA, SALAD] }));
    expect(
      (await db.select().from(recipeCooks)).map((cook) => cook.recipeId).sort(),
    ).toEqual(["lasagna", "salad"]);
  });

  it("won't take the same recipe twice", async () => {
    const result = await saveJournalEntry(
      cookedEntry({ recipes: [LASAGNA, LASAGNA] }),
    );
    expect(result.success).toBe(false);
  });
});
