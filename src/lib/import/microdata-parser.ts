import * as cheerio from "cheerio";
import { parseIngredientList } from "@/lib/import/ingredient-list";
import { toParsedInstructions } from "@/lib/import/instruction-cleaning";
import {
  parseIsoDuration,
  parseServings,
} from "@/lib/import/recipe-text-helpers";
import type { RecipeParsingResult } from "@/lib/types/import-types";

const RECIPE_SCOPE = "[itemtype*='schema.org/Recipe' i]";

// Older sites mark recipes up with attributes on the page instead of JSON-LD.
export function extractMicrodataRecipe(
  html: string,
): RecipeParsingResult | null {
  const $ = cheerio.load(html);
  const scope = $(RECIPE_SCOPE).first();
  if (scope.length === 0) return null;

  const text = (property: string): string | null => {
    const element = scope.find(`[itemprop='${property}']`).first();
    if (element.length === 0) return null;
    const value = element.attr("content") ?? element.text();
    return value.replace(/\s+/g, " ").trim() || null;
  };
  const list = (properties: string[]): string[] => {
    const lines: string[] = [];
    scope
      .find(properties.map((name) => `[itemprop='${name}']`).join(", "))
      .each((_, element) => {
        const line = $(element).text().replace(/\s+/g, " ").trim();
        if (line) lines.push(line);
      });
    return lines;
  };
  const duration = (property: string): number | null => {
    const element = scope.find(`[itemprop='${property}']`).first();
    const value = element.attr("datetime") ?? element.attr("content");
    return value ? parseIsoDuration(value) : null;
  };

  const steps: string[] = [];
  scope.find("[itemprop='recipeInstructions']").each((_, element) => {
    const block = $(element);
    const items = block.find("li, p");
    const parts =
      items.length > 0
        ? items.toArray().map((item) => $(item).text())
        : [block.text()];
    for (const part of parts) {
      const step = part.replace(/\s+/g, " ").trim();
      if (step) steps.push(step);
    }
  });

  const servings = text("recipeYield");
  return {
    title: text("name"),
    description: text("description"),
    servings: servings ? parseServings(servings) : null,
    prepTime: duration("prepTime"),
    cookTime: duration("cookTime"),
    ingredients: parseIngredientList(list(["recipeIngredient", "ingredients"])),
    instructions: toParsedInstructions(
      steps.map((step) => ({ text: step, groupName: null })),
    ),
    tags: [],
    difficulty: null,
    cuisine: text("recipeCuisine"),
  };
}
