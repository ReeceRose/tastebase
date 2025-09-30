import * as cheerio from "cheerio";
import { createOperationLogger } from "@/lib/logging/logger";
import type { RecipeParsingResult } from "@/lib/types";

const logger = createOperationLogger("json-ld-parser");

export interface ParsedRecipeData {
  method: "json-ld" | "html-extraction" | "raw-html";
  recipe?: RecipeParsingResult;
  content?: string;
  confidence: number;
}

export async function extractRecipeJsonLd(
  html: string,
): Promise<RecipeParsingResult | null> {
  try {
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');

    logger.info(
      { scriptsFound: scripts.length },
      "Searching for JSON-LD scripts",
    );

    for (let i = 0; i < scripts.length; i++) {
      try {
        const scriptContent = $(scripts[i]).contents().text() || "{}";
        const json = JSON.parse(scriptContent);
        const data = Array.isArray(json) ? json : [json];

        for (const item of data) {
          if (
            item["@type"] === "Recipe" ||
            (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
          ) {
            logger.info({ recipeFound: true }, "Found Recipe JSON-LD schema");
            return normalizeRecipeFromJsonLd(item);
          }

          // Check nested objects for Recipe type
          if (item["@graph"] && Array.isArray(item["@graph"])) {
            for (const graphItem of item["@graph"]) {
              if (
                graphItem["@type"] === "Recipe" ||
                (Array.isArray(graphItem["@type"]) &&
                  graphItem["@type"].includes("Recipe"))
              ) {
                logger.info({ recipeFound: true }, "Found Recipe in @graph");
                return normalizeRecipeFromJsonLd(graphItem);
              }
            }
          }
        }
      } catch (parseError) {
        logger.warn({ error: parseError }, "Failed to parse JSON-LD script");
      }
    }
  } catch (error) {
    logger.error({ error }, "Error extracting JSON-LD");
  }

  return null;
}

interface JsonLdRecipeData {
  name?: string;
  description?: string;
  recipeYield?: string | string[] | number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<
    | string
    | {
        "@type"?: string;
        text?: string;
        name?: string;
      }
  >;
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  author?:
    | {
        name?: string;
      }
    | string;
  image?: string | string[] | { url?: string };
  datePublished?: string;
  nutrition?: {
    calories?: string | number;
    servingSize?: string | number;
  };
  aggregateRating?: {
    ratingValue?: string | number;
    ratingCount?: string | number;
  };
  [key: string]: unknown; // Allow additional properties
}

function normalizeRecipeFromJsonLd(
  recipeData: JsonLdRecipeData,
): RecipeParsingResult {
  const recipe: RecipeParsingResult = {};

  // Basic recipe information
  if (recipeData.name) {
    recipe.title = String(recipeData.name);
  }

  if (recipeData.description) {
    recipe.description = String(recipeData.description);
  }

  // Yield/servings
  if (recipeData.recipeYield) {
    const yield_ = Array.isArray(recipeData.recipeYield)
      ? recipeData.recipeYield[0]
      : recipeData.recipeYield;
    recipe.servings = parseInt(String(yield_), 10) || undefined;
  }

  // Time durations (ISO 8601 format: PT15M = 15 minutes)
  if (recipeData.prepTime) {
    recipe.prepTime = parseDuration(recipeData.prepTime);
  }

  if (recipeData.cookTime) {
    recipe.cookTime = parseDuration(recipeData.cookTime);
  }

  if (recipeData.totalTime && !recipe.prepTime && !recipe.cookTime) {
    const totalTime = parseDuration(recipeData.totalTime);
    recipe.cookTime = totalTime;
  }

  // Ingredients
  if (
    recipeData.recipeIngredient &&
    Array.isArray(recipeData.recipeIngredient)
  ) {
    recipe.ingredients = recipeData.recipeIngredient.map(
      (ingredient: string) => {
        const parsed = parseIngredientString(ingredient);
        return {
          name: parsed.name,
          quantity: parsed.quantity,
          unit: parsed.unit,
        };
      },
    );
  }

  // Instructions
  if (
    recipeData.recipeInstructions &&
    Array.isArray(recipeData.recipeInstructions)
  ) {
    recipe.instructions = recipeData.recipeInstructions
      .map((instruction, index: number) => {
        let text = "";

        if (typeof instruction === "string") {
          text = instruction;
        } else if (instruction.text) {
          text = instruction.text;
        } else if (instruction.name) {
          text = instruction.name;
        }

        if (!text) return null;

        // Extract timing and temperature from instruction text
        const timing = extractTimingFromText(text);
        const temperature = extractTemperatureFromText(text);

        return {
          step: index + 1,
          instruction: text.trim(),
          ...(timing && { timeMinutes: timing }),
          ...(temperature && { temperature: temperature }),
        };
      })
      .filter(
        (
          instruction,
        ): instruction is {
          step: number;
          instruction: string;
          timeMinutes?: number;
          temperature?: string;
        } => instruction !== null,
      );
  }

  // Additional metadata
  if (recipeData.recipeCategory) {
    const categories = Array.isArray(recipeData.recipeCategory)
      ? recipeData.recipeCategory
      : [recipeData.recipeCategory];
    recipe.tags = categories.map(
      (cat: string | { "@value": string } | { name: string }) => {
        if (typeof cat === "string") {
          return cat.toLowerCase();
        }
        if (typeof cat === "object" && cat !== null) {
          if ("@value" in cat) {
            return String(cat["@value"]).toLowerCase();
          }
          if ("name" in cat) {
            return String(cat.name).toLowerCase();
          }
        }
        return String(cat).toLowerCase();
      },
    );
  }

  if (recipeData.recipeCuisine) {
    const cuisines = Array.isArray(recipeData.recipeCuisine)
      ? recipeData.recipeCuisine
      : [recipeData.recipeCuisine];
    recipe.cuisine = String(cuisines[0]);
  }

  if (recipeData.keywords) {
    const keywords = Array.isArray(recipeData.keywords)
      ? recipeData.keywords
      : String(recipeData.keywords).split(",");
    recipe.tags = [
      ...(recipe.tags || []),
      ...keywords.map((k: string) => k.trim().toLowerCase()),
    ];
  }

  // Difficulty (not standard in schema.org but some sites include it)
  if (recipeData.difficulty || recipeData.recipeDifficulty) {
    const difficulty = String(
      recipeData.difficulty || recipeData.recipeDifficulty,
    ).toLowerCase();
    if (["easy", "medium", "hard"].includes(difficulty)) {
      recipe.difficulty = difficulty as "easy" | "medium" | "hard";
    }
  }

  logger.info(
    {
      hasTitle: !!recipe.title,
      ingredientCount: recipe.ingredients?.length || 0,
      instructionCount: recipe.instructions?.length || 0,
    },
    "Normalized Recipe from JSON-LD",
  );

  return recipe;
}

function parseDuration(duration: string): number | undefined {
  if (!duration) return undefined;

  // ISO 8601 duration format: PT15M, PT1H30M, etc.
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  // Try to parse as plain number (assume minutes)
  const numericMatch = duration.match(/(\d+)/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  return undefined;
}

function parseIngredientString(ingredient: string): {
  name: string;
  quantity?: string;
  unit?: string;
} {
  // Simple regex-based parsing for quantity/unit extraction
  const match = ingredient.match(
    /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/,
  );

  if (match) {
    return {
      quantity: match[1],
      unit: match[2] || "",
      name: match[3].trim(),
    };
  }

  // No quantity/unit found, return as-is
  return {
    name: ingredient.trim(),
  };
}

function extractTimingFromText(text: string): number | undefined {
  // Common time patterns in cooking instructions
  const timePatterns = [
    // "for 25 minutes", "for 30-40 minutes"
    /(?:for|about|approximately)\s+(\d+)(?:-(\d+))?\s*(?:minutes?|mins?)/i,
    // "25 minutes", "30-40 minutes"
    /(?:^|\s)(\d+)(?:-(\d+))?\s*(?:minutes?|mins?)/i,
    // "bake 30 minutes"
    /(?:bake|cook|roast|simmer|boil)\s+(?:for\s+)?(\d+)(?:-(\d+))?\s*(?:minutes?|mins?)/i,
    // "until tender, about 20 minutes"
    /until\s+[^,]+,\s*(?:about\s+)?(\d+)(?:-(\d+))?\s*(?:minutes?|mins?)/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const time1 = parseInt(match[1], 10);
      const time2 = match[2] ? parseInt(match[2], 10) : undefined;

      // If range (e.g., "30-40 minutes"), return the higher value
      return time2 ? Math.max(time1, time2) : time1;
    }
  }

  return undefined;
}

function extractTemperatureFromText(text: string): string | undefined {
  // Temperature patterns
  const tempPatterns = [
    // "450°F", "450 degrees F", "230°C"
    /(\d+)°?\s*(?:degrees?\s*)?([CF])/i,
    // "at 450°F", "to 450 degrees"
    /(?:at|to)\s+(\d+)°?\s*(?:degrees?\s*)?([CF])?/i,
    // "preheat oven to 450"
    /preheat\s+(?:oven\s+)?to\s+(\d+)°?\s*(?:degrees?\s*)?([CF])?/i,
  ];

  for (const pattern of tempPatterns) {
    const match = text.match(pattern);
    if (match) {
      const temp = match[1];
      const unit = match[2] || (parseInt(temp, 10) > 100 ? "F" : "C");
      return `${temp}°${unit.toUpperCase()}`;
    }
  }

  return undefined;
}
