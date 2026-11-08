import * as cheerio from "cheerio";
import { stripHtml } from "@/lib/import/html-to-text";
import { parseIngredientList, toGroupName } from "@/lib/import/ingredient-list";
import {
  type StepText,
  toParsedInstructions,
} from "@/lib/import/instruction-cleaning";
import { readCardIngredientGroups } from "@/lib/import/recipe-card-groups";
import {
  parseIsoDuration,
  parseServings,
} from "@/lib/import/recipe-text-helpers";
import { createOperationLogger } from "@/lib/logging/logger";
import { RecipeDifficulty } from "@/lib/types";
import type {
  JsonLdStepImage,
  ParsedIngredient,
  ParsedInstruction,
  RecipeParsingResult,
} from "@/lib/types/import-types";
import { sizeFromUrl } from "@/lib/utils/photo-suggestions";

const logger = createOperationLogger("json-ld-parser");

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

export interface JsonLdRecipe {
  recipe: RecipeParsingResult;
  siteName: string | null;
  imageUrl: string | null;
  stepImages: JsonLdStepImage[];
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;
const MAX_SEARCH_DEPTH = 6;
// Keywords written for search engines: "salsa recipe", "easy pasta recipes".
const SEARCH_PHRASE = /\brecipes?$/i;

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesType(value: JsonValue, type: string): boolean {
  if (typeof value !== "string") return false;
  const name = value.split(/[/:#]/).pop() ?? value;
  return name.toLowerCase() === type.toLowerCase();
}

function hasType(node: JsonObject, type: string): boolean {
  const value = node["@type"];
  return Array.isArray(value)
    ? value.some((item) => matchesType(item, type))
    : value !== undefined && matchesType(value, type);
}

function findRecipeNode(value: JsonValue, depth: number): JsonObject | null {
  if (depth > MAX_SEARCH_DEPTH) {
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeNode(item, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (!isObject(value)) {
    return null;
  }
  if (hasType(value, "Recipe")) {
    return value;
  }
  for (const key of [
    "@graph",
    "mainEntity",
    "mainEntityOfPage",
    "itemListElement",
  ]) {
    const nested = value[key];
    if (nested !== undefined) {
      const found = findRecipeNode(nested, depth + 1);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function readText(value: JsonValue | undefined): string | null {
  if (typeof value === "string") {
    const text = stripHtml(value).replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = readText(item);
      if (text) {
        return text;
      }
    }
    return null;
  }
  if (isObject(value)) {
    return readText(value.name ?? value["@value"] ?? value.text);
  }
  return null;
}

function readTextList(value: JsonValue | undefined): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => stripHtml(item).trim())
      .filter((item) => item.length > 0);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => readTextList(item));
  }
  const text = readText(value);
  return text ? [text] : [];
}

function readDuration(value: JsonValue | undefined): number | null {
  const text = readText(value);
  return text ? parseIsoDuration(text) : null;
}

function collectSteps(
  value: JsonValue | undefined,
  groupName: string | null,
): StepText[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (typeof value === "string") {
    return stripHtml(value)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((text) => ({ text, groupName }));
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSteps(item, groupName));
  }
  if (!isObject(value) || hasType(value, "HowToTip")) {
    return [];
  }
  if (hasType(value, "HowToSection") || value.itemListElement !== undefined) {
    const name = toGroupName(readText(value.name) ?? "") ?? groupName;
    return collectSteps(value.itemListElement, name);
  }
  const text = readText(value.text ?? value.name ?? value.description);
  return text ? [{ text, groupName }] : [];
}

function toInstructions(value: JsonValue | undefined): ParsedInstruction[] {
  return toParsedInstructions(collectSteps(value, null));
}

function ingredientLines(value: JsonValue | undefined): string[] {
  if (typeof value === "string") {
    return stripHtml(value)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  const lines = Array.isArray(value) ? value : value ? [value] : [];
  return lines.flatMap((line) => {
    const text = readText(line);
    return text ? [text] : [];
  });
}

function toIngredients(
  value: JsonValue | undefined,
  html: string,
): ParsedIngredient[] {
  const lines = ingredientLines(value);
  return parseIngredientList(
    lines,
    readCardIngredientGroups(html, lines.length),
  );
}

function singularWord(word: string): string {
  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }
  if (/(oes|ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function comparableWords(text: string): string {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(singularWord);
  return ` ${words.join(" ")} `;
}

// Sites often list a recipe's ingredients as keywords. Search already finds
// those, so as tags they only bury the useful ones. Categories always stay.
function toTags(node: JsonObject, ingredients: ParsedIngredient[]): string[] {
  const ingredientWords = ingredients.map((ingredient) =>
    comparableWords(ingredient.name),
  );
  const keywords = readTextList(node.keywords).filter((keyword) => {
    const words = comparableWords(keyword);
    return (
      !SEARCH_PHRASE.test(keyword) &&
      !ingredientWords.some((ingredient) => ingredient.includes(words))
    );
  });
  const tags = [...readTextList(node.recipeCategory), ...keywords]
    .map((tag) => tag.toLowerCase())
    .filter((tag) => tag.length <= MAX_TAG_LENGTH);
  return [...new Set(tags)].slice(0, MAX_TAGS);
}

function toDifficulty(node: JsonObject): RecipeDifficulty | null {
  const value = readText(
    node.difficulty ?? node.recipeDifficulty,
  )?.toLowerCase();
  const match = Object.values(RecipeDifficulty).find(
    (level) => level === value,
  );
  return match ?? null;
}

function normalizeRecipe(node: JsonObject, html: string): RecipeParsingResult {
  const prepTime = readDuration(node.prepTime);
  const cookTime = readDuration(node.cookTime);
  const totalTime = readDuration(node.totalTime);
  const servingsText = readText(node.recipeYield ?? node.yield);
  const ingredients = toIngredients(
    node.recipeIngredient ?? node.ingredients,
    html,
  );

  return {
    title: readText(node.name ?? node.headline),
    description: readText(node.description),
    servings: servingsText ? parseServings(servingsText) : null,
    prepTime,
    cookTime:
      cookTime ??
      (totalTime !== null && prepTime === null
        ? totalTime
        : totalTime !== null && prepTime !== null && totalTime > prepTime
          ? totalTime - prepTime
          : null),
    ingredients,
    instructions: toInstructions(node.recipeInstructions),
    tags: toTags(node, ingredients),
    difficulty: toDifficulty(node),
    cuisine: readText(node.recipeCuisine),
  };
}

interface ImageCandidate {
  url: string;
  width: number;
  landscape: boolean;
}

// Treated as wider than any resized copy: an image address without a size
// hint is usually the original upload.
const ORIGINAL_WIDTH = 100000;
const LARGE_WIDTH = 1000;

function readPixels(value: JsonValue | undefined): number {
  const pixels = Number.parseInt(String(value ?? 0), 10);
  return Number.isNaN(pixels) ? 0 : pixels;
}

function imageCandidate(value: JsonValue): ImageCandidate | null {
  const url = isObject(value) ? (value.url ?? value.contentUrl) : value;
  if (typeof url !== "string" || !url.trim()) {
    return null;
  }
  const declared = isObject(value)
    ? { width: readPixels(value.width), height: readPixels(value.height) }
    : null;
  const size =
    declared && declared.width > 0 ? declared : sizeFromUrl(url.trim());
  if (!size) {
    return { url: url.trim(), width: ORIGINAL_WIDTH, landscape: false };
  }
  return {
    url: url.trim(),
    width: size.width,
    landscape: size.height > 0 && size.width > size.height,
  };
}

function betterImage(
  best: ImageCandidate,
  candidate: ImageCandidate,
): ImageCandidate {
  const bestLarge = best.width >= LARGE_WIDTH;
  const candidateLarge = candidate.width >= LARGE_WIDTH;
  if (bestLarge && candidateLarge && candidate.landscape !== best.landscape) {
    return candidate.landscape ? candidate : best;
  }
  return candidate.width > best.width ? candidate : best;
}

// Recipes list one image or several crops of it. A large landscape crop makes
// the best main photo, then the biggest one.
function readImageUrl(value: JsonValue | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const candidates = (Array.isArray(value) ? value : [value])
    .map(imageCandidate)
    .filter((candidate) => candidate !== null);
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce(betterImage).url;
}

// Keeps each photo's step text so it can be matched to the imported step.
// Section photos have no step text.
function readStepImages(
  value: JsonValue | undefined,
  depth = 0,
): JsonLdStepImage[] {
  if (value === undefined || depth > MAX_SEARCH_DEPTH) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => readStepImages(item, depth + 1));
  }
  if (!isObject(value)) {
    return [];
  }
  const own = readImageUrl(value.image);
  const isSection = value.itemListElement !== undefined;
  const text = isSection
    ? ""
    : (readText(value.text ?? value.name ?? value.description) ?? "");
  return [
    ...(own ? [{ url: own, text }] : []),
    ...readStepImages(value.itemListElement, depth + 1),
  ];
}

function readSiteName(node: JsonObject, scripts: JsonValue[]): string | null {
  const publisher = node.publisher;
  if (publisher !== undefined) {
    const name = readText(publisher);
    if (name) {
      return name;
    }
  }
  for (const script of scripts) {
    const graph = isObject(script) ? script["@graph"] : script;
    const nodes = Array.isArray(graph) ? graph : [graph];
    const website = nodes.find(
      (item): item is JsonObject => isObject(item) && hasType(item, "WebSite"),
    );
    const name = website ? readText(website.name) : null;
    if (name) {
      return name;
    }
  }
  return null;
}

export function extractJsonLdRecipe(html: string): JsonLdRecipe | null {
  const $ = cheerio.load(html);
  const scripts: JsonValue[] = [];

  $("script[type='application/ld+json']").each((_, element) => {
    const content = $(element).contents().text().trim();
    if (content.length === 0) {
      return;
    }
    try {
      scripts.push(JSON.parse(content) as JsonValue);
    } catch {
      logger.warn("Skipping JSON-LD block that isn't valid JSON");
    }
  });

  for (const script of scripts) {
    const node = findRecipeNode(script, 0);
    if (node) {
      return {
        recipe: normalizeRecipe(node, html),
        siteName: readSiteName(node, scripts),
        imageUrl: readImageUrl(node.image ?? node.thumbnailUrl),
        stepImages: readStepImages(node.recipeInstructions),
      };
    }
  }

  return null;
}
