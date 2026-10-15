import { RecipeDifficulty } from "@/lib/types";
import type { RecipeImportResult } from "@/lib/types/import-types";
import type { RecipeFormData } from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

function clampServings(servings: number | null): number {
  const { MIN_SERVINGS, MAX_SERVINGS, DEFAULT_SERVINGS } =
    RECIPE_CONSTANTS.SERVING_LIMITS;
  if (servings === null) {
    return DEFAULT_SERVINGS;
  }
  return Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, servings));
}

export function mapImportResultToFormData(
  result: RecipeImportResult,
): Partial<RecipeFormData> {
  const { recipe } = result;

  return {
    title: recipe.title ?? "",
    description: recipe.description ?? "",
    servings: clampServings(recipe.servings),
    prepTimeMinutes: recipe.prepTime ?? 0,
    cookTimeMinutes: recipe.cookTime ?? 0,
    difficulty: recipe.difficulty ?? RecipeDifficulty.MEDIUM,
    cuisine: recipe.cuisine ?? "",
    sourceUrl: result.sourceUrl ?? "",
    sourceName: result.sourceName ?? "",
    isPublic: false,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.quantity ?? "",
      unit: ingredient.unit ?? "",
      notes: "",
      groupName: "",
      isOptional: false,
    })),
    instructions: recipe.instructions.map((instruction) => ({
      instruction: instruction.instruction,
      timeMinutes: instruction.timeMinutes ?? undefined,
      temperature: instruction.temperature ?? "",
      notes: "",
      groupName: "",
    })),
    tags: recipe.tags,
  };
}
