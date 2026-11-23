import { describe, expect, it } from "vitest";
import { MeasurementUnit } from "@/lib/types";
import type { CompareRecipe } from "@/lib/types/recipe-compare-types";
import type {
  RecipeIngredient,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  buildCompareRows,
  comparableAmount,
  compareFacts,
  compareHref,
  parseCompareSlugs,
  spreadCaption,
} from "@/lib/utils/recipe-compare";

type IngredientLine = [string | null, string | null, string];

function recipe(
  id: string,
  lines: IngredientLine[],
  extra: Partial<RecipeWithRelations> = {},
): RecipeWithRelations {
  const ingredients = lines.map(
    ([amount, unit, name], index) =>
      ({
        id: `${id}-${index}`,
        recipeId: id,
        name,
        amount,
        unit,
        notes: null,
        groupName: null,
        sortOrder: index,
        isOptional: false,
        linkedRecipeId: null,
      }) as RecipeIngredient,
  );
  return {
    id,
    slug: id,
    title: id,
    servings: 4,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    difficulty: null,
    ingredients,
    instructions: [],
    images: [],
    videos: [],
    notes: [],
    tags: [],
    author: { id: "u", name: "U" },
    ...extra,
  } as RecipeWithRelations;
}

describe("parseCompareSlugs", () => {
  it("splits, trims, de-duplicates and caps at four", () => {
    expect(parseCompareSlugs("a, b,a,,c,d,e")).toEqual(["a", "b", "c", "d"]);
    expect(parseCompareSlugs(["a", "b,c"])).toEqual(["a", "b", "c"]);
    expect(parseCompareSlugs(null)).toEqual([]);
  });

  it("round-trips through compareHref", () => {
    expect(compareHref(["a", "b"])).toBe("/recipes/compare?r=a,b");
    expect(compareHref([])).toBe("/recipes/compare");
  });
});

describe("comparableAmount", () => {
  it("turns cups of flour into grams", () => {
    expect(comparableAmount("2", "cups", "flour", 1)?.weight).toBe(250);
  });

  it("uses the middle of a range and applies the factor", () => {
    expect(comparableAmount("2-4", "", "eggs", 2)?.count).toBe(6);
  });

  it("uses the author's weight when a volume has one", () => {
    expect(
      comparableAmount("1 1/4", "cups", "chocolate chunks (225g)", 2)?.weight,
    ).toBe(450);
  });

  it("can't compare words", () => {
    expect(comparableAmount("to taste", null, "salt", 1)).toBeNull();
  });
});

describe("buildCompareRows", () => {
  const kenji = recipe("kenji", [
    ["8", "oz", "unsalted butter"],
    ["2", "cups", "all-purpose flour"],
    ["2", null, "large eggs"],
    ["1", null, "ice cube"],
  ]);
  const nyt = recipe(
    "nyt",
    [
      ["450", "g", "butter"],
      ["500", "g", "flour"],
      ["4", null, "eggs"],
    ],
    { servings: 8 },
  );

  const rows = buildCompareRows([kenji, nyt], [1, 0.5], MeasurementUnit.METRIC);

  it("lines up matching ingredients in one row", () => {
    expect(rows.map((row) => row.label)).toEqual([
      "Butter",
      "Flour",
      "Eggs",
      "Ice cube",
    ]);
    expect(rows[0].inAll).toBe(true);
    expect(rows[3].inAll).toBe(false);
    expect(rows[3].cells[1]).toBeNull();
  });

  it("compares scaled amounts in the same measure", () => {
    expect(rows[1].agrees).toBe(true);
    expect(rows[2].agrees).toBe(true);
    expect(rows[0].spread).toBeCloseTo(225 / 226.8, 1);
  });

  it("flags rows where the amounts differ", () => {
    const more = recipe("more", [["16", "oz", "butter"]]);
    const [butter] = buildCompareRows([kenji, more], [1, 1], null);
    expect(butter.agrees).toBe(false);
    expect(spreadCaption(butter.spread)).toBe("Up to 2× more");
    expect(butter.cells[0]?.share).toBeCloseTo(0.5);
  });

  it("never puts two ingredients from one recipe in the same row", () => {
    const sauces = recipe("sauces", [
      ["1", "tbsp", "light soy sauce"],
      ["1", "tsp", "dark soy sauce"],
    ]);
    const other = recipe("other", [["2", "tbsp", "soy sauce"]]);
    const result = buildCompareRows([sauces, other], [1, 1], null);
    expect(result).toHaveLength(2);
    expect(result[0].cells[1]).not.toBeNull();
  });

  it("shows the written name when it says more than the label", () => {
    expect(rows[0].cells[0]?.detail).toBe("unsalted butter");
    expect(rows[0].cells[1]?.detail).toBeNull();
  });
});

describe("compareFacts", () => {
  it("marks the quickest and fewest", () => {
    const items: CompareRecipe[] = [
      {
        recipe: recipe("a", [["1", null, "egg"]], {
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
        }),
        cooks: { count: 2, lastCookedAt: null, lastCookedBy: null },
        averageRating: null,
      },
      {
        recipe: recipe(
          "b",
          [
            ["1", null, "egg"],
            ["1", null, "milk"],
          ],
          { prepTimeMinutes: 5, cookTimeMinutes: 40 },
        ),
        cooks: { count: 0, lastCookedAt: null, lastCookedBy: null },
        averageRating: null,
      },
    ];
    const facts = compareFacts(items);
    const total = facts.find((row) => row.label === "Total time");
    const ingredients = facts.find((row) => row.label === "Ingredients");
    expect(total?.cells.map((cell) => cell.best)).toEqual([true, false]);
    expect(ingredients?.bestLabel).toBe("fewest");
    expect(facts.find((row) => row.label === "Rating")).toBeUndefined();
    expect(facts.find((row) => row.label === "Cooked")?.cells[1].value).toBe(
      "Never",
    );
  });
});
