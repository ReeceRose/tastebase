import { describe, expect, it } from "vitest";
import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import { compareNutritionFacts } from "@/lib/utils/compare-nutrition";
import { emptyNutrition } from "@/lib/utils/nutrition";

function nutrition(extra: Partial<RecipeNutrition>): RecipeNutrition {
  return { ...emptyNutrition(), ...extra };
}

describe("compareNutritionFacts", () => {
  it("is empty when no recipe has nutrition", () => {
    expect(compareNutritionFacts([null, emptyNutrition()])).toEqual([]);
  });

  it("keeps only nutrients some recipe lists, with a dash for the rest", () => {
    const facts = compareNutritionFacts([
      nutrition({ calories: 408.4, protein: 6.25 }),
      nutrition({ calories: 350 }),
      null,
    ]);
    expect(facts.map((fact) => fact.label)).toEqual(["Calories", "Protein"]);
    expect(facts[0].cells.map((cell) => cell.value)).toEqual([
      "408",
      "350",
      null,
    ]);
    expect(facts[1].cells.map((cell) => cell.value)).toEqual([
      "6.3 g",
      null,
      null,
    ]);
    expect(facts.every((fact) => fact.bestLabel === null)).toBe(true);
    expect(facts.flatMap((fact) => fact.cells).some((cell) => cell.best)).toBe(
      false,
    );
  });

  it("shows serving sizes only when they differ", () => {
    const same = compareNutritionFacts([
      nutrition({ calories: 300, servingSize: "1 bowl" }),
      nutrition({ calories: 320, servingSize: "1 Bowl" }),
    ]);
    expect(same.map((fact) => fact.label)).toEqual(["Calories"]);

    const different = compareNutritionFacts([
      nutrition({ calories: 300, servingSize: "1 bowl" }),
      nutrition({ calories: 180, servingSize: "2 cookies" }),
      null,
    ]);
    expect(different[0]).toEqual({
      label: "Serving size",
      bestLabel: null,
      cells: [
        { value: "1 bowl", best: false },
        { value: "2 cookies", best: false },
        { value: null, best: false },
      ],
    });
  });

  it("treats a missing serving size as different from a listed one", () => {
    const facts = compareNutritionFacts([
      nutrition({ calories: 300, servingSize: "1 slice" }),
      nutrition({ calories: 280 }),
    ]);
    expect(facts[0].label).toBe("Serving size");
  });
});
