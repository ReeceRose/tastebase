import {
  type NutrientDefinition,
  NutrientKey,
  NutrientUnit,
  type RecipeNutrition,
} from "@/lib/types/nutrition-types";

export const NUTRIENTS: NutrientDefinition[] = [
  {
    key: NutrientKey.CALORIES,
    label: "Calories",
    unit: NutrientUnit.KCAL,
    schemaProperty: "calories",
  },
  {
    key: NutrientKey.FAT,
    label: "Fat",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "fatContent",
  },
  {
    key: NutrientKey.SATURATED_FAT,
    label: "Saturated fat",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "saturatedFatContent",
  },
  {
    key: NutrientKey.CARBOHYDRATES,
    label: "Carbohydrates",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "carbohydrateContent",
  },
  {
    key: NutrientKey.SUGAR,
    label: "Sugar",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "sugarContent",
  },
  {
    key: NutrientKey.FIBRE,
    label: "Fibre",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "fiberContent",
  },
  {
    key: NutrientKey.PROTEIN,
    label: "Protein",
    unit: NutrientUnit.GRAMS,
    schemaProperty: "proteinContent",
  },
  {
    key: NutrientKey.SODIUM,
    label: "Sodium",
    unit: NutrientUnit.MILLIGRAMS,
    schemaProperty: "sodiumContent",
  },
  {
    key: NutrientKey.CHOLESTEROL,
    label: "Cholesterol",
    unit: NutrientUnit.MILLIGRAMS,
    schemaProperty: "cholesterolContent",
  },
];

export function emptyNutrition(): RecipeNutrition {
  return {
    servingSize: null,
    [NutrientKey.CALORIES]: null,
    [NutrientKey.FAT]: null,
    [NutrientKey.SATURATED_FAT]: null,
    [NutrientKey.CARBOHYDRATES]: null,
    [NutrientKey.SUGAR]: null,
    [NutrientKey.FIBRE]: null,
    [NutrientKey.PROTEIN]: null,
    [NutrientKey.SODIUM]: null,
    [NutrientKey.CHOLESTEROL]: null,
  };
}

export function hasNutrientValues(nutrition: RecipeNutrition | null): boolean {
  return (
    nutrition !== null &&
    NUTRIENTS.some((nutrient) => nutrition[nutrient.key] !== null)
  );
}

// Blank form fields come back as empty strings or NaN; an entry with no
// numbers at all is stored as no nutrition.
export function cleanNutrition(
  nutrition: RecipeNutrition | null | undefined,
): RecipeNutrition | null {
  if (!nutrition) return null;
  const cleaned = emptyNutrition();
  for (const nutrient of NUTRIENTS) {
    const value = nutrition[nutrient.key];
    cleaned[nutrient.key] =
      typeof value === "number" && Number.isFinite(value) && value >= 0
        ? value
        : null;
  }
  const servingSize = nutrition.servingSize?.trim();
  cleaned.servingSize = servingSize ? servingSize : null;
  return hasNutrientValues(cleaned) ? cleaned : null;
}

export function sameNutrition(
  a: RecipeNutrition | null | undefined,
  b: RecipeNutrition | null | undefined,
): boolean {
  const left = cleanNutrition(a);
  const right = cleanNutrition(b);
  if (left === null || right === null) return left === right;
  return (
    left.servingSize === right.servingSize &&
    NUTRIENTS.every((nutrient) => left[nutrient.key] === right[nutrient.key])
  );
}

// Calories usually read bare ("Calories 408"); pass showEnergyUnit where
// they sit among other units.
export function formatNutrient(
  value: number | null,
  unit: NutrientUnit,
  showEnergyUnit = false,
): string | null {
  if (value === null) return null;
  const rounded =
    unit === NutrientUnit.KCAL || value >= 10
      ? Math.round(value)
      : Math.round(value * 10) / 10;
  const amount = rounded.toLocaleString("en-CA");
  if (unit === NutrientUnit.KCAL && !showEnergyUnit) return amount;
  return `${amount} ${unit}`;
}
