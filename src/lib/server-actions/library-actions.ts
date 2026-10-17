"use server";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { recipeFavorites, recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { searchRecipes } from "@/lib/search/recipe-search";
import {
  findRecipeSummariesByIds,
  visibleTo,
} from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { getHouseholdMembers } from "@/lib/server-actions/household-actions";
import { getAllUserTags } from "@/lib/server-actions/recipe-tags-actions";
import {
  LibraryScope,
  LibrarySort,
  LibraryVisibility,
  SortOrder,
} from "@/lib/types";
import type {
  LibraryFacets,
  LibraryFilters,
  LibraryResult,
  RecipeSearchParams,
} from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";
import { LIBRARY_PAGE_SIZE } from "@/lib/utils/library-params";

const logger = createOperationLogger("library-actions");

type SearchSort = NonNullable<RecipeSearchParams["sortBy"]>;

const SORTS: Record<LibrarySort, { sortBy: SearchSort; order: SortOrder }> = {
  [LibrarySort.NEWEST]: { sortBy: "createdAt", order: SortOrder.DESC },
  [LibrarySort.RATING]: { sortBy: "averageRating", order: SortOrder.DESC },
  [LibrarySort.QUICKEST]: { sortBy: "totalTime", order: SortOrder.ASC },
  [LibrarySort.TITLE]: { sortBy: "title", order: SortOrder.ASC },
  [LibrarySort.UPDATED]: { sortBy: "updatedAt", order: SortOrder.DESC },
};

const EMPTY_RESULT: LibraryResult = { recipes: [], total: 0, hasMore: false };

async function favouriteIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ recipeId: recipeFavorites.recipeId })
    .from(recipeFavorites)
    .where(eq(recipeFavorites.userId, userId));
  return rows.map((row) => row.recipeId);
}

export async function getLibraryPage(
  filters: LibraryFilters,
): Promise<LibraryResult> {
  try {
    const user = await getAuthenticatedUser();
    const limit = LIBRARY_PAGE_SIZE * filters.page;
    const sort = filters.sort
      ? SORTS[filters.sort]
      : filters.query
        ? { sortBy: "relevance" as SearchSort, order: SortOrder.DESC }
        : SORTS[LibrarySort.NEWEST];

    const ownOnly = filters.visibility !== LibraryVisibility.ALL;
    const result = await searchRecipes(user.id, {
      query: filters.query ?? undefined,
      authorId: ownOnly ? user.id : (filters.authorId ?? undefined),
      isPublic:
        filters.visibility === LibraryVisibility.PRIVATE ? false : undefined,
      difficulty: filters.difficulty ? [filters.difficulty] : undefined,
      cuisine: filters.cuisine ? [filters.cuisine] : undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      maxTotalTime: filters.maxTime ?? undefined,
      recipeIds:
        filters.scope === LibraryScope.FAVOURITES
          ? await favouriteIds(user.id)
          : undefined,
      sortBy: sort.sortBy,
      sortOrder: sort.order,
      recordHistory: false,
      limit,
      offset: 0,
    });

    const recipesOnPage = await findRecipeSummariesByIds(
      user.id,
      result.recipes.map((recipe) => recipe.id),
    );

    return {
      recipes: recipesOnPage,
      total: result.total,
      hasMore: result.total > recipesOnPage.length,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipe library", error, {
      scope: filters.scope,
    });
    return EMPTY_RESULT;
  }
}

export async function getLibraryFacets(): Promise<LibraryFacets> {
  try {
    const user = await getAuthenticatedUser();
    const [members, cuisineRows, tagResult] = await Promise.all([
      getHouseholdMembers().catch(() => undefined),
      db
        .selectDistinct({ cuisine: recipes.cuisine })
        .from(recipes)
        .where(and(visibleTo(user.id), isNotNull(recipes.cuisine)))
        .orderBy(asc(recipes.cuisine))
        .catch(() => undefined),
      getAllUserTags().catch(() => undefined),
    ]);

    return {
      members: members ?? [],
      cuisines: (cuisineRows ?? [])
        .map((row) => row.cuisine?.trim())
        .filter((cuisine): cuisine is string => Boolean(cuisine)),
      tags:
        tagResult?.success && tagResult.data
          ? tagResult.data.map((tag) => tag.name)
          : [],
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load library facets", error);
    return { members: [], cuisines: [], tags: [] };
  }
}
