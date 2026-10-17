import { describe, expect, it } from "vitest";
import {
  cleanEditorValues,
  editorValuesFromImport,
  emptyEditorValues,
  emptyIngredient,
  emptyInstruction,
  parsePastedIngredients,
  parsePastedSteps,
} from "@/lib/utils/recipe-editor-values";

describe("emptyEditorValues", () => {
  it("starts shared with the house and with blank rows to type into", () => {
    const values = emptyEditorValues();
    expect(values.isPublic).toBe(true);
    expect(values.ingredients.length).toBeGreaterThan(0);
    expect(values.instructions.length).toBeGreaterThan(0);
    expect(values.swatch).toBeNull();
  });
});

describe("editorValuesFromImport", () => {
  it("shares imports with the house and drops zero times", () => {
    const values = editorValuesFromImport({
      title: "Pasta e ceci",
      isPublic: false,
      prepTimeMinutes: 0,
      cookTimeMinutes: 30,
      ingredients: [],
    });
    expect(values.isPublic).toBe(true);
    expect(values.prepTimeMinutes).toBeUndefined();
    expect(values.cookTimeMinutes).toBe(30);
    expect(values.ingredients.length).toBeGreaterThan(0);
  });
});

describe("cleanEditorValues", () => {
  it("drops blank rows and keeps a map back to the form rows", () => {
    const values = {
      ...emptyEditorValues(),
      title: "  Soup  ",
      ingredients: [
        emptyIngredient(),
        { ...emptyIngredient(), name: "Leeks", amount: " 2 " },
        emptyIngredient(),
        { ...emptyIngredient(), amount: "1" },
      ],
      instructions: [
        emptyInstruction(),
        { ...emptyInstruction(), instruction: " Simmer. " },
      ],
      tags: [" soup ", ""],
    };
    const cleaned = cleanEditorValues(values);
    expect(cleaned.values.title).toBe("Soup");
    expect(cleaned.values.ingredients).toHaveLength(2);
    expect(cleaned.values.ingredients[0]).toMatchObject({
      name: "Leeks",
      amount: "2",
    });
    expect(cleaned.ingredientRows).toEqual([1, 3]);
    expect(cleaned.values.instructions).toEqual([
      expect.objectContaining({ instruction: "Simmer." }),
    ]);
    expect(cleaned.instructionRows).toEqual([1]);
    expect(cleaned.values.tags).toEqual(["soup"]);
  });

  it("turns NaN numbers from empty inputs into undefined", () => {
    const cleaned = cleanEditorValues({
      ...emptyEditorValues(),
      servings: Number.NaN,
      prepTimeMinutes: Number.NaN,
    });
    expect(cleaned.values.servings).toBeUndefined();
    expect(cleaned.values.prepTimeMinutes).toBeUndefined();
  });
});

describe("parsePastedIngredients", () => {
  it("splits a pasted list into ingredient rows", () => {
    const rows = parsePastedIngredients(
      "- 2 cups flour\n• 1 tsp salt\n\nOlive oil",
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ amount: "2", unit: "cups", name: "flour" });
    expect(rows[2]).toMatchObject({ name: "Olive oil", amount: "" });
  });
});

describe("parsePastedSteps", () => {
  it("strips numbering and picks up times", () => {
    const steps = parsePastedSteps(
      "1. Brown the onions for 10 minutes.\n2) Add the stock.",
    );
    expect(steps).toHaveLength(2);
    expect(steps[0].instruction).toBe("Brown the onions for 10 minutes.");
    expect(steps[0].timeMinutes).toBe(10);
    expect(steps[1].instruction).toBe("Add the stock.");
  });
});
