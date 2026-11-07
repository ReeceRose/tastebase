import { RecipeDifficulty } from "@/lib/types";
import type {
  ParsedIngredient,
  RecipeImportResult,
} from "@/lib/types/import-types";
import type {
  EditorIngredient,
  RecipeFormData,
} from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

function clampServings(servings: number | null): number {
  const { MIN_SERVINGS, MAX_SERVINGS, DEFAULT_SERVINGS } =
    RECIPE_CONSTANTS.SERVING_LIMITS;
  if (servings === null) {
    return DEFAULT_SERVINGS;
  }
  return Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, servings));
}

const MAX_AMOUNT_LENGTH = 20;
const MAX_NOTES_LENGTH = 200;
const MAX_GROUP_LENGTH = 50;

function clampText(text: string | null, limit: number): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

// The editor's limits decide whether a recipe can be saved, so imported text
// has to fit them. An amount too long to read as one goes back with the name.
function mapIngredient(ingredient: ParsedIngredient): EditorIngredient {
  const amount = ingredient.quantity ?? "";
  const tooLong = amount.length > MAX_AMOUNT_LENGTH;
  return {
    name: tooLong ? `${amount} ${ingredient.name}` : ingredient.name,
    amount: tooLong ? "" : amount,
    unit: ingredient.unit ?? "",
    notes: clampText(ingredient.notes, MAX_NOTES_LENGTH),
    groupName: clampText(ingredient.groupName, MAX_GROUP_LENGTH),
    isOptional: ingredient.isOptional,
  };
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
    ingredients: recipe.ingredients.map(mapIngredient),
    instructions: recipe.instructions.map((instruction) => ({
      instruction: instruction.instruction,
      timeMinutes: instruction.timeMinutes ?? undefined,
      temperature: instruction.temperature ?? "",
      notes: "",
      groupName: clampText(instruction.groupName, MAX_GROUP_LENGTH),
    })),
    tags: recipe.tags,
  };
}
