import type {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeNotes,
  recipes,
  recipeTags,
} from "@/db/schema.recipes";
import type { RecipeDifficulty, SortOrder } from "@/lib/types";

export type Recipe = typeof recipes.$inferSelect;
export type CreateRecipeInput = typeof recipes.$inferInsert;
export type UpdateRecipeInput = Partial<CreateRecipeInput>;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type RecipeInstruction = typeof recipeInstructions.$inferSelect;

export type RecipeTag = typeof recipeTags.$inferSelect;

export type RecipeImage = typeof recipeImages.$inferSelect;
export type CreateRecipeImageInput = typeof recipeImages.$inferInsert;
export type UpdateRecipeImageInput = Partial<CreateRecipeImageInput>;

export type RecipeNote = typeof recipeNotes.$inferSelect;
export type CreateRecipeNoteInput = typeof recipeNotes.$inferInsert;
export type UpdateRecipeNoteInput = Partial<CreateRecipeNoteInput>;

export interface RecipeWithRelations extends Recipe {
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  images: RecipeImage[];
  notes: RecipeNote[];
  tags: RecipeTag[];
}

export interface RecipeListItem extends Recipe {
  heroImage?: RecipeImage;
  ingredientCount: number;
  instructionCount: number;
  imageCount: number;
  averageRating?: number;
  images?: RecipeImage[];
  tags?: RecipeTag[];
  lastViewedAt?: Date | null;
  isFavorited?: boolean;
  viewCount?: number;
}

export interface RecipeFormIngredient {
  name: string;
  amount?: string;
  unit?: string;
  notes?: string;
  groupName?: string;
  isOptional: boolean;
}

export interface RecipeFormInstruction {
  instruction: string;
  timeMinutes?: number;
  temperature?: string;
  notes?: string;
  groupName?: string;
}

export interface RecipeFormData {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  cuisine?: string;
  sourceUrl?: string;
  sourceName?: string;
  isPublic: boolean;
  ingredients: RecipeFormIngredient[];
  instructions: RecipeFormInstruction[];
  tags?: string[];
}

export interface CreateRecipeData {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: RecipeDifficulty;
  cuisine?: string;
  sourceUrl?: string;
  sourceName?: string;
  isPublic?: boolean;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  tags?: string[];
}

export interface RecipeSearchParams {
  query?: string;
  tags?: string[];
  difficulty?: RecipeDifficulty[];
  maxPrepTime?: number;
  maxCookTime?: number;
  servings?: number;
  cuisine?: string[];
  isPublic?: boolean;
  minRating?: number;
  favorites?: boolean;
  sortBy?:
    | "title"
    | "createdAt"
    | "updatedAt"
    | "prepTimeMinutes"
    | "cookTimeMinutes"
    | "averageRating"
    | "relevance"
    | "difficulty";
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  images: RecipeImage[];
  notes: RecipeNote[];
  tags: RecipeTag[];
  user?: {
    id: string;
    name?: string | null;
    email: string;
  };
  totalTimeMinutes: number;
  userName?: string | null;
  userEmail?: string;
}

export interface RecipeSearchResult {
  recipes: RecipeWithDetails[];
  total: number;
  hasMore: boolean;
  filters: {
    cuisines: string[];
    difficulties: string[];
    tags: RecipeTag[];
  };
  searchTime?: number;
}

export interface RecipeListSearchResult {
  recipes: RecipeListItem[];
  total: number;
  hasMore: boolean;
  filters?: {
    cuisines: string[];
    difficulties: string[];
    tags: RecipeTag[];
  };
}
