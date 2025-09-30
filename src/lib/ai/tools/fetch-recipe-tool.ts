import { z } from "zod";
import { extractRecipeContentFromHtml } from "@/lib/ai/parsers/html-parser";
import { extractRecipeJsonLd } from "@/lib/ai/parsers/json-ld-parser";
import type { AITool } from "@/lib/ai/tools/index";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { FetchRecipeResult } from "@/lib/types/ai-types";

const logger = createOperationLogger("fetch-recipe-tool");

// Generous content limit to avoid missing recipe details
const MAX_CONTENT_SIZE = 50000; // 50KB

export const fetchRecipeTool: AITool<FetchRecipeResult> = {
  name: "fetchRecipe",
  description:
    "Fetch and parse a recipe from a webpage. Returns normalized recipe schema or raw content for AI parsing.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL of the recipe webpage to fetch"),
  }),
  execute: async (params: unknown) => {
    const { url } = params as { url: string };
    logger.info({ url }, "Fetching recipe from URL");

    try {
      // Validate URL
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported");
      }

      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TasteBase/1.0; +https://tastebase.app)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error("URL does not return HTML content");
      }

      const html = await response.text();

      logger.info(
        {
          url,
          htmlSize: html.length,
          contentType,
        },
        "Successfully fetched webpage",
      );

      // Strategy 1: Try JSON-LD extraction first (highest accuracy)
      const jsonLdRecipe = await extractRecipeJsonLd(html);
      if (jsonLdRecipe?.title && (jsonLdRecipe.ingredients?.length || 0) > 0) {
        logger.info(
          {
            method: "json-ld",
            hasTitle: !!jsonLdRecipe.title,
            ingredientCount: jsonLdRecipe.ingredients?.length || 0,
            instructionCount: jsonLdRecipe.instructions?.length || 0,
          },
          "Successfully extracted recipe via JSON-LD",
        );

        return {
          url,
          method: "json-ld",
          recipe: jsonLdRecipe,
          confidence: 0.95,
        };
      }

      // Strategy 2: HTML content extraction (medium accuracy)
      const extractedContent = extractRecipeContentFromHtml(html);
      if (extractedContent.content && extractedContent.content.length > 200) {
        // Trim content to reasonable size for AI processing
        const trimmedContent =
          extractedContent.content.length > MAX_CONTENT_SIZE
            ? `${extractedContent.content.substring(0, MAX_CONTENT_SIZE)}...`
            : extractedContent.content;

        logger.info(
          {
            method: extractedContent.method,
            contentLength: trimmedContent.length,
            confidence: extractedContent.confidence,
          },
          "Extracted content via HTML parsing",
        );

        return {
          url,
          method: extractedContent.method,
          title: extractedContent.title,
          content: trimmedContent,
          confidence: extractedContent.confidence,
        };
      }

      // Strategy 3: Fallback to raw text (lowest accuracy)
      const fallbackContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const trimmedFallback =
        fallbackContent.length > MAX_CONTENT_SIZE
          ? `${fallbackContent.substring(0, MAX_CONTENT_SIZE)}...`
          : fallbackContent;

      logger.warn(
        {
          method: "raw-fallback",
          contentLength: trimmedFallback.length,
        },
        "Using raw text fallback",
      );

      return {
        url,
        method: "raw-fallback",
        content: trimmedFallback,
        confidence: 0.2,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logError(logger, "Failed to fetch recipe from URL", error as Error, {
        url,
      });

      return {
        url,
        method: "error",
        error: errorMessage,
        confidence: 0,
      };
    }
  },
};
