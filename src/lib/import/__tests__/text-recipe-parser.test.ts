import { describe, expect, it } from "vitest";
import { parseRecipeText } from "@/lib/import/text-recipe-parser";

const TIDY_RECIPE = `Classic Pancakes
Fluffy weekend pancakes.
Serves 4
Prep time: 10 minutes
Cook time: 20 mins

Ingredients
1 1/2 cups all-purpose flour
2 tbsp sugar
1 tsp baking powder
1 1/4 cups milk
1 egg

Instructions
1. Whisk the dry ingredients together in a large bowl.
2. Add the milk and egg and stir until just combined.
3. Cook on a griddle over medium heat for 2-3 minutes per side.

Notes
Leftovers freeze well.`;

describe("parseRecipeText", () => {
  it("parses a recipe with headings", () => {
    const { recipe, confidence } = parseRecipeText(TIDY_RECIPE, null);

    expect(recipe.title).toBe("Classic Pancakes");
    expect(recipe.description).toBe("Fluffy weekend pancakes.");
    expect(recipe.servings).toBe(4);
    expect(recipe.prepTime).toBe(10);
    expect(recipe.cookTime).toBe(20);
    expect(recipe.ingredients).toHaveLength(5);
    expect(recipe.ingredients[0]).toEqual({
      quantity: "1 1/2",
      unit: "cups",
      name: "all-purpose flour",
    });
    expect(recipe.instructions).toHaveLength(3);
    expect(recipe.instructions[2]).toMatchObject({
      step: 3,
      timeMinutes: 3,
      temperature: "medium heat",
    });
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("ignores notes after the instructions", () => {
    const { recipe } = parseRecipeText(TIDY_RECIPE, null);
    expect(
      recipe.instructions.some((step) => step.instruction.includes("freeze")),
    ).toBe(false);
  });

  it("accepts markdown headings and ingredient group labels", () => {
    const { recipe } = parseRecipeText(
      `# Tacos\n\n## Ingredients:\nFor the salsa:\n2 tomatoes\n1 onion\n\n## Method\n- Chop everything.\n- Mix and serve.`,
      null,
    );
    expect(recipe.title).toBe("Tacos");
    expect(recipe.ingredients.map((item) => item.name)).toEqual([
      "tomatoes",
      "onion",
    ]);
    expect(recipe.instructions.map((step) => step.instruction)).toEqual([
      "Chop everything.",
      "Mix and serve.",
    ]);
  });

  it("joins steps that wrap across lines", () => {
    const { recipe } = parseRecipeText(
      `Ingredients\n1 cup rice\nDirections\n1. Rinse the rice and add it\nto a pot with two cups of water.\n2. Simmer for 18 minutes.`,
      null,
    );
    expect(recipe.instructions[0].instruction).toBe(
      "Rinse the rice and add it to a pot with two cups of water.",
    );
    expect(recipe.instructions[1].timeMinutes).toBe(18);
  });

  it("classifies lines when there are no headings", () => {
    const { recipe } = parseRecipeText(
      `Garlic Bread\n4 tbsp butter\n2 cloves garlic\n1 baguette\nMix the butter and garlic, then spread it over the sliced baguette.\nBake at 400°F for 10 minutes until crisp.`,
      null,
    );
    expect(recipe.title).toBe("Garlic Bread");
    expect(recipe.ingredients).toHaveLength(3);
    expect(recipe.instructions).toHaveLength(2);
    expect(recipe.instructions[1].temperature).toBe("400°F");
  });

  it("uses the title hint when provided", () => {
    const { recipe } = parseRecipeText(TIDY_RECIPE, "Pancakes from the site");
    expect(recipe.title).toBe("Pancakes from the site");
  });

  it("gives low confidence to text that isn't a recipe", () => {
    const { recipe, confidence } = parseRecipeText(
      "We went to the farmers market on Saturday and it was lovely.",
      null,
    );
    expect(recipe.ingredients).toHaveLength(0);
    expect(confidence).toBeLessThan(0.6);
  });
});
