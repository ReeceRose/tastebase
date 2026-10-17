import { and, asc, desc, eq, inArray, max, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeFavorites,
  recipeImages,
  recipes,
  recipeViews,
} from "@/db/schema.recipes";
import type { RecipeHeroImage, RecipeSummary } from "@/lib/types";
import { resolveSwatch } from "@/lib/utils/swatches";

interface SummaryQuery {
  userId: string;
  where?: SQL;
  orderBy?: SQL[];
  limit: number;
}

const summaryColumns = {
  id: recipes.id,
  slug: recipes.slug,
  title: recipes.title,
  description: recipes.description,
  swatch: recipes.swatch,
  prepTimeMinutes: recipes.prepTimeMinutes,
  cookTimeMinutes: recipes.cookTimeMinutes,
  difficulty: recipes.difficulty,
  cuisine: recipes.cuisine,
  isPublic: recipes.isPublic,
  createdAt: recipes.createdAt,
  authorId: recipes.userId,
  authorName: users.name,
};

function selectSummaries() {
  return db
    .select(summaryColumns)
    .from(recipes)
    .innerJoin(users, eq(recipes.userId, users.id));
}

type SummaryRow = Awaited<ReturnType<typeof selectSummaries>>[number];

export function visibleTo(userId: string): SQL {
  return and(
    eq(recipes.isArchived, false),
    or(eq(recipes.userId, userId), eq(recipes.isPublic, true)),
  ) as SQL;
}

function totalMinutes(row: SummaryRow): number | null {
  const total = (row.prepTimeMinutes ?? 0) + (row.cookTimeMinutes ?? 0);
  return total > 0 ? total : null;
}

async function hydrate(
  rows: SummaryRow[],
  userId: string,
  viewedAt: Map<string, Date>,
): Promise<RecipeSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [images, favourites] = await Promise.all([
    db
      .select({
        recipeId: recipeImages.recipeId,
        filename: recipeImages.filename,
        altText: recipeImages.altText,
      })
      .from(recipeImages)
      .where(inArray(recipeImages.recipeId, ids))
      .orderBy(desc(recipeImages.isHero), asc(recipeImages.sortOrder)),
    db
      .select({ recipeId: recipeFavorites.recipeId })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.userId, userId),
          inArray(recipeFavorites.recipeId, ids),
        ),
      ),
  ]);

  const heroByRecipe = new Map<string, RecipeHeroImage>();
  for (const image of images) {
    if (!heroByRecipe.has(image.recipeId)) {
      heroByRecipe.set(image.recipeId, {
        filename: image.filename,
        altText: image.altText,
      });
    }
  }
  const favouriteIds = new Set(favourites.map((row) => row.recipeId));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    swatch: resolveSwatch(row.id, row.swatch),
    totalMinutes: totalMinutes(row),
    difficulty: row.difficulty,
    cuisine: row.cuisine,
    isPublic: row.isPublic,
    author: { id: row.authorId, name: row.authorName ?? "Someone" },
    heroImage: heroByRecipe.get(row.id) ?? null,
    isFavourite: favouriteIds.has(row.id),
    createdAt: row.createdAt,
    lastViewedAt: viewedAt.get(row.id) ?? null,
  }));
}

export async function findRecipeSummaries({
  userId,
  where,
  orderBy = [desc(recipes.createdAt)],
  limit,
}: SummaryQuery): Promise<RecipeSummary[]> {
  const conditions = where ? and(visibleTo(userId), where) : visibleTo(userId);
  const rows = await selectSummaries()
    .where(conditions)
    .orderBy(...orderBy)
    .limit(limit);

  return hydrate(rows, userId, new Map());
}

export async function findRecentlyViewedSummaries(
  userId: string,
  limit: number,
): Promise<RecipeSummary[]> {
  const lastViewed = max(recipeViews.viewedAt);
  const views = await db
    .select({ recipeId: recipeViews.recipeId, viewedAt: lastViewed })
    .from(recipeViews)
    .where(eq(recipeViews.userId, userId))
    .groupBy(recipeViews.recipeId)
    .orderBy(desc(lastViewed))
    .limit(limit * 2);

  if (views.length === 0) return [];

  const viewedAt = new Map<string, Date>();
  for (const view of views) {
    if (view.viewedAt) viewedAt.set(view.recipeId, view.viewedAt);
  }

  const rows = await selectSummaries().where(
    and(
      visibleTo(userId),
      inArray(
        recipes.id,
        views.map((view) => view.recipeId),
      ),
    ),
  );

  const ordered = rows
    .sort(
      (a, b) =>
        (viewedAt.get(b.id)?.getTime() ?? 0) -
        (viewedAt.get(a.id)?.getTime() ?? 0),
    )
    .slice(0, limit);

  return hydrate(ordered, userId, viewedAt);
}

export async function findRecipeSummariesByIds(
  userId: string,
  ids: string[],
): Promise<RecipeSummary[]> {
  if (ids.length === 0) return [];
  const rows = await selectSummaries().where(
    and(visibleTo(userId), inArray(recipes.id, ids)),
  );
  const position = new Map(ids.map((id, index) => [id, index]));
  rows.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0));
  return hydrate(rows, userId, new Map());
}
