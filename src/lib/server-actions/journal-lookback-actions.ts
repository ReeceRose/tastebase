"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  lt,
  lte,
  max,
  min,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { journalEntries, journalPhotos } from "@/db/schema.journal";
import { recipeCooks } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  entriesWithRecipe,
  journalYears,
  loadEntryRecipes,
  loadJournalEntries,
  loadUserCooks,
} from "@/lib/search/journal-entries";
import { findRecipeSummariesByIds } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { JournalEntryKind, type RecipeSummary } from "@/lib/types";
import type {
  OnThisDay,
  RecipeHistory,
  WallPhoto,
  YearReview,
  YearSnapshot,
} from "@/lib/types/journal-lookback-types";
import type {
  JournalEntryRecipe,
  JournalGroup,
} from "@/lib/types/journal-types";
import { isNextRedirectError } from "@/lib/utils";
import {
  cookedHeading,
  dayToTimestamp,
  JOURNAL_PAGE_SIZE,
  joinTitles,
  timestampToDay,
} from "@/lib/utils/journal";
import {
  buildHeatmap,
  busiestMonth,
  countByMonth,
  countCooksByDay,
  HIGHLIGHT_COUNT,
  longestStreak,
  OLD_FAVOURITE_GAP_DAYS,
  OLD_FAVOURITE_MIN_COOKS,
  rankCounts,
  sameDayLastMonth,
  TOP_RECIPE_COUNT,
  WALL_PHOTO_LIMIT,
  yearsAgoLabel,
} from "@/lib/utils/journal-lookback";
import { getRequestTimeZone } from "@/lib/utils/request-time-zone";
import { dayKeyIn } from "@/lib/utils/time-zone";

const logger = createOperationLogger("journal-lookback-actions");
const DAY_MS = 24 * 60 * 60 * 1000;
const ON_THIS_DAY_LIMIT = 20;

// Cooks are stored as moments; a year in any time zone fits inside this range
function yearRange(year: number): [Date, Date] {
  return [
    new Date(Date.UTC(year - 1, 11, 31)),
    new Date(Date.UTC(year + 1, 0, 1, 23, 59, 59)),
  ];
}

function entryYearRange(year: number): SQL {
  return and(
    gte(journalEntries.happenedAt, dayToTimestamp(`${year}-01-01`)),
    lte(journalEntries.happenedAt, dayToTimestamp(`${year}-12-31`)),
  ) as SQL;
}

export async function getOnThisDay(): Promise<OnThisDay> {
  try {
    const user = await getAuthenticatedUser();
    const today = dayKeyIn(new Date(), await getRequestTimeZone());
    const older = await loadJournalEntries(
      user.id,
      and(
        eq(journalEntries.userId, user.id),
        sql`strftime('%m-%d', ${journalEntries.happenedAt}, 'unixepoch') = ${today.slice(5)}`,
        lt(
          journalEntries.happenedAt,
          dayToTimestamp(`${today.slice(0, 4)}-01-01`),
        ),
      ) as SQL,
      ON_THIS_DAY_LIMIT,
    );

    if (older.length > 0) {
      const groups: JournalGroup[] = [];
      for (const entry of older) {
        const day = timestampToDay(entry.happenedAt);
        const group = groups.find((item) => item.key === day);
        if (group) group.entries.push(entry);
        else
          groups.push({
            key: day,
            label: yearsAgoLabel(day, today),
            entries: [entry],
          });
      }
      return { groups };
    }

    const monthAgo = sameDayLastMonth(today);
    if (!monthAgo) return { groups: [] };
    const recent = await loadJournalEntries(
      user.id,
      and(
        eq(journalEntries.userId, user.id),
        eq(journalEntries.happenedAt, dayToTimestamp(monthAgo)),
      ) as SQL,
      ON_THIS_DAY_LIMIT,
    );
    return {
      groups:
        recent.length > 0
          ? [{ key: monthAgo, label: "A month ago", entries: recent }]
          : [],
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load on this day", error);
    return { groups: [] };
  }
}

export async function getYearReview(year: number): Promise<YearReview | null> {
  try {
    const user = await getAuthenticatedUser();
    const zone = await getRequestTimeZone();
    const [from, to] = yearRange(year);
    const [cooks, firstCooks, entries, years] = await Promise.all([
      loadUserCooks(user.id, from, to),
      db
        .select({
          recipeId: recipeCooks.recipeId,
          first: min(recipeCooks.cookedAt),
        })
        .from(recipeCooks)
        .where(eq(recipeCooks.userId, user.id))
        .groupBy(recipeCooks.recipeId),
      loadJournalEntries(
        user.id,
        and(eq(journalEntries.userId, user.id), entryYearRange(year)) as SQL,
        JOURNAL_PAGE_SIZE,
      ),
      journalYears(user.id, year),
    ]);

    const inYear = cooks.filter((cook) =>
      dayKeyIn(cook.cookedAt, zone).startsWith(`${year}-`),
    );
    const dayCounts = countCooksByDay(inYear, zone, year);
    const months = countByMonth(dayCounts, year);
    const ranked = rankCounts(inYear.map((cook) => cook.recipeId));
    const summaries = await findRecipeSummariesByIds(
      user.id,
      ranked.slice(0, TOP_RECIPE_COUNT).map(([id]) => id),
    );
    const countById = new Map(ranked);
    const highlights = entries
      .filter(
        (entry) =>
          entry.kind === JournalEntryKind.COOKED && (entry.rating ?? 0) >= 4,
      )
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) ||
          b.photos.length - a.photos.length,
      )
      .slice(0, HIGHLIGHT_COUNT);

    return {
      year,
      totals: {
        cooks: inYear.length,
        recipes: ranked.length,
        newRecipes: firstCooks.filter(
          (row) =>
            row.first && dayKeyIn(row.first, zone).startsWith(`${year}-`),
        ).length,
        cookingDays: dayCounts.size,
        longestStreak: longestStreak([...dayCounts.keys()]),
        photos: entries.reduce((sum, entry) => sum + entry.photos.length, 0),
        notes: entries.filter((entry) => entry.kind === JournalEntryKind.NOTE)
          .length,
      },
      weeks: buildHeatmap(year, dayCounts),
      busiestDay: Math.max(0, ...dayCounts.values()),
      months,
      busiestMonth: busiestMonth(months),
      topRecipes: summaries.map((recipe) => ({
        recipe,
        count: countById.get(recipe.id) ?? 0,
      })),
      highlights,
      years,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load year in review", error, { year });
    return null;
  }
}

export async function getYearSnapshot(): Promise<YearSnapshot | null> {
  try {
    const user = await getAuthenticatedUser();
    const zone = await getRequestTimeZone();
    const today = dayKeyIn(new Date(), zone);
    const year = parseInt(today.slice(0, 4), 10);
    const [from, to] = yearRange(year);
    const cooks = (await loadUserCooks(user.id, from, to)).filter((cook) =>
      dayKeyIn(cook.cookedAt, zone).startsWith(`${year}-`),
    );
    return {
      year,
      month: parseInt(today.slice(5, 7), 10),
      cooks: cooks.length,
      recipes: new Set(cooks.map((cook) => cook.recipeId)).size,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load year snapshot", error);
    return null;
  }
}

function wallCaption(
  kind: string,
  title: string | null,
  links: JournalEntryRecipe[],
): string {
  const titles = joinTitles(links.map((link) => link.title));
  if (kind === JournalEntryKind.COOKED) return cookedHeading(titles);
  return title ?? titles ?? "Note";
}

export async function getJournalPhotos(): Promise<WallPhoto[]> {
  try {
    const user = await getAuthenticatedUser();
    const rows = await db
      .select({
        id: journalPhotos.id,
        filename: journalPhotos.filename,
        entryId: journalEntries.id,
        kind: journalEntries.kind,
        title: journalEntries.title,
        happenedAt: journalEntries.happenedAt,
      })
      .from(journalPhotos)
      .innerJoin(journalEntries, eq(journalPhotos.entryId, journalEntries.id))
      .where(eq(journalEntries.userId, user.id))
      .orderBy(
        desc(journalEntries.happenedAt),
        desc(journalEntries.createdAt),
        asc(journalPhotos.sortOrder),
      )
      .limit(WALL_PHOTO_LIMIT);

    const linksByEntry = await loadEntryRecipes(user.id, [
      ...new Set(rows.map((row) => row.entryId)),
    ]);
    return rows.map((row) => {
      const links = linksByEntry.get(row.entryId) ?? [];
      return {
        id: row.id,
        filename: row.filename,
        caption: wallCaption(row.kind, row.title, links),
        happenedAt: row.happenedAt,
        recipeSlug: links.find((link) => link.slug)?.slug ?? null,
      };
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load journal photos", error);
    return [];
  }
}

export async function getRecipeHistory(
  recipeId: string,
): Promise<RecipeHistory> {
  const empty = { count: 0, firstAt: null, lastAt: null, ratings: [] };
  try {
    const user = await getAuthenticatedUser();
    const [[cooks], rated] = await Promise.all([
      db
        .select({
          value: count(),
          firstAt: min(recipeCooks.cookedAt),
          lastAt: max(recipeCooks.cookedAt),
        })
        .from(recipeCooks)
        .where(
          and(
            eq(recipeCooks.recipeId, recipeId),
            eq(recipeCooks.userId, user.id),
          ),
        ),
      db
        .select({
          id: journalEntries.id,
          happenedAt: journalEntries.happenedAt,
          rating: journalEntries.rating,
        })
        .from(journalEntries)
        .where(
          and(
            entriesWithRecipe(recipeId),
            eq(journalEntries.userId, user.id),
            eq(journalEntries.kind, JournalEntryKind.COOKED),
            isNotNull(journalEntries.rating),
          ),
        )
        .orderBy(asc(journalEntries.happenedAt)),
    ]);
    return {
      count: cooks?.value ?? 0,
      firstAt: cooks?.firstAt ?? null,
      lastAt: cooks?.lastAt ?? null,
      ratings: rated.flatMap((row) =>
        row.rating
          ? [
              {
                entryId: row.id,
                day: timestampToDay(row.happenedAt),
                rating: row.rating,
              },
            ]
          : [],
      ),
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipe history", error, { recipeId });
    return empty;
  }
}

export async function getOldFavourites(
  limit: number,
): Promise<RecipeSummary[]> {
  try {
    const user = await getAuthenticatedUser();
    const lastCookedAt = max(recipeCooks.cookedAt);
    const times = count();
    const rows = await db
      .select({ id: recipeCooks.recipeId, lastCookedAt, times })
      .from(recipeCooks)
      .where(eq(recipeCooks.userId, user.id))
      .groupBy(recipeCooks.recipeId)
      .having(
        and(
          gte(times, OLD_FAVOURITE_MIN_COOKS),
          sql`${lastCookedAt} < ${Math.floor((Date.now() - OLD_FAVOURITE_GAP_DAYS * DAY_MS) / 1000)}`,
        ),
      )
      .orderBy(desc(times), asc(lastCookedAt))
      .limit(limit);

    const summaries = await findRecipeSummariesByIds(
      user.id,
      rows.map((row) => row.id),
    );
    const cookedAt = new Map(rows.map((row) => [row.id, row.lastCookedAt]));
    return summaries.map((summary) => ({
      ...summary,
      lastViewedAt: cookedAt.get(summary.id) ?? null,
    }));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load old favourites", error);
    return [];
  }
}
