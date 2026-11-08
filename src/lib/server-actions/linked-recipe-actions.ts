"use server";

import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { recipeIngredients, recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { contains, likePattern } from "@/lib/search/recipe-text-search";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import type { LinkedRecipe } from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";
import { recipeIsVisibleTo } from "@/lib/utils/linked-recipes";

const logger = createOperationLogger("linked-recipe-actions");
const RESULT_LIMIT = 8;
const USED_IN_LIMIT = 20;
const MAX_QUERY_LENGTH = 100;

interface LinkableRecipeResult {
  success: boolean;
  recipes: LinkedRecipe[];
}

export async function searchLinkableRecipes(
  query: string,
  excludeRecipeId: string | null,
): Promise<LinkableRecipeResult> {
  try {
    const user = await getAuthenticatedUser();
    const words = query
      .slice(0, MAX_QUERY_LENGTH)
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => contains(recipes.title, likePattern(word)));

    const found = await db
      .select({ id: recipes.id, slug: recipes.slug, title: recipes.title })
      .from(recipes)
      .where(
        and(
          recipeIsVisibleTo(user.id),
          ...(excludeRecipeId ? [ne(recipes.id, excludeRecipeId)] : []),
          ...words,
        ),
      )
      .orderBy(asc(recipes.title))
      .limit(RESULT_LIMIT);

    return { success: true, recipes: found };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to search recipes to link", error);
    return { success: false, recipes: [] };
  }
}

export async function getRecipesUsing(
  recipeId: string,
): Promise<LinkableRecipeResult> {
  try {
    const user = await getAuthenticatedUser();
    const found = await db
      .selectDistinct({
        id: recipes.id,
        slug: recipes.slug,
        title: recipes.title,
      })
      .from(recipeIngredients)
      .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
      .where(
        and(
          eq(recipeIngredients.linkedRecipeId, recipeId),
          recipeIsVisibleTo(user.id),
        ),
      )
      .orderBy(asc(recipes.title))
      .limit(USED_IN_LIMIT);

    return { success: true, recipes: found };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipes using this one", error, {
      recipeId,
    });
    return { success: false, recipes: [] };
  }
}
