"use server";

import { createOperationLogger, logError } from "@/lib/logging/logger";
import { searchRecipes } from "@/lib/search/recipe-search";
import { findRecipeSummariesByIds } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { SortOrder } from "@/lib/types";
import type { RecipeSummary } from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";

const logger = createOperationLogger("global-search-actions");

interface GlobalSearchResult {
  success: boolean;
  recipes: RecipeSummary[];
  total: number;
  error: string | null;
}

export async function performGlobalSearch(
  query: string,
  limit: number = 8,
): Promise<GlobalSearchResult> {
  try {
    const user = await getAuthenticatedUser();
    const result = await searchRecipes(user.id, {
      query: query.trim(),
      limit,
      offset: 0,
      sortBy: "relevance",
      sortOrder: SortOrder.DESC,
      recordHistory: false,
    });
    const recipes = await findRecipeSummariesByIds(
      user.id,
      result.recipes.map((recipe) => recipe.id),
    );
    return { success: true, recipes, total: result.total, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Global search failed", error, { query });
    return { success: false, recipes: [], total: 0, error: "Search failed" };
  }
}
