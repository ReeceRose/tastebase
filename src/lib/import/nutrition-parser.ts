import {
  NutrientUnit,
  type RecipeNutrition,
} from "@/lib/types/nutrition-types";
import {
  cleanNutrition,
  emptyNutrition,
  NUTRIENTS,
} from "@/lib/utils/nutrition";

const MAX_SERVING_SIZE_LENGTH = 100;
const KILOJOULES_PER_KCAL = 4.184;
// "320 kcal", "12.5g", "1,200 mg", "<1 g", "approx. 4 grams".
const AMOUNT = /(\d[\d,]*(?:\.\d+)?|\.\d+)\s*([a-zµμ]*)/i;

const TO_GRAMS: Record<string, number> = {
  g: 1,
  gr: 1,
  gram: 1,
  grams: 1,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
  µg: 0.000001,
  μg: 0.000001,
  mcg: 0.000001,
};

const ENERGY_UNITS = new Set([
  "",
  "kcal",
  "cal",
  "cals",
  "calorie",
  "calories",
]);
const KILOJOULE_UNITS = new Set(["kj", "kilojoule", "kilojoules"]);

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

// Reads one value written for people, converting it to the unit Tastebase
// stores. Amounts in a unit that can't be converted are left out.
export function readNutrientAmount(
  text: string | null,
  unit: NutrientUnit,
): number | null {
  const match = text?.match(AMOUNT);
  if (!match) return null;
  const amount = Number.parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const written = match[2].toLowerCase();

  if (unit === NutrientUnit.KCAL) {
    if (ENERGY_UNITS.has(written)) return Math.round(amount);
    if (KILOJOULE_UNITS.has(written)) {
      return Math.round(amount / KILOJOULES_PER_KCAL);
    }
    return null;
  }

  const grams = written === "" ? 1 : TO_GRAMS[written];
  if (grams === undefined) return null;
  // A bare number is taken to be in the unit the field is measured in.
  const inGrams =
    written === "" && unit === NutrientUnit.MILLIGRAMS
      ? amount / 1000
      : amount * grams;
  return unit === NutrientUnit.MILLIGRAMS
    ? roundTo(inGrams * 1000, 1)
    : roundTo(inGrams, 1);
}

// `read` returns a schema.org NutritionInformation property as text, whether
// it came from JSON-LD or microdata.
export function parseNutrition(
  read: (property: string) => string | null,
): RecipeNutrition | null {
  const nutrition = emptyNutrition();
  for (const nutrient of NUTRIENTS) {
    nutrition[nutrient.key] = readNutrientAmount(
      read(nutrient.schemaProperty),
      nutrient.unit,
    );
  }
  const servingSize = read("servingSize")?.trim() ?? null;
  nutrition.servingSize =
    servingSize && servingSize.length <= MAX_SERVING_SIZE_LENGTH
      ? servingSize
      : null;
  return cleanNutrition(nutrition);
}
