import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import type {
  EditorIngredient,
  EditorInstruction,
  RecipeEditorValues,
} from "@/lib/types/recipe-types";

// The parts of a recipe that can be brought over from its source page.
export enum RefreshSection {
  DETAILS = "details",
  INGREDIENTS = "ingredients",
  METHOD = "method",
  NUTRITION = "nutrition",
}

export enum RefreshChangeKind {
  ADDED = "added",
  REMOVED = "removed",
  CHANGED = "changed",
}

// A null side had no value: before is null when the source adds one.
export interface RefreshFieldChange {
  label: string;
  before: string | null;
  after: string | null;
}

export interface RefreshLineChange {
  // Unique within one list: where the line sits before and after.
  id: string;
  kind: RefreshChangeKind;
  before: string | null;
  after: string | null;
}

// Two lists lined up in order: a row with both indexes is the same item.
export interface AlignedPair {
  before: number | null;
  after: number | null;
}

export type RefreshDetailValues = Partial<
  Pick<
    RecipeEditorValues,
    | "title"
    | "description"
    | "servings"
    | "prepTimeMinutes"
    | "cookTimeMinutes"
    | "difficulty"
    | "cuisine"
  >
>;

export interface RecipeRefreshPlan {
  details: RefreshFieldChange[];
  detailValues: RefreshDetailValues;
  ingredients: RefreshLineChange[];
  mergedIngredients: EditorIngredient[];
  method: RefreshLineChange[];
  mergedInstructions: EditorInstruction[];
  // Photos and videos tagged only on steps the source no longer has.
  detachedMedia: number;
  nutrition: RefreshFieldChange[];
  importedNutrition: RecipeNutrition | null;
}
