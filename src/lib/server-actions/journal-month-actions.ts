"use server";

import { and, eq, gte, lte, min, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema.journal";
import { recipeCooks } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  journalYears,
  loadJournalEntries,
  loadUserCooks,
} from "@/lib/search/journal-entries";
import { findRecipeSummariesByIds } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { JournalEntryKind, type RecipeSummary } from "@/lib/types";
import type {
  CalendarDay,
  CookMoment,
  MonthReview,
} from "@/lib/types/journal-lookback-types";
import type { JournalEntry } from "@/lib/types/journal-types";
import { isNextRedirectError } from "@/lib/utils";
import {
  dayToTimestamp,
  JOURNAL_PAGE_SIZE,
  timestampToDay,
} from "@/lib/utils/journal";
import {
  buildMonthCalendar,
  monthCookRange,
  monthDays,
  monthPrefix,
  rankCounts,
  shiftMonth,
  TOP_RECIPE_COUNT,
} from "@/lib/utils/journal-lookback";
import { getRequestTimeZone } from "@/lib/utils/request-time-zone";
import { dayKeyIn } from "@/lib/utils/time-zone";

const logger = createOperationLogger("journal-month-actions");

function buildCalendar(
  year: number,
  month: number,
  cooks: CookMoment[],
  zone: string,
  summaries: Map<string, RecipeSummary>,
  entries: JournalEntry[],
): CalendarDay[][] {
  const prefix = monthPrefix(year, month);
  const cooksByDay = new Map<string, string[]>();
  for (const cook of cooks) {
    const day = dayKeyIn(cook.cookedAt, zone);
    cooksByDay.set(day, [...(cooksByDay.get(day) ?? []), cook.recipeId]);
  }
  const entriesByDay = new Map<string, JournalEntry[]>();
  for (const entry of entries) {
    const day = timestampToDay(entry.happenedAt);
    entriesByDay.set(day, [...(entriesByDay.get(day) ?? []), entry]);
  }

  return buildMonthCalendar(year, month).map((week) =>
    week.map((day) => {
      const ids = cooksByDay.get(day) ?? [];
      const dayEntries = entriesByDay.get(day) ?? [];
      const recipes = [...new Set(ids)].flatMap((id) => {
        const recipe = summaries.get(id);
        return recipe
          ? [{ id, title: recipe.title, swatch: recipe.swatch }]
          : [];
      });
      return {
        day,
        inMonth: day.startsWith(prefix),
        cooks: ids.length,
        recipes,
        photo:
          dayEntries.find((entry) => entry.photos.length > 0)?.photos[0]
            ?.filename ?? null,
        entries: dayEntries.length,
      };
    }),
  );
}

export async function getMonthReview(
  year: number,
  month: number,
): Promise<MonthReview | null> {
  try {
    const user = await getAuthenticatedUser();
    const zone = await getRequestTimeZone();
    const today = dayKeyIn(new Date(), zone);
    const prefix = monthPrefix(year, month);
    const previous = shiftMonth(year, month, -1);
    const next = shiftMonth(year, month, 1);
    const days = monthDays(year, month);
    const [from, to] = monthCookRange(year, month);

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
        and(
          eq(journalEntries.userId, user.id),
          gte(journalEntries.happenedAt, dayToTimestamp(days[0])),
          lte(
            journalEntries.happenedAt,
            dayToTimestamp(days.at(-1) ?? days[0]),
          ),
        ) as SQL,
        JOURNAL_PAGE_SIZE,
      ),
      journalYears(user.id, year),
    ]);

    const inMonth = cooks.filter((cook) =>
      dayKeyIn(cook.cookedAt, zone).startsWith(prefix),
    );
    const previousPrefix = monthPrefix(previous.year, previous.month);
    const ranked = rankCounts(inMonth.map((cook) => cook.recipeId));
    const newIds = firstCooks
      .filter(
        (row) => row.first && dayKeyIn(row.first, zone).startsWith(prefix),
      )
      .map((row) => row.recipeId);
    const summaries = await findRecipeSummariesByIds(
      user.id,
      ranked.map(([id]) => id),
    );
    const byId = new Map(summaries.map((recipe) => [recipe.id, recipe]));

    return {
      year,
      month,
      today,
      totals: {
        cooks: inMonth.length,
        recipes: ranked.length,
        newRecipes: newIds.length,
        cookingDays: new Set(
          inMonth.map((cook) => dayKeyIn(cook.cookedAt, zone)),
        ).size,
        photos: entries.reduce((sum, entry) => sum + entry.photos.length, 0),
        notes: entries.filter((entry) => entry.kind === JournalEntryKind.NOTE)
          .length,
      },
      previousCooks: cooks.filter((cook) =>
        dayKeyIn(cook.cookedAt, zone).startsWith(previousPrefix),
      ).length,
      weeks: buildCalendar(year, month, inMonth, zone, byId, entries),
      topRecipes: ranked.slice(0, TOP_RECIPE_COUNT).flatMap(([id, count]) => {
        const recipe = byId.get(id);
        return recipe ? [{ recipe, count }] : [];
      }),
      firstTries: newIds.flatMap((id) => byId.get(id) ?? []),
      entries,
      older: previous.year >= Math.min(...years) ? previous : null,
      newer:
        monthPrefix(next.year, next.month) <= today.slice(0, 8) ? next : null,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load month in review", error, { year, month });
    return null;
  }
}
