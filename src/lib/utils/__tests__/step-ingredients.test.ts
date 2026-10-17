import { describe, expect, it } from "vitest";
import type { RecipeIngredient } from "@/lib/types/recipe-types";
import { matchStepIngredients } from "@/lib/utils/step-ingredients";

function ingredients(
  list: { name: string; group?: string | null }[],
): RecipeIngredient[] {
  return list.map((item, index) => ({
    id: `ing-${index + 1}`,
    recipeId: "recipe-1",
    name: item.name,
    amount: null,
    unit: null,
    notes: null,
    groupName: item.group ?? null,
    sortOrder: index + 1,
    isOptional: false,
  }));
}

function names(steps: string[], list: RecipeIngredient[]): string[][] {
  return matchStepIngredients(steps, list).map((step) =>
    step.map((item) => item.name),
  );
}

describe("matchStepIngredients", () => {
  it("finds ingredients named in a step, ignoring descriptors", () => {
    const list = ingredients([
      { name: "all-purpose flour" },
      { name: "baking soda" },
      { name: "large eggs" },
      { name: "unsalted butter" },
    ]);
    expect(
      names(["Whisk the flour and baking soda.", "Beat in the egg."], list),
    ).toEqual([["all-purpose flour", "baking soda"], ["large eggs"]]);
  });

  it("lists a whole section when a step uses everything in it", () => {
    const list = ingredients([
      { name: "lime juice", group: "For the marinade" },
      { name: "soy sauce", group: "For the marinade" },
      { name: "skirt steak", group: "For the fajitas" },
    ]);
    expect(
      names(
        [
          "Blend everything for the marinade.",
          "Add the steak to the rest of the marinade.",
        ],
        list,
      ),
    ).toEqual([["lime juice", "soy sauce"], ["skirt steak"]]);
  });

  it("lists every ingredient for a generic combine step", () => {
    const list = ingredients([{ name: "flour" }, { name: "water" }]);
    expect(names(["Combine all ingredients in a bowl."], list)).toEqual([
      ["flour", "water"],
    ]);
  });

  it("reads messy imported names", () => {
    const list = ingredients([
      { name: "(4g) baking soda" },
      {
        name: "(about 2kg) russet or Yukon Gold potatoes, peeled and cut into quarters",
      },
      { name: "Small handful picked rosemary leaves, finely chopped" },
    ]);
    expect(
      names(["Add the potatoes, baking soda and rosemary."], list),
    ).toEqual([
      [
        "(4g) baking soda",
        "(about 2kg) russet or Yukon Gold potatoes, peeled and cut into quarters",
        "Small handful picked rosemary leaves, finely chopped",
      ],
    ]);
  });

  it("skips ambiguous and generic words", () => {
    const list = ingredients([
      { name: "kosher salt" },
      { name: "flaky sea salt" },
      { name: "soy sauce" },
    ]);
    expect(
      names(["Season with salt.", "Simmer until the sauce is glossy."], list),
    ).toEqual([[], []]);
  });

  it("resolves an ambiguous word from the section the step is using", () => {
    const list = ingredients([
      { name: "black pepper", group: "For the marinade" },
      { name: "vegetable oil", group: "For the marinade" },
      { name: "red bell pepper", group: "For the fajitas" },
      { name: "red onion", group: "For the fajitas" },
      { name: "vegetable oil", group: "For the fajitas" },
    ]);
    const [step] = matchStepIngredients(
      ["Heat the oil, then cook the peppers and onion."],
      list,
    );
    expect(step.map((item) => item.id)).toEqual(["ing-3", "ing-4", "ing-5"]);
  });
});
