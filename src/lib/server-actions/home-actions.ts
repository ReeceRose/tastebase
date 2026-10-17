"use server";

import { and, asc, desc, eq, gte, inArray, max, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeCooks,
  recipeFavorites,
  recipeModifications,
  recipeNotes,
  recipes,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  findRecentlyViewedSummaries,
  findRecipeSummaries,
  findRecipeSummariesByIds,
  visibleTo,
} from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import {
  ActivityKind,
  type HouseActivityItem,
  type RecipeSummary,
} from "@/lib/types";
import { isNextRedirectError } from "@/lib/utils";
import { resolveSwatch } from "@/lib/utils/swatches";

const logger = createOperationLogger("home-actions");

const FEATURE_WINDOW_DAYS = 14;
const EXCERPT_LENGTH = 120;

export async function getFeaturedRecipe(): Promise<RecipeSummary | null> {
  try {
    const user = await getAuthenticatedUser();
    const since = new Date(Date.now() - FEATURE_WINDOW_DAYS * 86_400_000);

    const [freshFromHouse] = await findRecipeSummaries({
      userId: user.id,
      where: and(
        ne(recipes.userId, user.id),
        eq(recipes.isPublic, true),
        gte(recipes.createdAt, since),
      ),
      limit: 1,
    });
    if (freshFromHouse) return freshFromHouse;

    const favourites = await db
      .select({ recipeId: recipeFavorites.recipeId })
      .from(recipeFavorites)
      .where(eq(recipeFavorites.userId, user.id))
      .orderBy(sql`random()`)
      .limit(1);
    if (favourites.length > 0) {
      const [favourite] = await findRecipeSummaries({
        userId: user.id,
        where: inArray(
          recipes.id,
          favourites.map((row) => row.recipeId),
        ),
        limit: 1,
      });
      if (favourite) return favourite;
    }

    const [newest] = await findRecipeSummaries({ userId: user.id, limit: 1 });
    return newest ?? null;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load featured recipe", error);
    return null;
  }
}

export async function getLatestFromHouse(
  limit: number,
): Promise<RecipeSummary[]> {
  try {
    const user = await getAuthenticatedUser();
    const fromOthers = await findRecipeSummaries({
      userId: user.id,
      where: and(ne(recipes.userId, user.id), eq(recipes.isPublic, true)),
      limit,
    });
    if (fromOthers.length > 0) return fromOthers;
    return await findRecipeSummaries({ userId: user.id, limit });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load latest recipes", error);
    return [];
  }
}

export async function getRecentlyOpened(
  limit: number,
): Promise<RecipeSummary[]> {
  try {
    const user = await getAuthenticatedUser();
    return await findRecentlyViewedSummaries(user.id, limit);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recently opened recipes", error);
    return [];
  }
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT_LENGTH
    ? `${flat.slice(0, EXCERPT_LENGTH - 1)}…`
    : flat;
}

export async function getHouseActivity(
  limit: number,
): Promise<HouseActivityItem[]> {
  try {
    const user = await getAuthenticatedUser();

    const [added, notes, cooks, edits] = await Promise.all([
      db
        .select({
          id: recipes.id,
          slug: recipes.slug,
          title: recipes.title,
          swatch: recipes.swatch,
          at: recipes.createdAt,
          actorId: users.id,
          actorName: users.name,
        })
        .from(recipes)
        .innerJoin(users, eq(recipes.userId, users.id))
        .where(
          and(
            visibleTo(user.id),
            eq(recipes.isPublic, true),
            ne(recipes.userId, user.id),
          ),
        )
        .orderBy(desc(recipes.createdAt))
        .limit(limit),
      db
        .select({
          id: recipeNotes.id,
          content: recipeNotes.content,
          at: recipeNotes.createdAt,
          recipeId: recipes.id,
          slug: recipes.slug,
          title: recipes.title,
          swatch: recipes.swatch,
          actorId: users.id,
          actorName: users.name,
        })
        .from(recipeNotes)
        .innerJoin(recipes, eq(recipeNotes.recipeId, recipes.id))
        .innerJoin(users, eq(recipeNotes.userId, users.id))
        .where(
          and(
            visibleTo(user.id),
            eq(recipeNotes.isPrivate, false),
            ne(recipeNotes.userId, user.id),
          ),
        )
        .orderBy(desc(recipeNotes.createdAt))
        .limit(limit),
      db
        .select({
          id: recipeCooks.id,
          at: recipeCooks.cookedAt,
          recipeId: recipes.id,
          slug: recipes.slug,
          title: recipes.title,
          swatch: recipes.swatch,
          actorId: users.id,
          actorName: users.name,
        })
        .from(recipeCooks)
        .innerJoin(recipes, eq(recipeCooks.recipeId, recipes.id))
        .innerJoin(users, eq(recipeCooks.userId, users.id))
        .where(
          and(
            visibleTo(user.id),
            eq(recipes.isPublic, true),
            ne(recipeCooks.userId, user.id),
          ),
        )
        .orderBy(desc(recipeCooks.cookedAt))
        .limit(limit),
      db
        .select({
          id: recipeModifications.id,
          at: recipeModifications.createdAt,
          description: recipeModifications.changeDescription,
          recipeId: recipes.id,
          slug: recipes.slug,
          title: recipes.title,
          swatch: recipes.swatch,
          actorId: users.id,
          actorName: users.name,
        })
        .from(recipeModifications)
        .innerJoin(recipes, eq(recipeModifications.recipeId, recipes.id))
        .innerJoin(users, eq(recipeModifications.userId, users.id))
        .where(
          and(
            visibleTo(user.id),
            eq(recipes.isPublic, true),
            ne(recipeModifications.userId, user.id),
          ),
        )
        .orderBy(desc(recipeModifications.createdAt))
        .limit(limit * 3),
    ]);

    const seenEdits = new Set<string>();
    const latestEdits = edits.filter((row) => {
      const key = `${row.actorId}:${row.recipeId}`;
      if (seenEdits.has(key)) return false;
      seenEdits.add(key);
      return true;
    });

    const items: HouseActivityItem[] = [
      ...added.map((row) => ({
        id: `added-${row.id}`,
        kind: ActivityKind.ADDED,
        actor: { id: row.actorId, name: row.actorName },
        recipe: {
          slug: row.slug,
          title: row.title,
          swatch: resolveSwatch(row.id, row.swatch),
        },
        at: row.at,
        excerpt: null,
      })),
      ...notes.map((row) => ({
        id: `note-${row.id}`,
        kind: ActivityKind.NOTE,
        actor: { id: row.actorId, name: row.actorName },
        recipe: {
          slug: row.slug,
          title: row.title,
          swatch: resolveSwatch(row.recipeId, row.swatch),
        },
        at: row.at,
        excerpt: excerpt(row.content),
      })),
      ...latestEdits.map((row) => ({
        id: `edited-${row.id}`,
        kind: ActivityKind.EDITED,
        actor: { id: row.actorId, name: row.actorName },
        recipe: {
          slug: row.slug,
          title: row.title,
          swatch: resolveSwatch(row.recipeId, row.swatch),
        },
        at: row.at,
        excerpt: row.description,
      })),
      ...cooks.map((row) => ({
        id: `cooked-${row.id}`,
        kind: ActivityKind.COOKED,
        actor: { id: row.actorId, name: row.actorName },
        recipe: {
          slug: row.slug,
          title: row.title,
          swatch: resolveSwatch(row.recipeId, row.swatch),
        },
        at: row.at,
        excerpt: null,
      })),
    ];

    return items
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load house activity", error);
    return [];
  }
}

export async function getForgottenRecipes(
  limit: number,
): Promise<RecipeSummary[]> {
  try {
    const user = await getAuthenticatedUser();
    const lastCookedAt = max(recipeCooks.cookedAt);
    const rows = await db
      .select({ id: recipes.id, lastCookedAt })
      .from(recipes)
      .innerJoin(recipeCooks, eq(recipeCooks.recipeId, recipes.id))
      .where(visibleTo(user.id))
      .groupBy(recipes.id)
      .orderBy(asc(lastCookedAt))
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
    logError(logger, "Failed to load forgotten recipes", error);
    return [];
  }
}
