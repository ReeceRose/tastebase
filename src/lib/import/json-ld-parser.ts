import * as cheerio from "cheerio";
import { stripHtml } from "@/lib/import/html-to-text";
import {
  extractTemperature,
  extractTimeMinutes,
  parseIngredientLine,
  parseIsoDuration,
  parseServings,
} from "@/lib/import/recipe-text-helpers";
import { createOperationLogger } from "@/lib/logging/logger";
import { RecipeDifficulty } from "@/lib/types";
import type {
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
  stepImageUrls: string[];
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;
const MAX_SEARCH_DEPTH = 6;

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasType(node: JsonObject, type: string): boolean {
  const value = node["@type"];
  if (typeof value === "string") {
    return value === type || value.endsWith(`/${type}`);
  }
  return Array.isArray(value) && value.some((item) => item === type);
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

function collectInstructionTexts(value: JsonValue | undefined): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (typeof value === "string") {
    return stripHtml(value)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectInstructionTexts(item));
  }
  if (!isObject(value)) {
    return [];
  }
  if (hasType(value, "HowToSection") || value.itemListElement !== undefined) {
    return collectInstructionTexts(value.itemListElement);
  }
  const text = readText(value.text ?? value.name ?? value.description);
  return text ? [text] : [];
}

function toInstructions(value: JsonValue | undefined): ParsedInstruction[] {
  return collectInstructionTexts(value).map((instruction, index) => ({
    step: index + 1,
    instruction,
    timeMinutes: extractTimeMinutes(instruction),
    temperature: extractTemperature(instruction),
  }));
}

function toIngredients(value: JsonValue | undefined): ParsedIngredient[] {
  const lines = Array.isArray(value) ? value : value ? [value] : [];
  return lines
    .map((line) => readText(line))
    .flatMap((line) => {
      const parsed = line ? parseIngredientLine(line) : null;
      return parsed ? [parsed] : [];
    });
}

function toTags(node: JsonObject): string[] {
  const tags = [
    ...readTextList(node.recipeCategory),
    ...readTextList(node.keywords),
  ]
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

function normalizeRecipe(node: JsonObject): RecipeParsingResult {
  const prepTime = readDuration(node.prepTime);
  const cookTime = readDuration(node.cookTime);
  const totalTime = readDuration(node.totalTime);
  const servingsText = readText(node.recipeYield ?? node.yield);

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
    ingredients: toIngredients(node.recipeIngredient ?? node.ingredients),
    instructions: toInstructions(node.recipeInstructions),
    tags: toTags(node),
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

function readStepImages(value: JsonValue | undefined, depth = 0): string[] {
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
  return [
    ...(own ? [own] : []),
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
        recipe: normalizeRecipe(node),
        siteName: readSiteName(node, scripts),
        imageUrl: readImageUrl(node.image ?? node.thumbnailUrl),
        stepImageUrls: readStepImages(node.recipeInstructions),
      };
    }
  }

  return null;
}
