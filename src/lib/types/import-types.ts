import type { RecipeDifficulty } from "@/lib/types";
import type { PendingImage } from "@/lib/types/recipe-types";

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
  ingredients: ParsedIngredient[];
  instructions: ParsedInstruction[];
  tags: string[];
  difficulty: RecipeDifficulty | null;
  cuisine: string | null;
}

// A photo the recipe's structured data attaches to one step.
export interface JsonLdStepImage {
  url: string;
  text: string;
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
