import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchRecipePage: vi.fn(),
  extractTextFromImage: vi.fn(),
  cleanupRecipeText: vi.fn(),
  extractRecipeFromImage: vi.fn(),
}));

vi.mock("@/lib/import/fetch-page", () => ({
  fetchRecipePage: mocks.fetchRecipePage,
}));
vi.mock("@/lib/import/ocr", () => ({
  extractTextFromImage: mocks.extractTextFromImage,
}));
vi.mock("@/lib/ai/recipe-cleanup", () => ({
  cleanupRecipeText: mocks.cleanupRecipeText,
  extractRecipeFromImage: mocks.extractRecipeFromImage,
}));

import {
  importRecipeFromImage,
  importRecipeFromPage,
  importRecipeFromText,
  importRecipeFromUrl,
} from "@/lib/import/import-recipe";
import {
  AIProvider,
  type AIProviderConfig,
  ImageProcessingMethod,
} from "@/lib/types/ai-types";
import {
  RecipeImportSource,
  type RecipeParsingResult,
} from "@/lib/types/import-types";

const AI_CONFIG: AIProviderConfig = {
  provider: AIProvider.ANTHROPIC,
  apiKey: "test-key",
  modelName: "claude-haiku-5-5",
  ollamaHost: null,
  imageProcessingMethod: ImageProcessingMethod.AUTO,
};

const AI_RECIPE: RecipeParsingResult = {
  title: "AI Soup",
  description: null,
  servings: 2,
  prepTime: null,
  cookTime: null,
  ingredients: [{ name: "water", quantity: "1", unit: "l" }],
  instructions: [
    { step: 1, instruction: "Boil.", timeMinutes: null, temperature: null },
  ],
  tags: [],
  difficulty: null,
  cuisine: null,
};

const AI_RESULT = {
  recipe: AI_RECIPE,
  usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
};

const TIDY_TEXT = `Pancakes
Ingredients
1 cup flour
1 cup milk
1 egg
2 tbsp sugar
1 tsp baking powder
Instructions
1. Whisk everything together until smooth.
2. Cook on a hot griddle for 2 minutes per side.
3. Serve warm with syrup.`;

const MESSY_TEXT = "My grandmother made this every Sunday with love.";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("importRecipeFromUrl", () => {
  it("uses JSON-LD without calling the AI", async () => {
    mocks.fetchRecipePage.mockResolvedValue({
      url: "https://www.example.com/soup",
      html: `<script type="application/ld+json">${JSON.stringify({
        "@type": "Recipe",
        name: "Soup",
        recipeIngredient: ["1 onion"],
        recipeInstructions: ["Chop the onion."],
      })}</script>`,
    });

    const result = await importRecipeFromUrl(
      "https://www.example.com/soup",
      AI_CONFIG,
    );

    expect(result.source).toBe(RecipeImportSource.JSON_LD);
    expect(result.sourceUrl).toBe("https://www.example.com/soup");
    expect(result.sourceName).toBe("example.com");
    expect(mocks.cleanupRecipeText).not.toHaveBeenCalled();
  });

  it("falls back to the AI when the page has no structured recipe", async () => {
    mocks.fetchRecipePage.mockResolvedValue({
      url: "https://example.com/story",
      html: `<html><head><meta property="og:site_name" content="Story Blog"></head><body><article><p>${MESSY_TEXT}</p></article></body></html>`,
    });
    mocks.cleanupRecipeText.mockResolvedValue(AI_RESULT);

    const result = await importRecipeFromUrl(
      "https://example.com/story",
      AI_CONFIG,
    );

    expect(result.source).toBe(RecipeImportSource.AI_TEXT);
    expect(result.recipe.title).toBe("AI Soup");
    expect(result.sourceName).toBe("Story Blog");
  });
});

describe("importRecipeFromPage", () => {
  it("reads a page the browser extension captured without fetching it", async () => {
    const result = await importRecipeFromPage(
      {
        url: "https://cooking.nytimes.com/recipes/1-soup",
        html: `<html><head><meta property="og:site_name" content="NYT Cooking"><script type="application/ld+json">${JSON.stringify(
          {
            "@type": "Recipe",
            name: "Soup",
            recipeIngredient: ["1 onion"],
            recipeInstructions: ["Chop the onion."],
          },
        )}</script></head><body></body></html>`,
      },
      null,
    );

    expect(mocks.fetchRecipePage).not.toHaveBeenCalled();
    expect(result.source).toBe(RecipeImportSource.JSON_LD);
    expect(result.recipe.title).toBe("Soup");
    expect(result.sourceUrl).toBe("https://cooking.nytimes.com/recipes/1-soup");
    expect(result.sourceName).toBe("NYT Cooking");
  });

  it("falls back to the share image and resolves it against the page", async () => {
    const result = await importRecipeFromPage(
      {
        url: "https://example.com/recipes/soup",
        html: `<html><head><meta property="og:image" content="/img/soup.jpg"><script type="application/ld+json">${JSON.stringify(
          {
            "@type": "Recipe",
            name: "Soup",
            recipeIngredient: ["1 onion"],
            recipeInstructions: ["Chop the onion."],
          },
        )}</script></head><body></body></html>`,
      },
      null,
    );

    expect(result.imageUrl).toBe("https://example.com/img/soup.jpg");
  });
});

describe("importRecipeFromText", () => {
  it("keeps a confident rule-based parse without the AI", async () => {
    const result = await importRecipeFromText(TIDY_TEXT, AI_CONFIG, false);

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.recipe.ingredients).toHaveLength(5);
    expect(mocks.cleanupRecipeText).not.toHaveBeenCalled();
  });

  it("uses the AI when the user asks for cleanup", async () => {
    mocks.cleanupRecipeText.mockResolvedValue(AI_RESULT);

    const result = await importRecipeFromText(TIDY_TEXT, AI_CONFIG, true);

    expect(result.source).toBe(RecipeImportSource.AI_TEXT);
    expect(mocks.cleanupRecipeText).toHaveBeenCalledWith(TIDY_TEXT, AI_CONFIG);
  });

  it("explains how to get better results when no AI is configured", async () => {
    const result = await importRecipeFromText(MESSY_TEXT, null, false);

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.warnings[0]).toContain("Set up an AI provider");
  });

  it("returns the rule-based parse with a warning when the AI fails", async () => {
    mocks.cleanupRecipeText.mockRejectedValue(new Error("rate limited"));

    const result = await importRecipeFromText(MESSY_TEXT, AI_CONFIG, false);

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.warnings[0]).toContain("AI cleanup failed");
  });
});

describe("importRecipeFromImage", () => {
  const image = Buffer.from("fake-image");

  it("uses AI vision when the model can read images", async () => {
    mocks.extractRecipeFromImage.mockResolvedValue(AI_RESULT);

    const result = await importRecipeFromImage(image, "image/png", AI_CONFIG);

    expect(result.source).toBe(RecipeImportSource.AI_VISION);
    expect(mocks.extractTextFromImage).not.toHaveBeenCalled();
  });

  it("falls back to OCR when AI vision fails", async () => {
    mocks.extractRecipeFromImage.mockRejectedValue(new Error("timeout"));
    mocks.extractTextFromImage.mockResolvedValue({
      text: TIDY_TEXT,
      confidence: 0.95,
    });

    const result = await importRecipeFromImage(image, "image/png", AI_CONFIG);

    expect(result.source).toBe(RecipeImportSource.OCR_TEXT_PARSER);
    expect(result.recipe.ingredients).toHaveLength(5);
  });

  it("never sends anything to the AI when the user chose OCR only", async () => {
    mocks.extractTextFromImage.mockResolvedValue({
      text: MESSY_TEXT,
      confidence: 0.4,
    });

    const result = await importRecipeFromImage(image, "image/png", {
      ...AI_CONFIG,
      imageProcessingMethod: ImageProcessingMethod.OCR,
    });

    expect(result.source).toBe(RecipeImportSource.OCR_TEXT_PARSER);
    expect(mocks.extractRecipeFromImage).not.toHaveBeenCalled();
    expect(mocks.cleanupRecipeText).not.toHaveBeenCalled();
  });

  it("reports when no text can be read", async () => {
    mocks.extractTextFromImage.mockResolvedValue({ text: "", confidence: 0 });

    const result = await importRecipeFromImage(image, "image/png", null);

    expect(result.confidence).toBe(0);
    expect(result.warnings[0]).toContain("No text could be read");
  });
});
