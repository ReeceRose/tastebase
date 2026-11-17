"use server";

import { and, count, eq, gte, inArray, lte, or, type SQL } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  journalEntries,
  journalEntryRecipes,
  journalPhotos,
} from "@/db/schema.journal";
import { recipeCooks, recipeImages, recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  entriesWithRecipe,
  loadJournalEntries,
} from "@/lib/search/journal-entries";
import { visibleTo } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { JournalEntryKind, type JournalFilter } from "@/lib/types";
import type {
  JournalActionResult,
  JournalEntry,
  JournalEntryInput,
  JournalRecipeInput,
} from "@/lib/types/journal-types";
import { isNextRedirectError } from "@/lib/utils";
import {
  dayToTimestamp,
  JOURNAL_PAGE_SIZE,
  journalFilterKind,
  RECIPE_JOURNAL_LIMIT,
} from "@/lib/utils/journal";
import { journalEntrySchema } from "@/lib/validations/journal-schemas";

const logger = createOperationLogger("journal-actions");

// A cook logged for a day counts once, even if cook mode already recorded it.
const SAME_COOK_WINDOW_MS = 18 * 60 * 60 * 1000;

interface JournalResult {
  success: boolean;
  entries: JournalEntry[];
  error: string | null;
}

export async function getJournal(
  filter: JournalFilter,
): Promise<JournalResult> {
  try {
    const user = await getAuthenticatedUser();
    const kind = journalFilterKind(filter);
    const where = and(
      eq(journalEntries.userId, user.id),
      ...(kind ? [eq(journalEntries.kind, kind)] : []),
    ) as SQL;
    const entries = await loadJournalEntries(user.id, where, JOURNAL_PAGE_SIZE);
    return { success: true, entries, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load journal", error, { filter });
    return {
      success: false,
      entries: [],
      error: "Your journal didn't load. Try again.",
    };
  }
}

export async function getRecipeJournal(
  recipeId: string,
): Promise<JournalResult> {
  try {
    const user = await getAuthenticatedUser();
    const where = and(
      entriesWithRecipe(recipeId),
      or(
        eq(journalEntries.userId, user.id),
        eq(journalEntries.isPrivate, false),
      ),
    ) as SQL;
    const entries = await loadJournalEntries(
      user.id,
      where,
      RECIPE_JOURNAL_LIMIT,
    );
    return { success: true, entries, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipe journal", error, { recipeId });
    return { success: false, entries: [], error: null };
  }
}

async function photosInUseElsewhere(filenames: string[]): Promise<boolean> {
  if (filenames.length === 0) return false;
  const [[recipeUse], [journalUse]] = await Promise.all([
    db
      .select({ value: count() })
      .from(recipeImages)
      .where(inArray(recipeImages.filename, filenames)),
    db
      .select({ value: count() })
      .from(journalPhotos)
      .where(inArray(journalPhotos.filename, filenames)),
  ]);
  return (recipeUse?.value ?? 0) + (journalUse?.value ?? 0) > 0;
}

async function hasCookNear(
  recipeId: string,
  userId: string,
  happenedAt: Date,
): Promise<boolean> {
  const [cook] = await db
    .select({ id: recipeCooks.id })
    .from(recipeCooks)
    .where(
      and(
        eq(recipeCooks.recipeId, recipeId),
        eq(recipeCooks.userId, userId),
        gte(
          recipeCooks.cookedAt,
          new Date(happenedAt.getTime() - SAME_COOK_WINDOW_MS),
        ),
        lte(
          recipeCooks.cookedAt,
          new Date(happenedAt.getTime() + SAME_COOK_WINDOW_MS),
        ),
      ),
    )
    .limit(1);
  return Boolean(cook);
}

async function deletePhotoFiles(filenames: string[]) {
  if (filenames.length === 0) return;
  const { deleteRecipeImage } = await import("@/lib/file-storage");
  for (const filename of filenames) {
    await deleteRecipeImage(filename).catch((error) =>
      logger.warn({ filename, error }, "Failed to delete journal photo file"),
    );
  }
}

function revalidateJournal(slugs: string[]) {
  revalidatePath("/journal");
  for (const slug of new Set(slugs)) revalidatePath(`/recipes/${slug}`);
}

interface ResolvedRecipe {
  recipeId: string | null;
  title: string;
}

interface RecipeResolution {
  recipes: ResolvedRecipe[];
  error: string | null;
}

// Links must be recipes the person can see, or ones the entry already had
async function resolveRecipes(
  userId: string,
  requested: JournalRecipeInput[],
  previous: ResolvedRecipe[],
): Promise<RecipeResolution> {
  const ids = requested.flatMap((recipe) =>
    recipe.recipeId ? [recipe.recipeId] : [],
  );
  if (new Set(ids).size !== ids.length) {
    return { recipes: [], error: "That recipe is in there twice" };
  }
  const visible =
    ids.length > 0
      ? await db
          .select({ id: recipes.id, title: recipes.title })
          .from(recipes)
          .where(and(inArray(recipes.id, ids), visibleTo(userId)))
      : [];
  const titles = new Map(visible.map((recipe) => [recipe.id, recipe.title]));

  const resolved: ResolvedRecipe[] = [];
  for (const recipe of requested) {
    const title = recipe.recipeId ? titles.get(recipe.recipeId) : null;
    const kept = previous.find((link) =>
      recipe.recipeId
        ? link.recipeId === recipe.recipeId
        : !link.recipeId && link.title === recipe.title,
    );
    if (title) resolved.push({ recipeId: recipe.recipeId, title });
    else if (kept) resolved.push(kept);
    else return { recipes: [], error: "That recipe isn't available" };
  }
  return { recipes: resolved, error: null };
}

async function recipeSlugs(recipeIds: string[]): Promise<string[]> {
  if (recipeIds.length === 0) return [];
  const rows = await db
    .select({ slug: recipes.slug })
    .from(recipes)
    .where(inArray(recipes.id, recipeIds));
  return rows.map((row) => row.slug);
}

export async function saveJournalEntry(
  input: JournalEntryInput,
): Promise<JournalActionResult> {
  try {
    const user = await getAuthenticatedUser();
    const parsed = journalEntrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Check the entry and retry",
      };
    }
    const entry = parsed.data;

    const [existing] = entry.id
      ? await db
          .select({ id: journalEntries.id })
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.id, entry.id),
              eq(journalEntries.userId, user.id),
            ),
          )
          .limit(1)
      : [null];
    if (entry.id && !existing) {
      return { success: false, error: "That entry doesn't exist any more" };
    }

    const cooked = entry.kind === JournalEntryKind.COOKED;
    if (cooked && entry.recipes.length === 0) {
      return { success: false, error: "Pick the recipe you made" };
    }
    const previousLinks: ResolvedRecipe[] = existing
      ? await db
          .select({
            recipeId: journalEntryRecipes.recipeId,
            title: journalEntryRecipes.recipeTitle,
          })
          .from(journalEntryRecipes)
          .where(eq(journalEntryRecipes.entryId, existing.id))
      : [];
    const resolution = await resolveRecipes(
      user.id,
      entry.recipes,
      previousLinks,
    );
    if (resolution.error) return { success: false, error: resolution.error };
    const links = resolution.recipes;

    const previousPhotos = existing
      ? await db
          .select({ filename: journalPhotos.filename })
          .from(journalPhotos)
          .where(eq(journalPhotos.entryId, existing.id))
      : [];
    const previous = new Set(previousPhotos.map((photo) => photo.filename));
    const kept = new Set(entry.photos.map((photo) => photo.filename));
    const added = [...kept].filter((filename) => !previous.has(filename));
    const removed = [...previous].filter((filename) => !kept.has(filename));
    if (kept.size !== entry.photos.length) {
      return { success: false, error: "The same photo is in there twice" };
    }
    if (await photosInUseElsewhere(added)) {
      return { success: false, error: "One of those photos is already used" };
    }

    const happenedAt = dayToTimestamp(entry.happenedOn);
    const now = new Date();
    const entryId = existing?.id ?? nanoid();
    const values = {
      kind: entry.kind,
      title: cooked ? null : entry.title,
      content: entry.content,
      rating: cooked ? entry.rating : null,
      isPrivate: entry.isPrivate,
      happenedAt,
      updatedAt: now,
    };

    const alreadyLinked = new Set(previousLinks.map((link) => link.recipeId));
    const newlyLinked = links.flatMap((link) =>
      link.recipeId && !alreadyLinked.has(link.recipeId) ? [link.recipeId] : [],
    );
    const cookRecipeIds: string[] = [];
    if (cooked) {
      for (const recipeId of newlyLinked) {
        if (!(await hasCookNear(recipeId, user.id, happenedAt))) {
          cookRecipeIds.push(recipeId);
        }
      }
    }

    db.transaction((tx) => {
      if (existing) {
        tx.update(journalEntries)
          .set(values)
          .where(eq(journalEntries.id, entryId))
          .run();
        tx.delete(journalPhotos)
          .where(eq(journalPhotos.entryId, entryId))
          .run();
        tx.delete(journalEntryRecipes)
          .where(eq(journalEntryRecipes.entryId, entryId))
          .run();
      } else {
        tx.insert(journalEntries)
          .values({ ...values, id: entryId, userId: user.id, createdAt: now })
          .run();
      }
      if (links.length > 0) {
        tx.insert(journalEntryRecipes)
          .values(
            links.map((link, index) => ({
              id: nanoid(),
              entryId,
              recipeId: link.recipeId,
              recipeTitle: link.title,
              sortOrder: index,
            })),
          )
          .run();
      }
      if (entry.photos.length > 0) {
        tx.insert(journalPhotos)
          .values(
            entry.photos.map((photo, index) => ({
              ...photo,
              id: nanoid(),
              entryId,
              sortOrder: index,
              uploadedAt: now,
            })),
          )
          .run();
      }
      if (cookRecipeIds.length > 0) {
        tx.insert(recipeCooks)
          .values(
            cookRecipeIds.map((recipeId) => ({
              id: nanoid(),
              recipeId,
              userId: user.id,
              cookedAt: happenedAt > now ? now : happenedAt,
            })),
          )
          .run();
      }
    });

    await deletePhotoFiles(removed);

    const touched = [...links, ...previousLinks].flatMap((link) =>
      link.recipeId ? [link.recipeId] : [],
    );
    revalidateJournal(await recipeSlugs([...new Set(touched)]));
    if (cookRecipeIds.length > 0) revalidatePath("/");

    logger.info(
      {
        entryId,
        userId: user.id,
        kind: entry.kind,
        recipeCount: links.length,
        photoCount: entry.photos.length,
        created: !existing,
      },
      "Saved journal entry",
    );
    return { success: true, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to save journal entry", error);
    return { success: false, error: "That entry didn't save. Try again." };
  }
}

export async function deleteJournalEntry(
  entryId: string,
): Promise<JournalActionResult> {
  try {
    const user = await getAuthenticatedUser();
    const [entry] = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(
        and(eq(journalEntries.id, entryId), eq(journalEntries.userId, user.id)),
      )
      .limit(1);
    if (!entry) {
      return { success: false, error: "That entry doesn't exist any more" };
    }

    const [photos, links] = await Promise.all([
      db
        .select({ filename: journalPhotos.filename })
        .from(journalPhotos)
        .where(eq(journalPhotos.entryId, entryId)),
      db
        .select({ recipeId: journalEntryRecipes.recipeId })
        .from(journalEntryRecipes)
        .where(eq(journalEntryRecipes.entryId, entryId)),
    ]);

    db.transaction((tx) => {
      tx.delete(journalPhotos).where(eq(journalPhotos.entryId, entryId)).run();
      tx.delete(journalEntryRecipes)
        .where(eq(journalEntryRecipes.entryId, entryId))
        .run();
      tx.delete(journalEntries).where(eq(journalEntries.id, entryId)).run();
    });
    await deletePhotoFiles(photos.map((photo) => photo.filename));

    revalidateJournal(
      await recipeSlugs(
        links.flatMap((link) => (link.recipeId ? [link.recipeId] : [])),
      ),
    );
    logger.info({ entryId, userId: user.id }, "Deleted journal entry");
    return { success: true, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to delete journal entry", error, { entryId });
    return { success: false, error: "That entry didn't delete. Try again." };
  }
}
