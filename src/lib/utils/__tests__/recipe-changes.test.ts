import { describe, expect, it } from "vitest";
import { RecipeChangeType } from "@/lib/types";
import { describeRecipeChanges } from "@/lib/utils/recipe-changes";

const before = {
  title: "Pasta e ceci",
  description: "Quick and cosy",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  difficulty: "easy",
  cuisine: "Italian",
  sourceUrl: null,
  sourceName: null,
  swatch: null,
  isPublic: true,
};

const ingredients = [
  {
    name: "Chickpeas",
    amount: "2",
    unit: "tins",
    notes: null,
    groupName: null,
    isOptional: false,
  },
];
const steps = [
  {
    instruction: "Simmer.",
    timeMinutes: 20,
    temperature: null,
    notes: null,
    groupName: null,
  },
];

describe("describeRecipeChanges", () => {
  it("returns null when nothing changed, ignoring blank vs null", () => {
    expect(
      describeRecipeChanges({
        before,
        after: { ...before, sourceUrl: "", sourceName: undefined },
        ingredientsBefore: ingredients,
        ingredientsAfter: [{ ...ingredients[0], notes: "" }],
        instructionsBefore: steps,
        instructionsAfter: steps,
      }),
    ).toBeNull();
  });

  it("names a single kind of change", () => {
    const result = describeRecipeChanges({
      before,
      after: before,
      ingredientsBefore: ingredients,
      ingredientsAfter: [
        ...ingredients,
        { name: "Rosemary", isOptional: false },
      ],
      instructionsBefore: steps,
      instructionsAfter: steps,
    });
    expect(result).toEqual({
      type: RecipeChangeType.INGREDIENTS,
      description: "Updated the ingredients",
    });
  });

  it("calls several kinds of change a major update", () => {
    const result = describeRecipeChanges({
      before,
      after: { ...before, title: "Pasta e fagioli", servings: 6 },
      ingredientsBefore: ingredients,
      ingredientsAfter: ingredients,
      instructionsBefore: steps,
      instructionsAfter: [{ ...steps[0], timeMinutes: 25 }],
    });
    expect(result?.type).toBe(RecipeChangeType.MAJOR);
    expect(result?.description).toBe(
      "Updated the name, the method and the details",
    );
  });

  it("ignores lists that were not sent", () => {
    expect(
      describeRecipeChanges({
        before,
        after: before,
        ingredientsBefore: ingredients,
        ingredientsAfter: null,
        instructionsBefore: steps,
        instructionsAfter: null,
      }),
    ).toBeNull();
  });
});
