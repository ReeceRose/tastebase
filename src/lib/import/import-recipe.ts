import { fetchRecipePage } from "@/lib/import/fetch-page";
import { htmlToText } from "@/lib/import/html-to-text";
import {
  adjustForRowQuality,
  ingredientWarning,
  MIN_CONFIDENCE_WITHOUT_WARNING,
  notARecipeWarning,
  pageTextIsRecipe,
  scoreStructuredRecipe,
} from "@/lib/import/import-quality";
import {
  extractJsonLdRecipe,
  type JsonLdRecipe,
} from "@/lib/import/json-ld-parser";
import { extractMicrodataRecipe } from "@/lib/import/microdata-parser";
import { extractTextFromImage } from "@/lib/import/ocr";
import { findPagePhotos } from "@/lib/import/page-photos";
import { matchStepPhotos } from "@/lib/import/step-photos";
import { parseRecipeText } from "@/lib/import/text-recipe-parser";
import { createOperationLogger } from "@/lib/logging/logger";
import {
  type FetchedPage,
  type RecipeImportResult,
  RecipeImportSource,
  type RecipeParsingResult,
} from "@/lib/types/import-types";
import { photoKey } from "@/lib/utils/photo-suggestions";

const logger = createOperationLogger("recipe-import");

const MIN_JSON_LD_INGREDIENTS = 1;
const MIN_JSON_LD_INSTRUCTIONS = 1;

const LOW_CONFIDENCE_WARNING =
  "Some details may be missing. Check them before saving.";

function warningsFor(
  confidence: number,
  recipe: RecipeParsingResult,
): string[] {
  const warnings =
    confidence < MIN_CONFIDENCE_WITHOUT_WARNING ? [LOW_CONFIDENCE_WARNING] : [];
  const rows = ingredientWarning(recipe.ingredients);
  return rows ? [...warnings, rows] : warnings;
}

function isComplete(recipe: RecipeParsingResult | null): boolean {
  return (
    recipe !== null &&
    Boolean(recipe.title) &&
    recipe.ingredients.length >= MIN_JSON_LD_INGREDIENTS &&
    recipe.instructions.length >= MIN_JSON_LD_INSTRUCTIONS
  );
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
  const confidence = Math.min(
    adjustForRowQuality(parsed.confidence, parsed.recipe),
    options.baseConfidenceCap,
  );
  return {
    recipe: parsed.recipe,
    source: options.baseSource,
    confidence,
    sourceUrl: options.sourceUrl,
    sourceName: options.sourceName,
    imageUrl: options.imageUrl,
    image: null,
    photoUrls: options.photoUrls,
    stepPhotos: [],
    warnings: warningsFor(confidence, parsed.recipe),
  };
}

interface StructuredCandidate {
  recipe: RecipeParsingResult | null;
  source: RecipeImportSource;
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
  const result = importPage(page, jsonLd);
  const stepImages = (jsonLd?.stepImages ?? []).flatMap((image) => {
    const url = absoluteHttpUrl(image.url, page.url);
    return url ? [{ url, text: image.text }] : [];
  });
  return {
    ...result,
    stepPhotos: matchStepPhotos(stepImages, result.recipe.instructions),
  };
}

function importPage(
  page: FetchedPage,
  jsonLd: JsonLdRecipe | null,
): RecipeImportResult {
  const pageText = htmlToText(page.html);
  const sourceName =
    jsonLd?.siteName ?? pageText.siteName ?? hostnameOf(page.url);
  const imageUrl = absoluteHttpUrl(
    jsonLd?.imageUrl ?? pageText.imageUrl,
    page.url,
  );
  const stepImageUrls = (jsonLd?.stepImages ?? []).flatMap(({ url }) => {
    const absolute = absoluteHttpUrl(url, page.url);
    return absolute ? [absolute] : [];
  });
  const mainPhotoKey = imageUrl ? photoKey(imageUrl) : null;
  const photoUrls = findPagePhotos(page.html, page.url, stepImageUrls).filter(
    (url) => photoKey(url) !== mainPhotoKey,
  );

  const shared = {
    sourceUrl: page.url,
    sourceName,
    imageUrl,
    image: null,
    photoUrls,
    stepPhotos: [],
  };

  const structured: StructuredCandidate[] = [
    { recipe: jsonLd?.recipe ?? null, source: RecipeImportSource.JSON_LD },
    {
      recipe: extractMicrodataRecipe(page.html),
      source: RecipeImportSource.MICRODATA,
    },
  ];
  for (const { recipe, source } of structured) {
    if (recipe && isComplete(recipe)) {
      const confidence = scoreStructuredRecipe(recipe);
      logger.info(
        {
          host: hostnameOf(page.url),
          source,
          confidence,
          ingredientCount: recipe.ingredients.length,
          instructionCount: recipe.instructions.length,
        },
        "Imported recipe from structured data",
      );
      return {
        recipe,
        source,
        confidence,
        warnings: warningsFor(confidence, recipe),
        ...shared,
      };
    }
  }

  const parsed = parseRecipeText(
    pageText.text,
    jsonLd?.recipe.title ?? pageText.title,
  );
  const partial = jsonLd?.recipe ?? null;
  const recipe: RecipeParsingResult = partial
    ? {
        ...parsed.recipe,
        ...partial,
        ingredients:
          partial.ingredients.length > 0
            ? partial.ingredients
            : parsed.recipe.ingredients,
        instructions:
          partial.instructions.length > 0
            ? partial.instructions
            : parsed.recipe.instructions,
      }
    : parsed.recipe;

  logger.info(
    { host: hostnameOf(page.url), hasPartialJsonLd: partial !== null },
    "No complete structured recipe; parsing page text",
  );

  if (!pageTextIsRecipe(recipe, parsed.foundHeadings || partial !== null)) {
    return {
      recipe: {
        ...recipe,
        ingredients: [],
        instructions: [],
        description: null,
      },
      source: RecipeImportSource.TEXT_PARSER,
      confidence: 0,
      warnings: [notARecipeWarning(recipe.title)],
      ...shared,
    };
  }

  const confidence = adjustForRowQuality(parsed.confidence, recipe);
  return {
    recipe,
    source: RecipeImportSource.TEXT_PARSER,
    confidence,
    warnings: warningsFor(confidence, recipe),
    ...shared,
  };
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
      stepPhotos: [],
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
