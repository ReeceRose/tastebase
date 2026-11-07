import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchRecipePage: vi.fn(),
  extractTextFromImage: vi.fn(),
}));

vi.mock("@/lib/import/fetch-page", () => ({
  fetchRecipePage: mocks.fetchRecipePage,
}));
vi.mock("@/lib/import/ocr", () => ({
  extractTextFromImage: mocks.extractTextFromImage,
}));

import {
  importRecipeFromImage,
  importRecipeFromPage,
  importRecipeFromText,
  importRecipeFromUrl,
} from "@/lib/import/import-recipe";
import { RecipeImportSource } from "@/lib/types/import-types";

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
  it("uses JSON-LD when the page has a complete recipe", async () => {
    mocks.fetchRecipePage.mockResolvedValue({
      url: "https://www.example.com/soup",
      html: `<script type="application/ld+json">${JSON.stringify({
        "@type": "Recipe",
        name: "Soup",
        recipeIngredient: ["1 onion"],
        recipeInstructions: ["Chop the onion."],
      })}</script>`,
    });

    const result = await importRecipeFromUrl("https://www.example.com/soup");

    expect(result.source).toBe(RecipeImportSource.JSON_LD);
    expect(result.sourceUrl).toBe("https://www.example.com/soup");
    expect(result.sourceName).toBe("example.com");
  });

  it("parses the page text when the page has no structured recipe", async () => {
    mocks.fetchRecipePage.mockResolvedValue({
      url: "https://example.com/story",
      html: `<html><head><meta property="og:site_name" content="Story Blog"></head><body><article><p>${MESSY_TEXT}</p></article></body></html>`,
    });

    const result = await importRecipeFromUrl("https://example.com/story");

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.sourceName).toBe("Story Blog");
    expect(result.warnings[0]).toContain("Some details may be missing");
  });
});

describe("importRecipeFromPage", () => {
  it("reads a page the browser extension captured without fetching it", async () => {
    const result = importRecipeFromPage({
      url: "https://cooking.nytimes.com/recipes/1-soup",
      html: `<html><head><meta property="og:site_name" content="NYT Cooking"><script type="application/ld+json">${JSON.stringify(
        {
          "@type": "Recipe",
          name: "Soup",
          recipeIngredient: ["1 onion"],
          recipeInstructions: ["Chop the onion."],
        },
      )}</script></head><body></body></html>`,
    });

    expect(mocks.fetchRecipePage).not.toHaveBeenCalled();
    expect(result.source).toBe(RecipeImportSource.JSON_LD);
    expect(result.recipe.title).toBe("Soup");
    expect(result.sourceUrl).toBe("https://cooking.nytimes.com/recipes/1-soup");
    expect(result.sourceName).toBe("NYT Cooking");
  });

  it("falls back to the share image and resolves it against the page", async () => {
    const result = importRecipeFromPage({
      url: "https://example.com/recipes/soup",
      html: `<html><head><meta property="og:image" content="/img/soup.jpg"><script type="application/ld+json">${JSON.stringify(
        {
          "@type": "Recipe",
          name: "Soup",
          recipeIngredient: ["1 onion"],
          recipeInstructions: ["Chop the onion."],
        },
      )}</script></head><body></body></html>`,
    });

    expect(result.imageUrl).toBe("https://example.com/img/soup.jpg");
  });
});

describe("importRecipeFromText", () => {
  it("keeps a confident parse without warnings", () => {
    const result = importRecipeFromText(TIDY_TEXT);

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.recipe.ingredients).toHaveLength(5);
    expect(result.warnings).toEqual([]);
  });

  it("warns when the parse probably missed something", () => {
    const result = importRecipeFromText(MESSY_TEXT);

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.warnings[0]).toContain("Some details may be missing");
  });
});

describe("importRecipeFromImage", () => {
  const image = Buffer.from("fake-image");

  it("reads the photo with OCR", async () => {
    mocks.extractTextFromImage.mockResolvedValue({
      text: TIDY_TEXT,
      confidence: 0.95,
    });

    const result = await importRecipeFromImage(image);

    expect(result.source).toBe(RecipeImportSource.OCR_TEXT_PARSER);
    expect(result.recipe.ingredients).toHaveLength(5);
    expect(result.warnings).toEqual([]);
  });

  it("warns when OCR confidence is low", async () => {
    mocks.extractTextFromImage.mockResolvedValue({
      text: TIDY_TEXT,
      confidence: 0.4,
    });

    const result = await importRecipeFromImage(image);

    expect(result.confidence).toBe(0.4);
    expect(result.warnings[0]).toContain("Some details may be missing");
  });

  it("reports when no text can be read", async () => {
    mocks.extractTextFromImage.mockResolvedValue({ text: "", confidence: 0 });

    const result = await importRecipeFromImage(image);

    expect(result.confidence).toBe(0);
    expect(result.warnings[0]).toContain("No text could be read");
  });
});
