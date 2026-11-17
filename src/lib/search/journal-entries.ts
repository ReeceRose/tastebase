import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  min,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  journalEntries,
  journalEntryRecipes,
  journalPhotos,
} from "@/db/schema.journal";
import { recipeCooks, recipes } from "@/db/schema.recipes";
import { visibleTo } from "@/lib/search/recipe-summaries";
import type { CookMoment } from "@/lib/types/journal-lookback-types";
import type {
  JournalEntry,
  JournalEntryRecipe,
  JournalPhoto,
} from "@/lib/types/journal-types";
import { toJournalEntryKind } from "@/lib/utils/journal";

// Recipes for each entry, with current titles where the viewer can see them
export async function loadEntryRecipes(
  userId: string,
  entryIds: string[],
): Promise<Map<string, JournalEntryRecipe[]>> {
  const byEntry = new Map<string, JournalEntryRecipe[]>();
  if (entryIds.length === 0) return byEntry;
  const rows = await db
    .select({
      entryId: journalEntryRecipes.entryId,
      recipeId: journalEntryRecipes.recipeId,
      recipeTitle: journalEntryRecipes.recipeTitle,
      slug: recipes.slug,
      title: recipes.title,
      swatch: recipes.swatch,
    })
    .from(journalEntryRecipes)
    .leftJoin(
      recipes,
      and(eq(journalEntryRecipes.recipeId, recipes.id), visibleTo(userId)),
    )
    .where(inArray(journalEntryRecipes.entryId, entryIds))
    .orderBy(asc(journalEntryRecipes.sortOrder));
  for (const row of rows) {
    const list = byEntry.get(row.entryId) ?? [];
    list.push({
      recipeId: row.recipeId,
      slug: row.slug,
      title: row.title ?? row.recipeTitle,
      swatch: row.slug ? row.swatch : null,
    });
    byEntry.set(row.entryId, list);
  }
  return byEntry;
}

// Entries linked to a recipe, for use inside a where clause
export function entriesWithRecipe(recipeId: string): SQL {
  return inArray(
    journalEntries.id,
    db
      .select({ id: journalEntryRecipes.entryId })
      .from(journalEntryRecipes)
      .where(eq(journalEntryRecipes.recipeId, recipeId)),
  );
}

export async function loadJournalEntries(
  userId: string,
  where: SQL,
  limit: number,
): Promise<JournalEntry[]> {
  const rows = await db
    .select({ entry: journalEntries, authorName: users.name })
    .from(journalEntries)
    .innerJoin(users, eq(journalEntries.userId, users.id))
    .where(where)
    .orderBy(desc(journalEntries.happenedAt), desc(journalEntries.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];
  const entryIds = rows.map((row) => row.entry.id);

  const [photos, recipesByEntry] = await Promise.all([
    db
      .select()
      .from(journalPhotos)
      .where(inArray(journalPhotos.entryId, entryIds))
      .orderBy(asc(journalPhotos.sortOrder)),
    loadEntryRecipes(userId, entryIds),
  ]);
  const photosByEntry = new Map<string, JournalPhoto[]>();
  for (const photo of photos) {
    const list = photosByEntry.get(photo.entryId) ?? [];
    list.push(photo);
    photosByEntry.set(photo.entryId, list);
  }

  return rows.map(({ entry, authorName }) => ({
    id: entry.id,
    kind: toJournalEntryKind(entry.kind),
    userId: entry.userId,
    authorName,
    recipes: recipesByEntry.get(entry.id) ?? [],
    title: entry.title,
    content: entry.content,
    rating: entry.rating,
    isPrivate: entry.isPrivate,
    happenedAt: entry.happenedAt,
    photos: photosByEntry.get(entry.id) ?? [],
  }));
}

export async function loadUserCooks(
  userId: string,
  from: Date,
  to: Date,
): Promise<CookMoment[]> {
  return db
    .select({ recipeId: recipeCooks.recipeId, cookedAt: recipeCooks.cookedAt })
    .from(recipeCooks)
    .where(
      and(
        eq(recipeCooks.userId, userId),
        gte(recipeCooks.cookedAt, from),
        lte(recipeCooks.cookedAt, to),
      ),
    )
    .orderBy(asc(recipeCooks.cookedAt));
}

// Years from the first thing logged to now, newest first
export async function journalYears(
  userId: string,
  year: number,
): Promise<number[]> {
  const [[cooks], [entries]] = await Promise.all([
    db
      .select({ first: min(recipeCooks.cookedAt) })
      .from(recipeCooks)
      .where(eq(recipeCooks.userId, userId)),
    db
      .select({ first: min(journalEntries.happenedAt) })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId)),
  ]);
  const thisYear = new Date().getUTCFullYear();
  const firsts = [cooks?.first, entries?.first]
    .filter((value): value is Date => value instanceof Date)
    .map((value) => value.getUTCFullYear());
  const start = Math.min(year, thisYear, ...firsts);
  const end = Math.max(year, thisYear);
  return Array.from({ length: end - start + 1 }, (_, i) => end - i);
}
