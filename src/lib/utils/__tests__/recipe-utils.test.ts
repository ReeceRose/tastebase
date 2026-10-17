import { describe, expect, it } from "vitest";
import {
  generateRecipeSlug,
  parseIngredientAmount,
} from "@/lib/utils/recipe-utils";

describe("Recipe Utilities", () => {
  describe("parseIngredientAmount", () => {
    it("should parse simple numbers with units", () => {
      expect(parseIngredientAmount("2 cups")).toEqual({
        amount: 2,
        unit: "cups",
      });
      expect(parseIngredientAmount("1.5 tbsp")).toEqual({
        amount: 1.5,
        unit: "tbsp",
      });
    });

    it("should parse fractions", () => {
      expect(parseIngredientAmount("1/2 cup")).toEqual({
        amount: 0.5,
        unit: "cup",
      });
      expect(parseIngredientAmount("1/4 tsp")).toEqual({
        amount: 0.25,
        unit: "tsp",
      });
      expect(parseIngredientAmount("3/4 lb")).toEqual({
        amount: 0.75,
        unit: "lb",
      });
    });

    it("should parse mixed numbers", () => {
      expect(parseIngredientAmount("1 1/2 cups")).toEqual({
        amount: 1.5,
        unit: "cups",
      });
      expect(parseIngredientAmount("2 1/4 lbs")).toEqual({
        amount: 2.25,
        unit: "lbs",
      });
    });

    it("should handle edge cases", () => {
      expect(parseIngredientAmount("")).toEqual({});
      expect(parseIngredientAmount("   ")).toEqual({});
      expect(parseIngredientAmount("to taste")).toEqual({ unit: "to taste" });
      expect(parseIngredientAmount("pinch")).toEqual({ unit: "pinch" });
    });
  });

  describe("generateRecipeSlug", () => {
    it("should generate valid slugs from recipe titles", () => {
      expect(generateRecipeSlug("Chocolate Chip Cookies")).toBe(
        "chocolate-chip-cookies",
      );
      expect(generateRecipeSlug("Mom's Famous Pasta Sauce!")).toBe(
        "moms-famous-pasta-sauce",
      );
      expect(generateRecipeSlug("Quick & Easy Stir-Fry")).toBe(
        "quick-easy-stir-fry",
      );
      expect(generateRecipeSlug("   Spicy   Mexican   Tacos   ")).toBe(
        "spicy-mexican-tacos",
      );
    });

    it("should handle special characters and long titles", () => {
      expect(
        generateRecipeSlug(
          "Super-Long Recipe Title With Many Words That Should Be Truncated Because It's Too Long",
        ),
      ).toBe("super-long-recipe-title-with-many-words-that-shoul");
      expect(generateRecipeSlug("Recipe@#$%^&*()Title")).toBe("recipetitle");
    });
  });
});
