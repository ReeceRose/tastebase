import { describe, expect, it } from "vitest";
import { RecipeDifficulty } from "@/lib/types";
import {
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";
import { mapImportResultToFormData } from "@/lib/utils/recipe-import-mapping";

const RESULT: RecipeImportResult = {
  recipe: {
    title: "Chili",
    description: null,
    servings: 250,
    prepTime: 15,
    cookTime: null,
    ingredients: [
      {
        name: "beans",
        quantity: "1 1/2",
        unit: "cups",
        notes: "drained",
        groupName: "Chili",
        isOptional: true,
      },
      {
        name: "stock",
        quantity: "1 cup stock and a lot more than twenty",
        unit: null,
        notes: "x".repeat(300),
        groupName: "y".repeat(80),
        isOptional: false,
      },
    ],
    instructions: [
      {
        step: 1,
        instruction: "Simmer.",
        timeMinutes: 45,
        temperature: "low heat",
        groupName: null,
      },
    ],
    tags: ["dinner"],
    difficulty: null,
    cuisine: null,
  },
  source: RecipeImportSource.JSON_LD,
  confidence: 0.95,
  sourceUrl: "https://example.com/chili",
  sourceName: "Example",
  imageUrl: null,
  image: null,
  photoUrls: [],
  warnings: [],
};

describe("mapImportResultToFormData", () => {
  it("carries notes, sections and optional into the form", () => {
    expect(mapImportResultToFormData(RESULT).ingredients?.[0]).toEqual({
      name: "beans",
      amount: "1 1/2",
      unit: "cups",
      notes: "drained",
      groupName: "Chili",
      isOptional: true,
    });
  });

  it("keeps imported text within what the editor can save", () => {
    const row = mapImportResultToFormData(RESULT).ingredients?.[1];

    expect(row?.amount).toBe("");
    expect(row?.name).toContain("1 cup stock and a lot more");
    expect(row?.notes?.length).toBeLessThanOrEqual(200);
    expect(row?.groupName?.length).toBeLessThanOrEqual(50);
  });

  it("maps an import result to recipe form data", () => {
    const form = mapImportResultToFormData(RESULT);

    expect(form.title).toBe("Chili");
    expect(form.servings).toBe(100);
    expect(form.prepTimeMinutes).toBe(15);
    expect(form.cookTimeMinutes).toBe(0);
    expect(form.difficulty).toBe(RecipeDifficulty.MEDIUM);
    expect(form.sourceUrl).toBe("https://example.com/chili");
    expect(form.sourceName).toBe("Example");
    expect(form.ingredients?.[0]).toMatchObject({
      name: "beans",
      amount: "1 1/2",
      unit: "cups",
    });
  });

  it("keeps step times and temperatures", () => {
    const form = mapImportResultToFormData(RESULT);
    expect(form.instructions?.[0]).toMatchObject({
      instruction: "Simmer.",
      timeMinutes: 45,
      temperature: "low heat",
    });
  });
});
