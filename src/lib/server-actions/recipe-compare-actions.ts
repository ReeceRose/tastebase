"use server";

import { and, asc, notInArray, or } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { contains, likePattern } from "@/lib/search/recipe-text-search";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import { getRecipeCookSummary } from "@/lib/server-actions/recipe-cook-actions";
import type {
  CompareCandidate,
  CompareCandidatesResult,
  CompareRecipe,
  CompareRecipesResult,
} from "@/lib/types/recipe-compare-types";
import { isNextRedirectError } from "@/lib/utils";
import { recipeIsVisibleTo } from "@/lib/utils/linked-recipes";
import { MAX_COMPARE_RECIPES } from "@/lib/utils/recipe-compare";
import { averageRating } from "@/lib/utils/recipe-utils";
import { resolveSwatch } from "@/lib/utils/swatches";

const logger = createOperationLogger("recipe-compare-actions");
const RESULT_LIMIT = 8;
const SUGGESTION_POOL = 40;
const MAX_QUERY_LENGTH = 100;
const MIN_WORD_LENGTH = 3;

const TITLE_STOP_WORDS = new Set([
  "recipe",
  "recipes",
  "the",
  "and",
  "with",
  "best",
  "easy",
  "simple",
  "quick",
  "ever",
  "homemade",
  "classic",
  "perfect",
  "ultimate",
  "real",
  "deal",
  "foolproof",
  "food",
  "lab",
  "lab's",
  "style",
]);

async function loadCompareRecipe(slug: string): Promise<CompareRecipe | null> {
  const result = await getRecipeBySlug(slug);
  if (!result.success || !result.data) return null;
  const cooks = await getRecipeCookSummary(result.data.id);
  return {
    recipe: result.data,
    cooks,
    averageRating: averageRating(result.data),
  };
}

export async function getRecipesToCompare(
  slugs: string[],
): Promise<CompareRecipesResult> {
  const wanted = slugs.slice(0, MAX_COMPARE_RECIPES);
  const loaded = await Promise.all(
    wanted.map((slug) => loadCompareRecipe(slug).catch(() => null)),
  );
  const found = loaded.filter((item): item is CompareRecipe => item !== null);
  return { recipes: found, missing: wanted.length - found.length };
}

function titleWords(titles: string[]): string[] {
  const words = titles
    .join(" ")
    .toLowerCase()
    .split(/[^a-z'’-]+/)
    .map((word) => word.replace(/^['’-]+|['’-]+$/g, ""))
    .filter(
      (word) => word.length >= MIN_WORD_LENGTH && !TITLE_STOP_WORDS.has(word),
    );
  return [...new Set(words)];
}

function overlap(title: string, words: string[]): number {
  const lower = title.toLowerCase();
  return words.filter((word) => lower.includes(word)).length;
}

export async function searchRecipesToCompare(
  query: string,
  excludeIds: string[],
  chosenTitles: string[],
): Promise<CompareCandidatesResult> {
  try {
    const user = await getAuthenticatedUser();
    const typed = query.slice(0, MAX_QUERY_LENGTH).trim();
    const similar = typed ? [] : titleWords(chosenTitles);
    const searchWords = typed ? typed.split(/\s+/) : similar;
    const wordFilters = searchWords.map((word) =>
      contains(recipes.title, likePattern(word)),
    );
    const matchWords =
      wordFilters.length === 0
        ? []
        : typed
          ? wordFilters
          : [or(...wordFilters)];

    const found = await db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        title: recipes.title,
        swatch: recipes.swatch,
        sourceName: recipes.sourceName,
      })
      .from(recipes)
      .where(
        and(
          recipeIsVisibleTo(user.id),
          ...(excludeIds.length > 0
            ? [notInArray(recipes.id, excludeIds)]
            : []),
          ...matchWords,
        ),
      )
      .orderBy(asc(recipes.title))
      .limit(typed ? RESULT_LIMIT : SUGGESTION_POOL);

    const candidates: CompareCandidate[] = found.map((recipe) => ({
      ...recipe,
      swatch: resolveSwatch(recipe.id, recipe.swatch),
    }));

    if (typed) {
      return { success: true, suggested: false, recipes: candidates };
    }

    if (similar.length > 0 && candidates.length > 0) {
      const ranked = [...candidates]
        .sort((a, b) => overlap(b.title, similar) - overlap(a.title, similar))
        .slice(0, RESULT_LIMIT);
      return { success: true, suggested: true, recipes: ranked };
    }

    if (similar.length > 0) {
      return searchRecipesToCompare("", excludeIds, []);
    }

    return {
      success: true,
      suggested: false,
      recipes: candidates.slice(0, RESULT_LIMIT),
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to search recipes to compare", error);
    return { success: false, suggested: false, recipes: [] };
  }
}
