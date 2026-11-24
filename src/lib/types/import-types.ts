import type { RecipeDifficulty } from "@/lib/types";
import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import type { PendingImage, PendingVideo } from "@/lib/types/recipe-types";

export enum RecipeImportSource {
  JSON_LD = "json_ld",
  MICRODATA = "microdata",
  TEXT_PARSER = "text_parser",
  OCR_TEXT_PARSER = "ocr_text_parser",
}

export enum RecipeImportInput {
  URL = "url",
  TEXT = "text",
  IMAGE = "image",
}

export const RECIPE_IMPORT_SOURCE_LABELS: Record<RecipeImportSource, string> = {
  [RecipeImportSource.JSON_LD]: "Read from the page's recipe data",
  [RecipeImportSource.MICRODATA]: "Read from the page's recipe data",
  [RecipeImportSource.TEXT_PARSER]: "Parsed from text",
  [RecipeImportSource.OCR_TEXT_PARSER]: "Read from the photo (OCR)",
};

export enum IngredientIssue {
  NO_NAME = "no_name",
  STRAY_PUNCTUATION = "stray_punctuation",
  AMOUNT_IN_NAME = "amount_in_name",
  UNIT_IN_NAME = "unit_in_name",
  UNBALANCED_BRACKETS = "unbalanced_brackets",
  TOO_LONG = "too_long",
  PAGE_NOISE = "page_noise",
}

export interface ParsedIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
}

export interface ParsedInstruction {
  step: number;
  instruction: string;
  timeMinutes: number | null;
  temperature: string | null;
  groupName: string | null;
}

export interface RecipeParsingResult {
  title: string | null;
  description: string | null;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  // Only kept when it's longer than prep and cook together, as it is when a
  // recipe rests, rises or marinates.
  totalTime: number | null;
  ingredients: ParsedIngredient[];
  instructions: ParsedInstruction[];
  tags: string[];
  difficulty: RecipeDifficulty | null;
  cuisine: string | null;
  nutrition: RecipeNutrition | null;
}

// A photo the recipe's structured data attaches to one step.
export interface JsonLdStepImage {
  url: string;
  text: string;
}

// A video the recipe's structured data attaches to one step, or to the whole
// recipe when text is empty.
export interface JsonLdVideo {
  url: string;
  text: string;
  name: string | null;
  durationSeconds: number | null;
}

// A tip the recipe's structured data puts between its steps. stepText is the
// step it follows, or empty when it comes before the first step or after the
// last.
export interface JsonLdTip {
  text: string;
  stepText: string;
}

// stepNumber is null for a tip about the whole recipe.
export interface ImportedTip {
  text: string;
  stepNumber: number | null;
}

export interface ImportedVideo {
  url: string;
  name: string | null;
  durationSeconds: number | null;
  stepNumber: number | null;
}

export interface ImportedStepPhoto {
  url: string;
  stepNumber: number;
}

export interface RecipeImportResult {
  recipe: RecipeParsingResult;
  source: RecipeImportSource;
  confidence: number;
  sourceUrl: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  image: PendingImage | null;
  photoUrls: string[];
  stepPhotos: ImportedStepPhoto[];
  videos: ImportedVideo[];
  tips: ImportedTip[];
  videoLink: string | null;
  warnings: string[];
}

export interface FetchedPage {
  url: string;
  html: string;
}

export interface CapturedImage {
  data: string;
  mimeType: string;
}

// A photo found on the recipe page. The extension sends the image itself
// when the browser could load it; otherwise only the address is known.
export interface PhotoSuggestion {
  url: string;
  image: CapturedImage | null;
  stepNumber: number | null;
}

// What happened to one video: the saved file, or why it wasn't added.
export interface SuggestedVideoOutcome {
  url: string;
  video: PendingVideo | null;
  error: string | null;
}

// What happened to one photo in a batch: the saved image, or why it wasn't
// added.
export interface SuggestedPhotoOutcome {
  url: string;
  image: PendingImage | null;
  error: string | null;
}

export interface CapturedPage extends FetchedPage {
  image: CapturedImage | null;
  photos: PhotoSuggestion[];
}

// How far the extension has got gathering photos before it sends the page.
export interface ExtensionPhotoProgress {
  photosDone: number;
  photosTotal: number;
}

// A recipe already in Tastebase that was imported from the same page.
export interface SavedRecipeMatch {
  slug: string;
  title: string;
  savedBy: string;
  isOwn: boolean;
  savedAt: Date;
}
