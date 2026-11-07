import { describe, expect, it } from "vitest";
import {
  findIngredientIssues,
  ingredientWarning,
  notARecipeWarning,
  pageTextIsRecipe,
  scoreStructuredRecipe,
} from "@/lib/import/import-quality";
import {
  IngredientIssue,
  type ParsedIngredient,
  type RecipeParsingResult,
} from "@/lib/types/import-types";

function row(
  name: string,
  quantity: string | null = "1",
  unit: string | null = "cup",
): ParsedIngredient {
  return {
    name,
    quantity,
    unit,
    notes: null,
    groupName: null,
    isOptional: false,
  };
}

function recipe(
  ingredients: ParsedIngredient[],
  stepCount = 2,
  title: string | null = "Soup",
): RecipeParsingResult {
  return {
    title,
    description: null,
    servings: null,
    prepTime: null,
    cookTime: null,
    ingredients,
    instructions: Array.from({ length: stepCount }, (_, index) => ({
      step: index + 1,
      instruction: "Stir the pot well.",
      timeMinutes: null,
      temperature: null,
      groupName: null,
    })),
    tags: [],
    difficulty: null,
    cuisine: null,
  };
}

const GOOD = [row("flour"), row("milk"), row("sugar")];

describe("findIngredientIssues", () => {
  it.each([
    [row("flour"), []],
    [row("eggs", "3", null), []],
    [row("Salt and pepper", null, null), []],
    [row(","), [IngredientIssue.NO_NAME, IngredientIssue.STRAY_PUNCTUATION]],
    [row("/ 14 oz tomato"), [IngredientIssue.STRAY_PUNCTUATION]],
    [row("2 cups flour", null, null), [IngredientIssue.AMOUNT_IN_NAME]],
    [row("Tbsp sugar", "3", null), [IngredientIssue.UNIT_IN_NAME]],
    [row("milk (whole"), [IngredientIssue.UNBALANCED_BRACKETS]],
    [row("Comments", "615", null), [IngredientIssue.PAGE_NOISE]],
    [row("x".repeat(101)), [IngredientIssue.TOO_LONG]],
  ])("checks %o", (ingredient, issues) => {
    expect(findIngredientIssues(ingredient)).toEqual(issues);
  });
});

describe("ingredientWarning", () => {
  it("says nothing about a clean list", () => {
    expect(ingredientWarning(GOOD)).toBeNull();
  });

  it("names the doubtful rows and counts the rest", () => {
    const warning = ingredientWarning([
      row("/ a"),
      row("/ b"),
      row("/ c"),
      row("/ d"),
      row("/ e"),
      row("/ f"),
    ]);
    expect(warning).toContain('"/ a"');
    expect(warning).toContain("and 1 more");
  });
});

describe("scoreStructuredRecipe", () => {
  it("falls with the share of doubtful rows", () => {
    expect(scoreStructuredRecipe(recipe(GOOD))).toBe(0.95);
    expect(
      scoreStructuredRecipe(recipe([row("/ a"), row("flour")])),
    ).toBeLessThan(0.95);
  });
});

describe("pageTextIsRecipe", () => {
  it("accepts a headed recipe", () => {
    expect(pageTextIsRecipe(recipe(GOOD), true)).toBe(true);
  });

  it("asks for more from a page without headings", () => {
    expect(pageTextIsRecipe(recipe(GOOD), false)).toBe(true);
    expect(pageTextIsRecipe(recipe(GOOD.slice(0, 2)), false)).toBe(false);
    expect(pageTextIsRecipe(recipe(GOOD, 1), false)).toBe(false);
  });

  it("refuses pages without steps or real amounts", () => {
    expect(pageTextIsRecipe(recipe(GOOD, 0), true)).toBe(false);
    expect(
      pageTextIsRecipe(
        recipe([row("Best Pies", "18", null), row("Easy Cakes", "20", null)]),
        true,
      ),
    ).toBe(false);
  });

  it("refuses page clutter and enormous lists", () => {
    expect(
      pageTextIsRecipe(
        recipe([row("Comments", "4", "cup"), row("Shares", "9", "cup")]),
        true,
      ),
    ).toBe(false);
    expect(pageTextIsRecipe(recipe(Array(61).fill(row("flour"))), true)).toBe(
      false,
    );
  });

  it.each([
    ["25 Essential Thanksgiving Recipes to Make in Your Air Fryer"],
    ["40+ Trusted Pies for Your Holiday Table"],
    ["The 10 Best Taco Recipes"],
  ])("refuses the list %s", (title) => {
    expect(pageTextIsRecipe(recipe(GOOD, 2, title), true)).toBe(false);
    expect(notARecipeWarning(title)).toContain("list of recipes");
  });

  it("doesn't mistake a number in a recipe's name for a list", () => {
    expect(pageTextIsRecipe(recipe(GOOD, 2, "30 Minute Chicken"), true)).toBe(
      true,
    );
    expect(pageTextIsRecipe(recipe(GOOD, 2, "5 Ingredient Soup"), true)).toBe(
      true,
    );
  });
});
