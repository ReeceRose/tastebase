"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { searchRecipes } from "@/lib/search/recipe-search";
import { SortOrder } from "@/lib/types";
import type { RecipeWithDetails } from "@/lib/types/recipe-types";

const logger = createOperationLogger("global-search-actions");

interface GlobalSearchResult {
  success: boolean;
  recipes: RecipeWithDetails[];
  error?: string;
}

export async function performGlobalSearch(
  query: string,
  limit: number = 8,
): Promise<GlobalSearchResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        recipes: [],
        error: "Authentication required",
      };
    }

    logger.info(
      { userId: session.user.id, query, limit },
      "Performing global search",
    );

    const searchResult = await searchRecipes(session.user.id, {
      query: query.trim(),
      limit,
      offset: 0,
      sortBy: "createdAt",
      sortOrder: SortOrder.DESC,
    });

    return {
      success: true,
      recipes: searchResult.recipes,
    };
  } catch (error) {
    logError(logger, "Global search failed", error, { query, limit });
    return {
      success: false,
      recipes: [],
      error: "Search failed",
    };
  }
}
