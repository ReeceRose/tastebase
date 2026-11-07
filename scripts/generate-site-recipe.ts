// Writes the amounts for the sample recipe on the marketing site, using the
// app's own scaling and unit conversion so the preview matches Tastebase.
// Run with: pnpm exec tsx scripts/generate-site-recipe.ts
import { writeFileSync } from "node:fs";
import { MeasurementUnit } from "@/lib/types";
import { displayIngredientAmount } from "@/lib/utils/ingredient-scaling";

const BASE_SERVINGS = 4;
const MAX_SERVINGS = 12;

const INGREDIENTS: [string, string][] = [
  ["2", ""],
  ["3", "tbsp"],
  ["3", "cloves"],
  ["2", "cans"],
  ["4", "cups"],
  ["1", "tsp"],
  ["2", "tbsp"],
  ["1", "tsp"],
  ["½", "tsp"],
];

function format(amount: string, unit: string, factor: number, system: MeasurementUnit) {
  const display = displayIngredientAmount(amount, unit, factor, system);
  return [display.amount, display.unit].filter(Boolean).join(" ");
}

const amounts: Record<string, Record<string, string[]>> = {};
for (const system of [MeasurementUnit.METRIC, MeasurementUnit.IMPERIAL]) {
  amounts[system] = {};
  for (let servings = 1; servings <= MAX_SERVINGS; servings++) {
    amounts[system][servings] = INGREDIENTS.map(([amount, unit]) =>
      format(amount, unit, servings / BASE_SERVINGS, system),
    );
  }
}

const data = { base: BASE_SERVINGS, max: MAX_SERVINGS, amounts };
writeFileSync(
  "site/assets/sample-recipe.js",
  `window.sampleRecipe = ${JSON.stringify(data)};\n`,
);
