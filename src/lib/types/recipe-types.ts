import type {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeNotes,
  recipes,
  recipeTags,
} from "@/db/schema.recipes";
import type {
  ActivityKind,
  HouseholdMember,
  LibraryScope,
  LibrarySort,
  LibraryVisibility,
  RecipeChangeType,
  RecipeDifficulty,
  RecipeSwatch,
  SortOrder,
  ViewMode,
} from "@/lib/types";

export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type RecipeInstruction = typeof recipeInstructions.$inferSelect;

export type RecipeTag = typeof recipeTags.$inferSelect;

export type RecipeImage = typeof recipeImages.$inferSelect;
export type RecipeNote = typeof recipeNotes.$inferSelect;
export interface RecipeNoteWithAuthor extends RecipeNote {
  authorName: string;
}

export interface RecipeWithRelations extends Recipe {
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  images: RecipeImage[];
  notes: RecipeNoteWithAuthor[];
  tags: RecipeTag[];
  author: RecipeAuthor;
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

interface RecipeFormIngredient {
  name: string;
  amount?: string;
  unit?: string;
  notes?: string;
  groupName?: string;
  isOptional: boolean;
}

interface RecipeFormInstruction {
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
  maxTotalTime?: number;
  authorId?: string;
  recipeIds?: string[];
  recordHistory?: boolean;
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
    | "difficulty"
    | "totalTime";
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

export interface RecipeAuthor {
  id: string;
  name: string;
}

export interface RecipeHeroImage {
  filename: string;
  altText: string | null;
}

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  swatch: RecipeSwatch;
  totalMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  cuisine: string | null;
  isPublic: boolean;
  author: RecipeAuthor;
  heroImage: RecipeHeroImage | null;
  isFavourite: boolean;
  createdAt: Date;
  lastViewedAt: Date | null;
}

export interface NavCounts {
  recipes: number;
  favourites: number;
}

export interface ActivityRecipe {
  slug: string;
  title: string;
  swatch: RecipeSwatch;
}

export interface HouseActivityItem {
  id: string;
  kind: ActivityKind;
  actor: RecipeAuthor;
  recipe: ActivityRecipe;
  at: Date;
  excerpt: string | null;
}

export interface LibraryFilters {
  scope: LibraryScope;
  query: string | null;
  authorId: string | null;
  difficulty: RecipeDifficulty | null;
  cuisine: string | null;
  tags: string[];
  listId: string | null;
  maxTime: number | null;
  sort: LibrarySort | null;
  visibility: LibraryVisibility;
  view: ViewMode;
  page: number;
}

export interface LibraryResult {
  recipes: RecipeSummary[];
  total: number;
  hasMore: boolean;
}

export interface LibraryFacets {
  members: HouseholdMember[];
  cuisines: string[];
  tags: string[];
}

export type LibraryFilterUpdate = Partial<LibraryFilters>;

export interface RecipeCookSummary {
  count: number;
  lastCookedAt: Date | null;
  lastCookedBy: RecipeAuthor | null;
}

export interface StepTimer {
  stepId: string;
  label: string;
  endsAt: number;
}

export interface RecipeEditorValues extends RecipeFormData {
  swatch: RecipeSwatch | null;
}

export interface PendingImage {
  filename: string;
  originalName: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  url: string;
}

export interface RecipeDraftSnapshot {
  values: RecipeEditorValues;
  savedAt: string;
}

export interface CleanedEditorValues {
  values: RecipeEditorValues;
  ingredientRows: number[];
  instructionRows: number[];
}

export type EditorIngredient = RecipeEditorValues["ingredients"][number];
export type EditorInstruction = RecipeEditorValues["instructions"][number];

export interface TagTileData {
  id: string;
  name: string;
  category: string | null;
  swatch: RecipeSwatch;
  recipeCount: number;
  previewTitles: string[];
}

export interface RecipeListTileData {
  id: string;
  href: string;
  name: string;
  swatch: RecipeSwatch;
  recipeCount: number;
  previewTitles: string[];
}

export interface RecipeListDetail {
  id: string;
  name: string;
  swatch: RecipeSwatch;
  chosenSwatch: RecipeSwatch | null;
}

export interface RecipeListInput {
  name: string;
  swatch: RecipeSwatch | null;
}

export interface RecipeListOption extends RecipeListDetail {
  containsRecipe: boolean;
}

export interface HouseholdMemberOverview {
  id: string;
  name: string;
  joinedAt: Date;
  sharedRecipes: number;
}

export interface ComparableIngredient {
  name: string;
  amount?: string | null;
  unit?: string | null;
  notes?: string | null;
  groupName?: string | null;
  isOptional?: boolean;
}

export interface ComparableInstruction {
  instruction: string;
  timeMinutes?: number | null;
  temperature?: string | null;
  notes?: string | null;
  groupName?: string | null;
}

export interface ComparableRecipeFields {
  title?: string;
  description?: string | null;
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  difficulty?: string | null;
  cuisine?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  swatch?: string | null;
  isPublic?: boolean;
}

export interface RecipeChangeInput {
  before: ComparableRecipeFields;
  after: ComparableRecipeFields;
  ingredientsBefore: ComparableIngredient[];
  ingredientsAfter: ComparableIngredient[] | null;
  instructionsBefore: ComparableInstruction[];
  instructionsAfter: ComparableInstruction[] | null;
}

export interface RecipeChangeSummary {
  type: RecipeChangeType;
  description: string;
}
