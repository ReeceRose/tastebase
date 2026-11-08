import { describe, expect, it } from "vitest";
import {
  cleanEditorValues,
  editorValuesFromImport,
  emptyEditorValues,
  emptyIngredient,
  emptyInstruction,
  linkSearchFromIngredient,
  parsePastedIngredients,
  parsePastedSteps,
} from "@/lib/utils/recipe-editor-values";

describe("emptyEditorValues", () => {
  it("starts with blank rows to type into", () => {
    const values = emptyEditorValues(true);
    expect(values.ingredients.length).toBeGreaterThan(0);
    expect(values.instructions.length).toBeGreaterThan(0);
    expect(values.swatch).toBeNull();
  });

  it.each([true, false])("starts with isPublic set to %s", (isPublic) => {
    expect(emptyEditorValues(isPublic).isPublic).toBe(isPublic);
  });
});

describe("editorValuesFromImport", () => {
  it("drops zero times and keeps blank rows", () => {
    const values = editorValuesFromImport(
      {
        title: "Pasta e ceci",
        prepTimeMinutes: 0,
        cookTimeMinutes: 30,
        ingredients: [],
      },
      true,
    );
    expect(values.prepTimeMinutes).toBeUndefined();
    expect(values.cookTimeMinutes).toBe(30);
    expect(values.ingredients.length).toBeGreaterThan(0);
  });

  it.each([
    [true, false],
    [false, true],
  ])("uses the default of %s over an imported %s", (isPublic, imported) => {
    const values = editorValuesFromImport(
      { title: "Pasta e ceci", isPublic: imported },
      isPublic,
    );
    expect(values.isPublic).toBe(isPublic);
  });
});

describe("cleanEditorValues", () => {
  it("keeps a linked recipe with its ingredient", () => {
    const cleaned = cleanEditorValues({
      ...emptyEditorValues(true),
      ingredients: [
        {
          ...emptyIngredient(),
          name: "Pesto",
          linkedRecipeId: "recipe-2",
          linkedRecipeTitle: "Basil pesto",
        },
      ],
    });
    expect(cleaned.values.ingredients[0].linkedRecipeId).toBe("recipe-2");
  });

  it("drops blank rows and keeps a map back to the form rows", () => {
    const values = {
      ...emptyEditorValues(true),
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
      ...emptyEditorValues(true),
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

describe("linkSearchFromIngredient", () => {
  it("drops the word recipe so 'pesto recipe' finds Pesto", () => {
    expect(linkSearchFromIngredient("pesto recipe")).toBe("pesto");
    expect(linkSearchFromIngredient("balsamic reduction")).toBe(
      "balsamic reduction",
    );
  });
});
