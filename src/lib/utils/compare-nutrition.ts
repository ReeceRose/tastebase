import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import type { CompareFact } from "@/lib/types/recipe-compare-types";
import {
  formatNutrient,
  hasNutrientValues,
  NUTRIENTS,
} from "@/lib/utils/nutrition";

// Nutrition is stored per serving, so the servings stepper never changes it.
// There's no "best" marker: fewer calories or more protein isn't better for
// everyone.
export function compareNutritionFacts(
  nutrition: (RecipeNutrition | null)[],
): CompareFact[] {
  const known = nutrition.map((entry) =>
    hasNutrientValues(entry) ? entry : null,
  );
  if (known.every((entry) => entry === null)) return [];

  const facts: CompareFact[] = NUTRIENTS.map((nutrient) => ({
    label: nutrient.label,
    bestLabel: null,
    cells: known.map((entry) => ({
      value: formatNutrient(entry?.[nutrient.key] ?? null, nutrient.unit),
      best: false,
    })),
  })).filter((fact) => fact.cells.some((cell) => cell.value !== null));

  const sizes = known.map((entry) => entry?.servingSize?.trim() || null);
  const listedSizes = known.flatMap((entry, index) =>
    entry ? [sizes[index]?.toLowerCase() ?? null] : [],
  );
  if (new Set(listedSizes).size > 1) {
    facts.unshift({
      label: "Serving size",
      bestLabel: null,
      cells: sizes.map((value) => ({ value, best: false })),
    });
  }

  return facts;
}
