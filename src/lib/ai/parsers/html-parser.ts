import * as cheerio from "cheerio";
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("html-parser");

export interface ExtractedContent {
  title?: string;
  content: string;
  method: "microdata" | "semantic" | "generic";
  confidence: number;
}

export function extractRecipeContentFromHtml(html: string): ExtractedContent {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $(
    "script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar",
  ).remove();

  // Strategy 1: Look for microdata markup
  const microdataResult = extractMicrodata($);
  if (microdataResult.content.length > 500) {
    logger.info({ method: "microdata" }, "Found microdata recipe content");
    return microdataResult;
  }

  // Strategy 2: Look for semantic recipe containers
  const semanticResult = extractSemanticContent($);
  if (semanticResult.content.length > 300) {
    logger.info({ method: "semantic" }, "Found semantic recipe content");
    return semanticResult;
  }

  // Strategy 3: Generic content extraction
  const genericResult = extractGenericContent($);
  logger.info({ method: "generic" }, "Using generic content extraction");
  return genericResult;
}

function extractMicrodata($: cheerio.CheerioAPI): ExtractedContent {
  // Look for microdata Recipe markup
  const recipeElement = $('[itemtype*="Recipe"], [itemtype*="recipe"]').first();

  if (recipeElement.length > 0) {
    const title =
      recipeElement.find('[itemprop="name"]').first().text().trim() ||
      recipeElement.find("h1, h2").first().text().trim();

    const content = recipeElement.text().trim();

    return {
      title: title || undefined,
      content,
      method: "microdata",
      confidence: 0.9,
    };
  }

  return {
    content: "",
    method: "microdata",
    confidence: 0,
  };
}

function extractSemanticContent($: cheerio.CheerioAPI): ExtractedContent {
  // Priority selectors for recipe content
  const selectors = [
    ".recipe-content",
    ".recipe",
    ".recipe-card",
    ".recipe-details",
    ".recipe-body",
    ".entry-content .recipe",
    '[class*="recipe"]',
    ".ingredients, .instructions",
    "article",
    "main",
    ".content",
    ".post-content",
    ".entry-content",
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const content = element.text().trim();
      if (content.length > 300) {
        const title = findTitle($, element);

        return {
          title: title || undefined,
          content,
          method: "semantic",
          confidence: 0.7,
        };
      }
    }
  }

  return {
    content: "",
    method: "semantic",
    confidence: 0,
  };
}

function extractGenericContent($: cheerio.CheerioAPI): ExtractedContent {
  // Last resort: get all text from body
  const title =
    $("h1").first().text().trim() || $("title").text().trim() || undefined;

  // Try to get main content
  let content =
    $("article").text() ||
    $("main").text() ||
    $(".content").text() ||
    $("body").text();

  // Clean up the content
  content = content.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

  return {
    title,
    content,
    method: "generic",
    confidence: 0.3,
  };
}

function findTitle(
  $: cheerio.CheerioAPI,
  context?: ReturnType<cheerio.CheerioAPI>,
): string | null {
  // Look for title in various places
  const titleSelectors = [
    "h1",
    "h2",
    ".recipe-title",
    ".title",
    ".entry-title",
    '[itemprop="name"]',
  ];

  for (const selector of titleSelectors) {
    const title = context
      ? context.find(selector).first().text().trim()
      : $(selector).first().text().trim();
    if (title && title.length > 0 && title.length < 200) {
      return title;
    }
  }

  // Fallback to page title
  const pageTitle = $("title").text().trim();
  if (pageTitle && pageTitle.length < 200) {
    return pageTitle;
  }

  return null;
}
