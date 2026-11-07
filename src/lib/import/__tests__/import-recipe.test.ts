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
      url: "https://example.com/pancakes",
      html: `<html><body><h1>Pancakes</h1><article>${TIDY_TEXT.split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("")}</article></body></html>`,
    });

    const result = await importRecipeFromUrl("https://example.com/pancakes");

    expect(result.source).toBe(RecipeImportSource.TEXT_PARSER);
    expect(result.recipe.ingredients).toHaveLength(5);
    expect(result.warnings).toEqual([]);
  });

  it("fills nothing in from a page that isn't a recipe", async () => {
    mocks.fetchRecipePage.mockResolvedValue({
      url: "https://example.com/story",
      html: `<html><head><meta property="og:site_name" content="Story Blog"></head><body><article><p>${MESSY_TEXT}</p></article></body></html>`,
    });

    const result = await importRecipeFromUrl("https://example.com/story");

    expect(result.sourceName).toBe("Story Blog");
    expect(result.confidence).toBe(0);
    expect(result.recipe.ingredients).toEqual([]);
    expect(result.recipe.instructions).toEqual([]);
    expect(result.warnings[0]).toContain("doesn't look like a recipe");
  });

  it("sends a list of recipes back to pick one", () => {
    const article = [
      "<h1>21 Best Cozy Fall Baking Recipes</h1>",
      "<h2>Ingredients</h2>",
      "<p>18 reviews / 5 average</p><p>615 Comments</p><p>12 reviews / 4.6 average</p>",
      "<h2>Instructions</h2>",
      "<p>This one is a family favourite and makes the whole house smell wonderful.</p>",
    ].join("");

    const result = importRecipeFromPage({
      url: "https://example.com/fall-baking",
      html: `<html><head><meta property="og:title" content="21 Best Cozy Fall Baking Recipes"></head><body><article>${article}</article></body></html>`,
    });

    expect(result.recipe.title).toBe("21 Best Cozy Fall Baking Recipes");
    expect(result.recipe.ingredients).toEqual([]);
    expect(result.warnings[0]).toContain("list of recipes");
  });

  it("reads microdata when a page has no JSON-LD", () => {
    const result = importRecipeFromPage({
      url: "https://example.com/old",
      html: `<html><body><div itemscope itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Old Soup</h1>
        <li itemprop="recipeIngredient">2 cups stock</li>
        <li itemprop="recipeIngredient">1 onion, diced</li>
        <div itemprop="recipeInstructions"><p>Simmer it all.</p><p>Enjoy!</p></div>
      </div></body></html>`,
    });

    expect(result.source).toBe(RecipeImportSource.MICRODATA);
    expect(result.recipe.title).toBe("Old Soup");
    expect(result.recipe.ingredients[1]).toMatchObject({
      name: "onion",
      notes: "diced",
    });
    expect(result.recipe.instructions).toHaveLength(1);
  });

  it("fills missing steps from the page when the structured data has none", () => {
    const result = importRecipeFromPage({
      url: "https://example.com/partial",
      html: `<html><head><script type="application/ld+json">${JSON.stringify({
        "@type": "Recipe",
        name: "Stew",
        recipeIngredient: ["2 cups stock", "1 lb beef"],
      })}</script></head><body><article><h2>Instructions</h2><p>1. Brown the beef well on all sides.</p><p>2. Add the stock and simmer until tender.</p>${"<p>More about stew.</p>".repeat(20)}</article></body></html>`,
    });

    expect(result.recipe.ingredients).toHaveLength(2);
    expect(result.recipe.instructions[0].instruction).toBe(
      "Brown the beef well on all sides.",
    );
  });

  it("lowers confidence and names rows that came out wrong", () => {
    const result = importRecipeFromPage({
      url: "https://example.com/rough",
      html: `<html><head><script type="application/ld+json">${JSON.stringify({
        "@type": "Recipe",
        name: "Rough",
        recipeIngredient: ["1 cup flour", "1 cup milk (whole", "1 tsp salt"],
        recipeInstructions: ["Mix."],
      })}</script></head></html>`,
    });

    expect(result.confidence).toBeLessThan(0.95);
    expect(result.warnings.join(" ")).toContain("may have imported wrongly");
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
