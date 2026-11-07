import { fetchRecipePage } from "@/lib/import/fetch-page";
import { htmlToText } from "@/lib/import/html-to-text";
import { extractJsonLdRecipe } from "@/lib/import/json-ld-parser";
import { extractTextFromImage } from "@/lib/import/ocr";
import { findPagePhotos } from "@/lib/import/page-photos";
import { parseRecipeText } from "@/lib/import/text-recipe-parser";
import { createOperationLogger } from "@/lib/logging/logger";
import {
  type FetchedPage,
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";
import { photoKey } from "@/lib/utils/photo-suggestions";

const logger = createOperationLogger("recipe-import");

// Below this score the rule-based parse probably missed something.
const LOW_CONFIDENCE = 0.6;

const MIN_JSON_LD_INGREDIENTS = 1;
const MIN_JSON_LD_INSTRUCTIONS = 1;

const LOW_CONFIDENCE_WARNING =
  "Some details may be missing. Check them before saving.";

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
  titleHint: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  photoUrls: string[];
  baseSource: RecipeImportSource;
  baseConfidenceCap: number;
}

function importFromParsedText(
  text: string,
  options: TextImportOptions,
): RecipeImportResult {
  const parsed = parseRecipeText(text, options.titleHint);
  const confidence = Math.min(parsed.confidence, options.baseConfidenceCap);
  return {
    recipe: parsed.recipe,
    source: options.baseSource,
    confidence,
    sourceUrl: options.sourceUrl,
    sourceName: options.sourceName,
    imageUrl: options.imageUrl,
    image: null,
    photoUrls: options.photoUrls,
    warnings: confidence < LOW_CONFIDENCE ? [LOW_CONFIDENCE_WARNING] : [],
  };
}

export async function importRecipeFromUrl(
  url: string,
): Promise<RecipeImportResult> {
  return importRecipeFromPage(await fetchRecipePage(url));
}

// Used directly for pages the browser extension has already loaded, which
// covers sites that block server-side fetches or need the user's login.
export function importRecipeFromPage(page: FetchedPage): RecipeImportResult {
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
    titleHint: jsonLd?.recipe.title ?? pageText.title,
    sourceUrl: page.url,
    sourceName,
    imageUrl,
    photoUrls,
    baseSource: RecipeImportSource.TEXT_PARSER,
    baseConfidenceCap: 1,
  });
}

export function importRecipeFromText(text: string): RecipeImportResult {
  return importFromParsedText(text, {
    titleHint: null,
    sourceUrl: null,
    sourceName: null,
    imageUrl: null,
    photoUrls: [],
    baseSource: RecipeImportSource.TEXT_PARSER,
    baseConfidenceCap: 1,
  });
}

export async function importRecipeFromImage(
  image: Buffer,
): Promise<RecipeImportResult> {
  const ocr = await extractTextFromImage(image);
  if (ocr.text.trim().length === 0) {
    return {
      recipe: parseRecipeText("", null).recipe,
      source: RecipeImportSource.OCR_TEXT_PARSER,
      confidence: 0,
      sourceUrl: null,
      sourceName: null,
      imageUrl: null,
      image: null,
      photoUrls: [],
      warnings: [
        "No text could be read from this image. Try a sharper, well-lit photo.",
      ],
    };
  }

  return importFromParsedText(ocr.text, {
    titleHint: null,
    sourceUrl: null,
    sourceName: null,
    imageUrl: null,
    photoUrls: [],
    baseSource: RecipeImportSource.OCR_TEXT_PARSER,
    baseConfidenceCap: Math.max(ocr.confidence, 0.3),
  });
}
