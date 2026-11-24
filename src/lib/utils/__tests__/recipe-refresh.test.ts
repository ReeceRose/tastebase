import { describe, expect, it } from "vitest";
import { PhotoRole, RecipeDifficulty } from "@/lib/types";
import {
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";
import {
  RefreshChangeKind,
  RefreshSection,
} from "@/lib/types/recipe-refresh-types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import { alignLists, textSimilarity } from "@/lib/utils/list-alignment";
import { emptyNutrition } from "@/lib/utils/nutrition";
import {
  applyRefreshPlan,
  buildRefreshPlan,
  changedSections,
} from "@/lib/utils/recipe-refresh";

function step(key: string, instruction: string, notes = "") {
  return { key, instruction, temperature: "", notes, groupName: "" };
}

function ingredient(amount: string, unit: string, name: string) {
  return {
    name,
    amount,
    unit,
    notes: "",
    groupName: "",
    isOptional: false,
    linkedRecipeId: null,
    linkedRecipeTitle: null,
  };
}

function current(): RecipeEditorValues {
  return {
    title: "Lentil soup",
    description: "Cosy.",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "",
    sourceUrl: "https://example.com/lentil-soup",
    sourceName: "Example",
    videoUrl: "",
    extraNotes: "We add extra lemon.",
    nutrition: emptyNutrition(),
    isPublic: true,
    ingredients: [
      ingredient("1", "cup", "red lentils"),
      {
        ...ingredient("1", "", "onion"),
        linkedRecipeId: "r1",
        linkedRecipeTitle: "Caramelised onions",
      },
      ingredient("4", "cups", "stock"),
    ],
    instructions: [
      step("k1", "Soften the onion in oil for 5 minutes.", "Use a big pot"),
      step("k2", "Add the lentils and stock and simmer for 25 minutes."),
      step("k3", "Season with salt."),
    ],
    tags: ["soup"],
    photoTags: [
      { photo: "p1", role: PhotoRole.STEP, stepKey: "k1" },
      { photo: "p2", role: PhotoRole.STEP, stepKey: "k3" },
      { photo: "p3", role: PhotoRole.FINISHED, stepKey: null },
    ],
    swatch: null,
  };
}

function imported(): RecipeImportResult {
  return {
    recipe: {
      title: "Lentil soup",
      description: null,
      servings: 6,
      prepTime: 10,
      cookTime: null,
      totalTime: null,
      ingredients: [
        {
          quantity: "1.5",
          unit: "cups",
          name: "red lentils",
          notes: null,
          groupName: null,
          isOptional: false,
        },
        {
          quantity: "1",
          unit: null,
          name: "onion",
          notes: "diced",
          groupName: null,
          isOptional: false,
        },
        {
          quantity: "4",
          unit: "cups",
          name: "stock",
          notes: null,
          groupName: null,
          isOptional: false,
        },
        {
          quantity: "1",
          unit: null,
          name: "lemon",
          notes: null,
          groupName: null,
          isOptional: false,
        },
      ],
      instructions: [
        {
          step: 1,
          instruction: "Soften the onion in olive oil for 5 minutes.",
          timeMinutes: 5,
          temperature: null,
          groupName: null,
        },
        {
          step: 2,
          instruction: "Add the lentils and stock and simmer for 25 minutes.",
          timeMinutes: 25,
          temperature: null,
          groupName: null,
        },
        {
          step: 3,
          instruction: "Blend until smooth, then squeeze in the lemon.",
          timeMinutes: null,
          temperature: null,
          groupName: null,
        },
      ],
      tags: [],
      difficulty: null,
      cuisine: null,
      nutrition: { ...emptyNutrition(), calories: 320, protein: 18 },
    },
    source: RecipeImportSource.JSON_LD,
    confidence: 1,
    sourceUrl: "https://example.com/lentil-soup",
    sourceName: "Example",
    imageUrl: null,
    image: null,
    photoUrls: [],
    stepPhotos: [],
    videos: [],
    tips: [],
    videoLink: null,
    warnings: [],
  };
}

describe("alignLists", () => {
  it("pairs edited lines and leaves added and removed ones unpaired", () => {
    expect(
      alignLists(["a b c", "d e f", "g h i"], ["a b c x", "g h i", "new line"]),
    ).toEqual([
      { before: 0, after: 0 },
      { before: 1, after: null },
      { before: 2, after: 1 },
      { before: null, after: 2 },
    ]);
  });

  it("scores word overlap", () => {
    expect(textSimilarity("red lentils", "Red lentils")).toBe(1);
    expect(textSimilarity("red lentils", "stock")).toBe(0);
  });
});

describe("buildRefreshPlan", () => {
  it("only reports details the source gives and that differ", () => {
    const plan = buildRefreshPlan(current(), imported());
    expect(plan.details).toEqual([
      { label: "Serves", before: "4", after: "6" },
    ]);
  });

  it("keeps linked recipes on ingredients that still match", () => {
    const plan = buildRefreshPlan(current(), imported());
    expect(plan.mergedIngredients[1]).toMatchObject({
      name: "onion",
      notes: "diced",
      linkedRecipeId: "r1",
    });
    expect(plan.ingredients.map((change) => change.kind)).toEqual([
      RefreshChangeKind.CHANGED,
      RefreshChangeKind.CHANGED,
      RefreshChangeKind.ADDED,
    ]);
  });

  it("keeps step keys and notes so photos stay on matching steps", () => {
    const plan = buildRefreshPlan(current(), imported());
    expect(plan.mergedInstructions[0]).toMatchObject({
      key: "k1",
      notes: "Use a big pot",
      instruction: "Soften the onion in olive oil for 5 minutes.",
    });
    expect(plan.mergedInstructions[1].key).toBe("k2");
    expect(plan.mergedInstructions[2].key).not.toBe("k3");
    expect(plan.detachedMedia).toBe(1);
  });

  it("reports nutrition from the source", () => {
    const plan = buildRefreshPlan(current(), imported());
    expect(plan.nutrition).toEqual([
      { label: "Calories", before: null, after: "320 kcal" },
      { label: "Protein", before: null, after: "18 g" },
    ]);
  });

  it("finds nothing to change when the page matches", () => {
    const first = buildRefreshPlan(current(), imported());
    const updated = applyRefreshPlan(current(), first, changedSections(first));
    expect(changedSections(buildRefreshPlan(updated, imported()))).toEqual([]);
  });

  it("doesn't empty a list the page didn't give", () => {
    const result = imported();
    result.recipe.instructions = [];
    const plan = buildRefreshPlan(current(), result);
    expect(plan.method).toEqual([]);
    expect(
      applyRefreshPlan(current(), plan, [RefreshSection.METHOD]).instructions,
    ).toEqual(current().instructions);
  });
});

describe("applyRefreshPlan", () => {
  it("applies only the chosen sections and keeps everything else", () => {
    const before = current();
    const plan = buildRefreshPlan(before, imported());
    const after = applyRefreshPlan(before, plan, [
      RefreshSection.METHOD,
      RefreshSection.NUTRITION,
    ]);
    expect(after.servings).toBe(4);
    expect(after.ingredients).toEqual(before.ingredients);
    expect(after.instructions).toHaveLength(3);
    expect(after.nutrition.calories).toBe(320);
    expect(after.extraNotes).toBe("We add extra lemon.");
    expect(after.tags).toEqual(["soup"]);
    expect(after.photoTags).toEqual([
      { photo: "p1", role: PhotoRole.STEP, stepKey: "k1" },
      { photo: "p3", role: PhotoRole.FINISHED, stepKey: null },
    ]);
  });
});
