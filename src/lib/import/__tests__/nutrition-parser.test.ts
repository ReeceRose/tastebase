import { describe, expect, it } from "vitest";
import { extractJsonLdRecipe } from "@/lib/import/json-ld-parser";
import { extractMicrodataRecipe } from "@/lib/import/microdata-parser";
import {
  parseNutrition,
  readNutrientAmount,
} from "@/lib/import/nutrition-parser";
import { NutrientUnit } from "@/lib/types/nutrition-types";

function jsonLdPage(nutrition: object | object[] | undefined): string {
  const recipe = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: "Lentil soup",
    recipeIngredient: ["1 cup lentils"],
    recipeInstructions: ["Simmer."],
    ...(nutrition ? { nutrition } : {}),
  };
  return `<script type="application/ld+json">${JSON.stringify(recipe)}</script>`;
}

describe("readNutrientAmount", () => {
  it.each([
    ["320 kcal", NutrientUnit.KCAL, 320],
    ["320 calories", NutrientUnit.KCAL, 320],
    ["320", NutrientUnit.KCAL, 320],
    ["1,250 kcal", NutrientUnit.KCAL, 1250],
    ["1339 kJ", NutrientUnit.KCAL, 320],
    ["12 g", NutrientUnit.GRAMS, 12],
    ["12.46g", NutrientUnit.GRAMS, 12.5],
    ["<1 g", NutrientUnit.GRAMS, 1],
    ["approx. 4 grams", NutrientUnit.GRAMS, 4],
    ["500 mg", NutrientUnit.GRAMS, 0.5],
    ["480 mg", NutrientUnit.MILLIGRAMS, 480],
    ["0.48 g", NutrientUnit.MILLIGRAMS, 480],
    ["480", NutrientUnit.MILLIGRAMS, 480],
    [".5 g", NutrientUnit.GRAMS, 0.5],
  ])("reads %s", (text, unit, expected) => {
    expect(readNutrientAmount(text, unit)).toBe(expected);
  });

  it.each([
    [null, NutrientUnit.GRAMS],
    ["", NutrientUnit.GRAMS],
    ["none", NutrientUnit.GRAMS],
    ["12 cups", NutrientUnit.GRAMS],
    ["12 g", NutrientUnit.KCAL],
  ])("leaves out %s", (text, unit) => {
    expect(readNutrientAmount(text, unit)).toBeNull();
  });
});

describe("parseNutrition", () => {
  it("returns null when nothing is a number", () => {
    expect(parseNutrition(() => null)).toBeNull();
    expect(
      parseNutrition((property) =>
        property === "servingSize" ? "1 bowl" : null,
      ),
    ).toBeNull();
  });
});

describe("nutrition from JSON-LD", () => {
  it("reads a NutritionInformation node", () => {
    const result = extractJsonLdRecipe(
      jsonLdPage({
        "@type": "NutritionInformation",
        servingSize: "1 bowl",
        calories: "320 kcal",
        fatContent: "12 g",
        saturatedFatContent: "3 g",
        carbohydrateContent: "40 g",
        sugarContent: "6 g",
        fiberContent: "5 g",
        proteinContent: "14 g",
        sodiumContent: "480 mg",
        cholesterolContent: "35 mg",
      }),
    );
    expect(result?.recipe.nutrition).toEqual({
      servingSize: "1 bowl",
      calories: 320,
      fat: 12,
      saturatedFat: 3,
      carbohydrates: 40,
      sugar: 6,
      fibre: 5,
      protein: 14,
      sodium: 480,
      cholesterol: 35,
    });
  });

  it("reads a node wrapped in a list and keeps missing values empty", () => {
    const result = extractJsonLdRecipe(
      jsonLdPage([{ "@type": "NutritionInformation", calories: 250 }]),
    );
    expect(result?.recipe.nutrition).toMatchObject({
      calories: 250,
      fat: null,
      servingSize: null,
    });
  });

  it("is null when the recipe has no nutrition", () => {
    expect(extractJsonLdRecipe(jsonLdPage(undefined))?.recipe.nutrition).toBe(
      null,
    );
  });
});

describe("nutrition from microdata", () => {
  it("reads nutrition properties inside the recipe", () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Lentil soup</h1>
        <li itemprop="recipeIngredient">1 cup lentils</li>
        <div itemprop="recipeInstructions">Simmer.</div>
        <div itemprop="nutrition" itemscope itemtype="https://schema.org/NutritionInformation">
          <span itemprop="calories">310 calories</span>
          <span itemprop="proteinContent">18 grams</span>
        </div>
      </div>`;
    expect(extractMicrodataRecipe(html)?.nutrition).toMatchObject({
      calories: 310,
      protein: 18,
      fat: null,
    });
  });
});
