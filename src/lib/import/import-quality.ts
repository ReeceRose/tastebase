import { MEASURE, SINGLE_QUANTITY } from "@/lib/import/ingredient-vocabulary";
import {
  IngredientIssue,
  type ParsedIngredient,
  type RecipeParsingResult,
} from "@/lib/types/import-types";

const MAX_NAME_LENGTH = 100;
const MAX_CHECKED_NAMES = 5;
const MAX_PAGE_INGREDIENTS = 60;
const MIN_MEASURED_SHARE = 0.5;
const MIN_PAGE_INGREDIENTS = 2;
const MIN_UNHEADED_INGREDIENTS = 3;
const MIN_UNHEADED_STEPS = 2;

const AMOUNT_AT_START = new RegExp(`^\\W*${MEASURE}(?:\\s|$)`, "i");
const NUMBER_AT_START = new RegExp(`^\\W*${SINGLE_QUANTITY}(?:\\s|$)`);
const UNIT_AT_START =
  /^(?:tablespoons?|teaspoons?|tbsps?|tsps?|cups?|ounces?|oz|pounds?|lbs?|grams?|kg|ml|litres?|liters?)\b/i;
const PAGE_NOISE =
  /^(?:comments?|shares?|reviews?\b.*|ratings?\b.*|mins?|minutes?|hrs?\b.*|hours?\b.*|print|pin|jump to.*|save recipe|x\d.*)$/i;
const LISTICLE_TITLE =
  /^(?:the\s+|our\s+|top\s+)?\d+\+?\s+(?:\w+\s+){0,6}?(?:recipes|dishes|ideas|meals|dinners|desserts|cookies|pies|salads|soups|ways)\b/i;

export const MIN_CONFIDENCE_WITHOUT_WARNING = 0.6;

export function findIngredientIssues(
  ingredient: ParsedIngredient,
): IngredientIssue[] {
  const { name, quantity, unit } = ingredient;
  const issues: IngredientIssue[] = [];
  if (!/\p{L}{2}/u.test(name)) {
    issues.push(IngredientIssue.NO_NAME);
  }
  if (/^[^\p{L}\p{N}(¿]|[,;:/\-–—]$/u.test(name)) {
    issues.push(IngredientIssue.STRAY_PUNCTUATION);
  }
  if (!quantity && (AMOUNT_AT_START.test(name) || NUMBER_AT_START.test(name))) {
    issues.push(IngredientIssue.AMOUNT_IN_NAME);
  }
  if (quantity && !unit && UNIT_AT_START.test(name)) {
    issues.push(IngredientIssue.UNIT_IN_NAME);
  }
  if (name.split("(").length !== name.split(")").length) {
    issues.push(IngredientIssue.UNBALANCED_BRACKETS);
  }
  if (name.length > MAX_NAME_LENGTH) {
    issues.push(IngredientIssue.TOO_LONG);
  }
  if (PAGE_NOISE.test(name.trim())) {
    issues.push(IngredientIssue.PAGE_NOISE);
  }
  return issues;
}

export function doubtfulIngredients(
  ingredients: ParsedIngredient[],
): ParsedIngredient[] {
  return ingredients.filter((row) => findIngredientIssues(row).length > 0);
}

function cleanShare(ingredients: ParsedIngredient[]): number {
  if (ingredients.length === 0) return 0;
  const doubtful = doubtfulIngredients(ingredients).length;
  return (ingredients.length - doubtful) / ingredients.length;
}

// Structured data is complete by the site's own account, so its score only
// falls for what actually came out wrong.
export function scoreStructuredRecipe(recipe: RecipeParsingResult): number {
  const score = 0.5 + 0.45 * cleanShare(recipe.ingredients);
  return Math.round(score * 100) / 100;
}

export function adjustForRowQuality(
  confidence: number,
  recipe: RecipeParsingResult,
): number {
  if (recipe.ingredients.length === 0) return confidence;
  const score = confidence * (0.5 + 0.5 * cleanShare(recipe.ingredients));
  return Math.round(score * 100) / 100;
}

function quoted(names: string[]): string {
  const items = names.map((name) => `"${name}"`);
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function ingredientWarning(
  ingredients: ParsedIngredient[],
): string | null {
  const doubtful = doubtfulIngredients(ingredients);
  if (doubtful.length === 0) return null;
  const names = doubtful
    .slice(0, MAX_CHECKED_NAMES)
    .map((row) => row.name.slice(0, 40));
  const others = doubtful.length - names.length;
  const more = others > 0 ? ` and ${others} more` : "";
  return `These ingredients may have imported wrongly: ${quoted(names)}${more}.`;
}

function measuredShare(ingredients: ParsedIngredient[]): number {
  if (ingredients.length === 0) return 0;
  const measured = ingredients.filter((row) => row.quantity && row.unit).length;
  return measured / ingredients.length;
}

// Text from a web page only counts as a recipe if it reads like one. Pasted
// text doesn't go through this: there the person already chose what to import.
export function pageTextIsRecipe(
  recipe: RecipeParsingResult,
  foundHeadings: boolean,
): boolean {
  const { ingredients, instructions, title } = recipe;
  if (title && LISTICLE_TITLE.test(title)) return false;
  if (ingredients.length > MAX_PAGE_INGREDIENTS) return false;
  if (instructions.length === 0) return false;
  if (cleanShare(ingredients) < MIN_MEASURED_SHARE) return false;
  if (measuredShare(ingredients) < MIN_MEASURED_SHARE) return false;
  return foundHeadings
    ? ingredients.length >= MIN_PAGE_INGREDIENTS
    : ingredients.length >= MIN_UNHEADED_INGREDIENTS &&
        instructions.length >= MIN_UNHEADED_STEPS;
}

export function notARecipeWarning(title: string | null): string {
  return title && LISTICLE_TITLE.test(title)
    ? "This page looks like a list of recipes. Open the one you want and import that page."
    : "This page doesn't look like a recipe, so nothing was filled in. If it is one, copy the text and paste it instead.";
}
