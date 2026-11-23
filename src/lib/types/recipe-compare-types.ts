import type { RecipeSwatch } from "@/lib/types";
import type {
  RecipeCookSummary,
  RecipeIngredient,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";

export interface CompareRecipe {
  recipe: RecipeWithRelations;
  cooks: RecipeCookSummary;
  averageRating: number | null;
}

export interface CompareRecipesResult {
  recipes: CompareRecipe[];
  missing: number;
}

export interface CompareCandidate {
  id: string;
  slug: string;
  title: string;
  swatch: RecipeSwatch;
  sourceName: string | null;
}

export interface CompareCandidatesResult {
  success: boolean;
  suggested: boolean;
  recipes: CompareCandidate[];
}

export interface ComparableAmount {
  weight: number | null;
  volume: number | null;
  count: number | null;
  countUnit: string;
}

export interface CompareCell {
  ingredient: RecipeIngredient;
  quantity: string;
  detail: string | null;
  amount: ComparableAmount | null;
  share: number | null;
}

export interface CompareRow {
  id: string;
  label: string;
  strict: string;
  loose: string;
  cells: (CompareCell | null)[];
  inAll: boolean;
  spread: number | null;
  agrees: boolean;
}

export interface CompareFactCell {
  value: string | null;
  best: boolean;
}

export interface CompareFact {
  label: string;
  bestLabel: string | null;
  cells: CompareFactCell[];
}

export interface CompareColumn {
  id: string;
  title: string;
  swatch: RecipeSwatch;
}
