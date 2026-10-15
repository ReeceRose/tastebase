import type { RecipeDifficulty } from "@/lib/types";
import type { ImageProcessingMethod } from "@/lib/types/ai-types";

export enum RecipeImportSource {
  JSON_LD = "json_ld",
  TEXT_PARSER = "text_parser",
  OCR_TEXT_PARSER = "ocr_text_parser",
  AI_TEXT = "ai_text",
  AI_VISION = "ai_vision",
}

export enum RecipeImportInput {
  URL = "url",
  TEXT = "text",
  IMAGE = "image",
}

export const RECIPE_IMPORT_SOURCE_LABELS: Record<RecipeImportSource, string> = {
  [RecipeImportSource.JSON_LD]: "Read from the page's recipe data",
  [RecipeImportSource.TEXT_PARSER]: "Parsed from text",
  [RecipeImportSource.OCR_TEXT_PARSER]: "Read from the photo (OCR)",
  [RecipeImportSource.AI_TEXT]: "Cleaned up with AI",
  [RecipeImportSource.AI_VISION]: "Read from the photo with AI",
};

export interface ParsedIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export interface ParsedInstruction {
  step: number;
  instruction: string;
  timeMinutes: number | null;
  temperature: string | null;
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

export interface RecipeImportResult {
  recipe: RecipeParsingResult;
  source: RecipeImportSource;
  confidence: number;
  sourceUrl: string | null;
  sourceName: string | null;
  rawText: string | null;
  warnings: string[];
}

export interface RecipeImportCapabilities {
  aiConfigured: boolean;
  visionAvailable: boolean;
  providerName: string | null;
  imageProcessingMethod: ImageProcessingMethod;
}

export interface FetchedPage {
  url: string;
  html: string;
}
