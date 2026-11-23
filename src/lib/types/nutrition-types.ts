// Each value is the field's name on RecipeNutrition.
export enum NutrientKey {
  CALORIES = "calories",
  FAT = "fat",
  SATURATED_FAT = "saturatedFat",
  CARBOHYDRATES = "carbohydrates",
  SUGAR = "sugar",
  FIBRE = "fibre",
  PROTEIN = "protein",
  SODIUM = "sodium",
  CHOLESTEROL = "cholesterol",
}

export enum NutrientUnit {
  KCAL = "kcal",
  GRAMS = "g",
  MILLIGRAMS = "mg",
}

export type NutrientValues = Record<NutrientKey, number | null>;

// Per serving, as the recipe's source states it.
export interface RecipeNutrition extends NutrientValues {
  servingSize: string | null;
}

export interface NutrientDefinition {
  key: NutrientKey;
  label: string;
  unit: NutrientUnit;
  schemaProperty: string;
}
