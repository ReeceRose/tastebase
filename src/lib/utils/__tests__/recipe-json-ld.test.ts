import { describe, expect, it } from "vitest";
import { extractJsonLdRecipe } from "@/lib/import/json-ld-parser";
import { RecipeDifficulty } from "@/lib/types";
import type {
  RecipeImage,
  RecipeIngredient,
  RecipeInstruction,
  RecipeTag,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  buildRecipeJsonLd,
  ingredientLine,
  requestOrigin,
  serializeJsonLd,
} from "@/lib/utils/recipe-json-ld";

const ORIGIN = "https://recipes.example.com";
const DATE = new Date("2026-01-02T03:04:05.000Z");

const tag: RecipeTag = {
  id: "tag",
  name: "Soup",
  color: null,
  category: null,
  createdAt: DATE,
};

function ingredient(overrides: Partial<RecipeIngredient>): RecipeIngredient {
  return {
    id: "ingredient",
    recipeId: "recipe",
    name: "olive oil",
    amount: null,
    unit: null,
    notes: null,
    groupName: null,
    sortOrder: 0,
    isOptional: false,
    linkedRecipeId: null,
    ...overrides,
  };
}

function step(
  stepNumber: number,
  instruction: string,
  groupName: string | null = null,
): RecipeInstruction {
  return {
    id: `step-${stepNumber}`,
    recipeId: "recipe",
    stepNumber,
    instruction,
    timeMinutes: null,
    temperature: null,
    notes: null,
    groupName,
  };
}

function image(filename: string, isHero: boolean): RecipeImage {
  return {
    id: filename,
    recipeId: "recipe",
    filename,
    originalName: null,
    mimeType: "image/jpeg",
    fileSize: 1,
    width: null,
    height: null,
    altText: null,
    isHero,
    sortOrder: 0,
    photoRole: null,
    stepNumbers: [],
    metadata: null,
    uploadedAt: DATE,
  };
}

function recipe(overrides: Partial<RecipeWithRelations>): RecipeWithRelations {
  return {
    id: "recipe",
    slug: "tomato-soup",
    userId: "user",
    title: "Tomato soup",
    description: "A weeknight soup.",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "Italian",
    swatch: null,
    sourceUrl: null,
    sourceName: null,
    videoUrl: null,
    isPublic: true,
    isArchived: false,
    createdAt: DATE,
    updatedAt: DATE,
    author: { id: "user", name: "Sam" },
    ingredients: [
      ingredient({ amount: "2", unit: "tbsp", notes: "divided" }),
      ingredient({ amount: "1 1/2", unit: "cups", name: "stock" }),
    ],
    instructions: [step(1, "Heat the oil."), step(2, "Add the stock.")],
    images: [],
    notes: [],
    tags: [tag],
    ...overrides,
  };
}

describe("ingredientLine", () => {
  it("joins the amount, unit, name and notes into one line", () => {
    expect(
      ingredientLine(
        ingredient({ amount: "2", unit: "tbsp", notes: "divided" }),
      ),
    ).toBe("2 tbsp olive oil, divided");
  });

  it("leaves out missing parts and marks optional ingredients", () => {
    expect(ingredientLine(ingredient({ isOptional: true }))).toBe(
      "olive oil, optional",
    );
  });
});

describe("buildRecipeJsonLd", () => {
  it("leaves empty fields out rather than writing nulls", () => {
    const node = buildRecipeJsonLd(
      recipe({ description: null, cuisine: null, prepTimeMinutes: null }),
      ORIGIN,
    );
    expect(node).not.toHaveProperty("description");
    expect(node).not.toHaveProperty("recipeCuisine");
    expect(node).not.toHaveProperty("prepTime");
    expect(node).not.toHaveProperty("image");
  });

  it("uses absolute image addresses with the main photo first", () => {
    const node = buildRecipeJsonLd(
      recipe({ images: [image("b.jpg", false), image("a.jpg", true)] }),
      ORIGIN,
    );
    expect(node.image).toEqual([
      `${ORIGIN}/api/recipes/images/a.jpg`,
      `${ORIGIN}/api/recipes/images/b.jpg`,
    ]);
  });

  it("credits the original site for imported recipes", () => {
    const node = buildRecipeJsonLd(
      recipe({
        sourceName: "NYT Cooking",
        sourceUrl: "https://cooking.example.com/soup",
      }),
      ORIGIN,
    );
    expect(node.author).toEqual({
      "@type": "Organization",
      name: "NYT Cooking",
    });
    expect(node.isBasedOn).toBe("https://cooking.example.com/soup");
  });

  it("credits the person who added a recipe written here", () => {
    expect(buildRecipeJsonLd(recipe({}), ORIGIN).author).toEqual({
      "@type": "Person",
      name: "Sam",
    });
  });

  it("does not expose house notes", () => {
    const serialized = serializeJsonLd(
      buildRecipeJsonLd(
        recipe({
          notes: [
            {
              id: "note",
              recipeId: "recipe",
              userId: "user",
              content: "Secret family tweak",
              rating: 5,
              isPrivate: true,
              createdAt: DATE,
              updatedAt: DATE,
              authorName: "Sam",
            },
          ],
        }),
        ORIGIN,
      ),
    );
    expect(serialized).not.toContain("Secret family tweak");
  });
});

describe("serializeJsonLd", () => {
  it("cannot be closed early by recipe text", () => {
    const title = "</script><script>alert(1)</script>";
    const serialized = serializeJsonLd(
      buildRecipeJsonLd(recipe({ title }), ORIGIN),
    );
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized).name).toBe(title);
  });
});

describe("reading it back with Tastebase's import parser", () => {
  function roundTrip(source: RecipeWithRelations) {
    const json = serializeJsonLd(buildRecipeJsonLd(source, ORIGIN));
    return extractJsonLdRecipe(
      `<html><head><script type="application/ld+json">${json}</script></head></html>`,
    );
  }

  it("keeps the recipe's fields", () => {
    const parsed = roundTrip(recipe({ images: [image("a.jpg", true)] }));

    expect(parsed?.imageUrl).toBe(`${ORIGIN}/api/recipes/images/a.jpg`);
    expect(parsed?.recipe).toMatchObject({
      title: "Tomato soup",
      description: "A weeknight soup.",
      servings: 4,
      prepTime: 10,
      cookTime: 30,
      difficulty: RecipeDifficulty.EASY,
      cuisine: "Italian",
      tags: ["soup"],
    });
    expect(parsed?.recipe.ingredients.map((item) => item.name)).toEqual([
      "olive oil",
      "stock",
    ]);
    expect(parsed?.recipe.ingredients[0].notes).toBe("divided");
  });

  it("keeps every step in order, including steps in sections", () => {
    const parsed = roundTrip(
      recipe({
        instructions: [
          step(1, "Prep the vegetables."),
          step(2, "Simmer the sauce.", "Sauce"),
          step(3, "Season the sauce.", "Sauce"),
          step(4, "Boil the pasta.", "Pasta"),
          step(5, "Serve."),
        ],
      }),
    );

    expect(parsed?.recipe.instructions.map((item) => item.instruction)).toEqual(
      [
        "Prep the vegetables.",
        "Simmer the sauce.",
        "Season the sauce.",
        "Boil the pasta.",
        "Serve.",
      ],
    );
  });
});

describe("requestOrigin", () => {
  it("uses the host when there is no proxy", () => {
    expect(requestOrigin(new Headers({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("prefers the address a reverse proxy forwards", () => {
    expect(
      requestOrigin(
        new Headers({
          host: "tastebase:3000",
          "x-forwarded-host": "recipes.example.com, proxy.internal",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://recipes.example.com");
  });
});
