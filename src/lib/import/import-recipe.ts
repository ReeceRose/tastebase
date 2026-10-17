import { modelSupportsVision } from "@/lib/ai/models";
import {
  cleanupRecipeText,
  extractRecipeFromImage,
} from "@/lib/ai/recipe-cleanup";
import { fetchRecipePage } from "@/lib/import/fetch-page";
import { htmlToText } from "@/lib/import/html-to-text";
import { extractJsonLdRecipe } from "@/lib/import/json-ld-parser";
import { extractTextFromImage } from "@/lib/import/ocr";
import { findPagePhotos } from "@/lib/import/page-photos";
import { parseRecipeText } from "@/lib/import/text-recipe-parser";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  type AIProviderConfig,
  ImageProcessingMethod,
} from "@/lib/types/ai-types";
import {
  type FetchedPage,
  type RecipeImportResult,
  RecipeImportSource,
  type RecipeParsingResult,
} from "@/lib/types/import-types";
import { photoKey } from "@/lib/utils/photo-suggestions";

const logger = createOperationLogger("recipe-import");

// Below this score the rule-based parse probably missed something, so the AI
// fallback is used when one is configured.
const AI_FALLBACK_CONFIDENCE = 0.6;

const MIN_JSON_LD_INGREDIENTS = 1;
const MIN_JSON_LD_INSTRUCTIONS = 1;

const AI_UNAVAILABLE_WARNING =
  "Some details may be missing. Set up an AI provider in Settings to clean up imports like this automatically.";
const AI_FAILED_WARNING =
  "AI cleanup failed, so this is the basic parse. Check the details before saving.";

function hasRecipeContent(recipe: RecipeParsingResult): boolean {
  return recipe.ingredients.length > 0 || recipe.instructions.length > 0;
}

function hostnameOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function absoluteHttpUrl(value: string | null, base: string): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

interface TextImportOptions {
  aiConfig: AIProviderConfig | null;
  forceAI: boolean;
  titleHint: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  photoUrls: string[];
  baseSource: RecipeImportSource;
  baseConfidenceCap: number;
}

async function importFromParsedText(
  text: string,
  options: TextImportOptions,
): Promise<RecipeImportResult> {
  const parsed = parseRecipeText(text, options.titleHint);
  const confidence = Math.min(parsed.confidence, options.baseConfidenceCap);
  const base: RecipeImportResult = {
    recipe: parsed.recipe,
    source: options.baseSource,
    confidence,
    sourceUrl: options.sourceUrl,
    sourceName: options.sourceName,
    rawText: text,
    imageUrl: options.imageUrl,
    image: null,
    photoUrls: options.photoUrls,
    warnings: [],
  };

  const needsAI = options.forceAI || confidence < AI_FALLBACK_CONFIDENCE;
  if (!needsAI) {
    return base;
  }

  if (!options.aiConfig) {
    return { ...base, warnings: [AI_UNAVAILABLE_WARNING] };
  }

  try {
    const { recipe } = await cleanupRecipeText(text, options.aiConfig);
    if (!hasRecipeContent(recipe)) {
      return {
        ...base,
        warnings: ["The AI couldn't find a recipe in this text."],
      };
    }
    return {
      ...base,
      recipe: {
        ...recipe,
        title: recipe.title ?? parsed.recipe.title,
      },
      source: RecipeImportSource.AI_TEXT,
      confidence: 0.9,
    };
  } catch (error) {
    logError(logger, "AI recipe cleanup failed", error, {
      provider: options.aiConfig.provider,
    });
    return { ...base, warnings: [AI_FAILED_WARNING] };
  }
}

export async function importRecipeFromUrl(
  url: string,
  aiConfig: AIProviderConfig | null,
): Promise<RecipeImportResult> {
  return importRecipeFromPage(await fetchRecipePage(url), aiConfig);
}

// Used directly for pages the browser extension has already loaded, which
// covers sites that block server-side fetches or need the user's login.
export async function importRecipeFromPage(
  page: FetchedPage,
  aiConfig: AIProviderConfig | null,
): Promise<RecipeImportResult> {
  const jsonLd = extractJsonLdRecipe(page.html);
  const pageText = htmlToText(page.html);
  const sourceName =
    jsonLd?.siteName ?? pageText.siteName ?? hostnameOf(page.url);
  const imageUrl = absoluteHttpUrl(
    jsonLd?.imageUrl ?? pageText.imageUrl,
    page.url,
  );
  const stepImageUrls = (jsonLd?.stepImageUrls ?? []).flatMap((url) => {
    const absolute = absoluteHttpUrl(url, page.url);
    return absolute ? [absolute] : [];
  });
  const mainPhotoKey = imageUrl ? photoKey(imageUrl) : null;
  const photoUrls = findPagePhotos(page.html, page.url, stepImageUrls).filter(
    (url) => photoKey(url) !== mainPhotoKey,
  );

  if (
    jsonLd?.recipe.title &&
    jsonLd.recipe.ingredients.length >= MIN_JSON_LD_INGREDIENTS &&
    jsonLd.recipe.instructions.length >= MIN_JSON_LD_INSTRUCTIONS
  ) {
    logger.info(
      {
        host: hostnameOf(page.url),
        ingredientCount: jsonLd.recipe.ingredients.length,
        instructionCount: jsonLd.recipe.instructions.length,
      },
      "Imported recipe from JSON-LD",
    );
    return {
      recipe: jsonLd.recipe,
      source: RecipeImportSource.JSON_LD,
      confidence: 0.95,
      sourceUrl: page.url,
      sourceName,
      rawText: pageText.text,
      imageUrl,
      image: null,
      photoUrls,
      warnings: [],
    };
  }

  logger.info(
    { host: hostnameOf(page.url), hasPartialJsonLd: jsonLd !== null },
    "No complete JSON-LD recipe; parsing page text",
  );

  return importFromParsedText(pageText.text, {
    aiConfig,
    forceAI: false,
    titleHint: jsonLd?.recipe.title ?? pageText.title,
    sourceUrl: page.url,
    sourceName,
    imageUrl,
    photoUrls,
    baseSource: RecipeImportSource.TEXT_PARSER,
    baseConfidenceCap: 1,
  });
}

export async function importRecipeFromText(
  text: string,
  aiConfig: AIProviderConfig | null,
  forceAI: boolean,
): Promise<RecipeImportResult> {
  return importFromParsedText(text, {
    aiConfig,
    forceAI,
    titleHint: null,
    sourceUrl: null,
    sourceName: null,
    imageUrl: null,
    photoUrls: [],
    baseSource: RecipeImportSource.TEXT_PARSER,
    baseConfidenceCap: 1,
  });
}

function shouldUseVision(aiConfig: AIProviderConfig | null): boolean {
  if (!aiConfig?.modelName) {
    return false;
  }
  if (aiConfig.imageProcessingMethod === ImageProcessingMethod.OCR) {
    return false;
  }
  return modelSupportsVision(aiConfig.provider, aiConfig.modelName);
}

export async function importRecipeFromImage(
  image: Buffer,
  mediaType: string,
  aiConfig: AIProviderConfig | null,
): Promise<RecipeImportResult> {
  if (aiConfig && shouldUseVision(aiConfig)) {
    try {
      const { recipe } = await extractRecipeFromImage(
        image,
        mediaType,
        aiConfig,
      );
      if (hasRecipeContent(recipe)) {
        return {
          recipe,
          source: RecipeImportSource.AI_VISION,
          confidence: 0.9,
          sourceUrl: null,
          sourceName: null,
          rawText: null,
          imageUrl: null,
          image: null,
          photoUrls: [],
          warnings: [],
        };
      }
    } catch (error) {
      logError(logger, "AI vision import failed; falling back to OCR", error, {
        provider: aiConfig.provider,
      });
    }
  }

  const ocr = await extractTextFromImage(image);
  if (ocr.text.trim().length === 0) {
    return {
      recipe: parseRecipeText("", null).recipe,
      source: RecipeImportSource.OCR_TEXT_PARSER,
      confidence: 0,
      sourceUrl: null,
      sourceName: null,
      rawText: "",
      imageUrl: null,
      image: null,
      photoUrls: [],
      warnings: [
        "No text could be read from this image. Try a sharper, well-lit photo.",
      ],
    };
  }

  // A text-only AI can still tidy up OCR output when vision isn't available
  // or the user chose OCR in settings.
  return importFromParsedText(ocr.text, {
    aiConfig:
      aiConfig?.imageProcessingMethod === ImageProcessingMethod.OCR
        ? null
        : aiConfig,
    forceAI: false,
    titleHint: null,
    sourceUrl: null,
    sourceName: null,
    imageUrl: null,
    photoUrls: [],
    baseSource: RecipeImportSource.OCR_TEXT_PARSER,
    baseConfidenceCap: Math.max(ocr.confidence, 0.3),
  });
}
