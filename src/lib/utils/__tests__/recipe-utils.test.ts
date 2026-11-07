import { describe, expect, it } from "vitest";
import {
  addRecipeSlugSuffix,
  generateRecipeSlug,
  parseIngredientAmount,
} from "@/lib/utils/recipe-utils";
import { slugSchema } from "@/lib/validations/recipe-schemas";

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

    it("should not end in a hyphen when truncation lands on a word break", () => {
      expect(
        generateRecipeSlug(
          "Salad-e Shirazi (Persian Cucumber, Tomato and Onion Salad)",
        ),
      ).toBe("salad-e-shirazi-persian-cucumber-tomato-and-onion");
    });

    it("should fall back when the title has no usable characters", () => {
      expect(generateRecipeSlug("سالاد شیرازی")).toBe("recipe");
    });

    it("should convert accented letters instead of dropping them", () => {
      expect(generateRecipeSlug("Crème Brûlée")).toBe("creme-brulee");
      expect(generateRecipeSlug("Jalapeño Poppers")).toBe("jalapeno-poppers");
      expect(generateRecipeSlug("Smørrebrød")).toBe("smorrebrod");
      expect(generateRecipeSlug("Bœuf Bourguignon")).toBe("boeuf-bourguignon");
    });

    it("should not turn fractions into digits", () => {
      expect(generateRecipeSlug("½ Cup Soup")).toBe("cup-soup");
    });

    it("should always produce a slug the recipe schema accepts", () => {
      const titles = [
        "Salad-e Shirazi (Persian Cucumber, Tomato and Onion Salad)",
        "سالاد شیرازی",
        "---",
        "- Leading and trailing -",
        `${"a".repeat(49)} word`,
        `Crème ${"é".repeat(60)}`,
      ];

      for (const title of titles) {
        const slug = generateRecipeSlug(title);

        expect(slugSchema.safeParse(slug).success).toBe(true);
        expect(
          slugSchema.safeParse(addRecipeSlugSuffix(slug, 100)).success,
        ).toBe(true);
      }
    });
  });

  describe("addRecipeSlugSuffix", () => {
    it("should append the counter to a short slug", () => {
      expect(addRecipeSlugSuffix("chocolate-chip-cookies", 2)).toBe(
        "chocolate-chip-cookies-2",
      );
    });

    it("should stay within the length limit and not double the hyphen", () => {
      const slug = addRecipeSlugSuffix(
        "salad-e-shirazi-persian-cucumber-tomato-and-onions",
        1,
      );

      expect(slug).toBe("salad-e-shirazi-persian-cucumber-tomato-and-onio-1");
      expect(slug).toHaveLength(50);

      expect(
        addRecipeSlugSuffix(
          "salad-e-shirazi-persian-cucumber-tomato-and-on-ion",
          10,
        ),
      ).toBe("salad-e-shirazi-persian-cucumber-tomato-and-on-10");
    });
  });
});
