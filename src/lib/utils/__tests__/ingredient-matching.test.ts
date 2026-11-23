import { describe, expect, it } from "vitest";
import { ingredientKeys } from "@/lib/utils/ingredient-matching";

function looseMatch(a: string, b: string): boolean {
  return ingredientKeys(a).loose === ingredientKeys(b).loose;
}

describe("ingredientKeys", () => {
  it("matches the same ingredient written differently", () => {
    expect(looseMatch("unsalted butter", "butter")).toBe(true);
    expect(looseMatch("large eggs", "egg")).toBe(true);
    expect(looseMatch("all-purpose flour", "plain flour")).toBe(true);
    expect(looseMatch("all-purpose flour", "flour")).toBe(true);
    expect(looseMatch("granulated sugar", "white sugar")).toBe(true);
    expect(looseMatch("light brown sugar", "dark brown sugar")).toBe(true);
    expect(looseMatch("kosher salt", "fine sea salt")).toBe(true);
    expect(looseMatch("green onions", "scallion")).toBe(true);
    expect(looseMatch("pure vanilla extract", "vanilla")).toBe(true);
    expect(looseMatch("garlic cloves", "garlic")).toBe(true);
    expect(looseMatch("tomatoes", "tomato")).toBe(true);
    expect(looseMatch("Fresh cilantro or parsley", "cilantro")).toBe(true);
    expect(looseMatch("extra virgin olive oil", "olive oil")).toBe(true);
    expect(
      looseMatch("packed light or dark brown sugar (150g)", "dark brown sugar"),
    ).toBe(true);
    expect(
      looseMatch(
        "semi-sweet chocolate chips or chocolate chunks (225g)",
        "semisweet chocolate",
      ),
    ).toBe(true);
  });

  it("keeps different ingredients apart", () => {
    expect(looseMatch("peanut butter", "butter")).toBe(false);
    expect(looseMatch("egg yolks", "eggs")).toBe(false);
    expect(looseMatch("brown sugar", "sugar")).toBe(false);
    expect(looseMatch("bread flour", "all-purpose flour")).toBe(false);
    expect(looseMatch("baking powder", "baking soda")).toBe(false);
    expect(looseMatch("powdered sugar", "sugar")).toBe(false);
    expect(looseMatch("flaky sea salt", "kosher salt")).toBe(false);
  });

  it("ignores notes, brackets and amounts in the name", () => {
    expect(ingredientKeys("flour (125 g), sifted").loose).toBe("flour");
    expect(ingredientKeys("28-oz can whole peeled tomatoes").strict).toBe(
      "can whole peeled tomato",
    );
  });

  it("keeps descriptors in the strict key", () => {
    expect(ingredientKeys("dark soy sauce").strict).not.toBe(
      ingredientKeys("light soy sauce").strict,
    );
  });

  it("labels the row with the shared name", () => {
    expect(ingredientKeys("unsalted butter, softened").label).toBe("Butter");
    expect(ingredientKeys("large eggs").label).toBe("Eggs");
    expect(ingredientKeys("fresh").label).toBe("Fresh");
  });
});
