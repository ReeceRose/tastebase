import { describe, expect, it } from "vitest";
import { RecipeDifficulty } from "@/lib/types";
import type {
  RecipeFormData,
  RecipeIngredient,
} from "@/lib/types/recipe-types";
import {
  formatIngredientAmount,
  formatServings,
  formatTime,
  generateRecipeSlug,
  getDifficultyColor,
  getDifficultyLabel,
  parseIngredientAmount,
  validateRecipeFormData,
} from "@/lib/utils/recipe-utils";

describe("Recipe Utilities", () => {
  describe("formatTime", () => {
    it("should format time correctly for various inputs", () => {
      expect(formatTime(0)).toBe("0 min");
      expect(formatTime(30)).toBe("30 min");
      expect(formatTime(60)).toBe("1 hr");
      expect(formatTime(90)).toBe("1 hr 30 min");
      expect(formatTime(120)).toBe("2 hrs");
      expect(formatTime(150)).toBe("2 hrs 30 min");
    });
  });

  describe("formatServings", () => {
    it("should format servings correctly", () => {
      expect(formatServings(1)).toBe("1 serving");
      expect(formatServings(4)).toBe("4 servings");
      expect(formatServings(undefined)).toBe("Servings not specified");
      expect(formatServings(0)).toBe("Servings not specified");
    });
  });

  describe("getDifficultyColor", () => {
    it("should return correct colors for difficulty levels", () => {
      expect(getDifficultyColor("easy")).toBe(
        "text-green-600 dark:text-green-400",
      );
      expect(getDifficultyColor("medium")).toBe(
        "text-yellow-600 dark:text-yellow-400",
      );
      expect(getDifficultyColor("hard")).toBe("text-red-600 dark:text-red-400");
      expect(getDifficultyColor("unknown")).toBe("text-muted-foreground");
      expect(getDifficultyColor(undefined)).toBe("text-muted-foreground");
    });
  });

  describe("getDifficultyLabel", () => {
    it("should return correct labels for difficulty levels", () => {
      expect(getDifficultyLabel("easy")).toBe("Easy");
      expect(getDifficultyLabel("medium")).toBe("Medium");
      expect(getDifficultyLabel("hard")).toBe("Hard");
      expect(getDifficultyLabel("unknown")).toBe("Not specified");
      expect(getDifficultyLabel(undefined)).toBe("Not specified");
    });
  });

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

  describe("formatIngredientAmount", () => {
    it("should format ingredients with amounts and units", () => {
      const ingredient: RecipeIngredient = {
        id: "1",
        recipeId: "recipe1",
        name: "flour",
        amount: "2",
        unit: "cups",
        notes: null,
        groupName: null,
        sortOrder: 0,
        isOptional: false,
      };

      expect(formatIngredientAmount(ingredient)).toBe("2 cups flour");
    });

    it("should format ingredients with fractions", () => {
      const ingredient: RecipeIngredient = {
        id: "1",
        recipeId: "recipe1",
        name: "sugar",
        amount: "1/2",
        unit: "cup",
        notes: null,
        groupName: null,
        sortOrder: 0,
        isOptional: false,
      };

      expect(formatIngredientAmount(ingredient)).toBe("1/2 cup sugar");
    });

    it("should include notes and optional flags", () => {
      const ingredient: RecipeIngredient = {
        id: "1",
        recipeId: "recipe1",
        name: "vanilla",
        amount: "1",
        unit: "tsp",
        notes: "pure extract",
        groupName: null,
        sortOrder: 0,
        isOptional: true,
      };

      expect(formatIngredientAmount(ingredient)).toBe(
        "1 tsp vanilla (pure extract) (optional)",
      );
    });

    it("should handle ingredients without amounts", () => {
      const ingredient: RecipeIngredient = {
        id: "1",
        recipeId: "recipe1",
        name: "salt",
        amount: null,
        unit: "to taste",
        notes: null,
        groupName: null,
        sortOrder: 0,
        isOptional: false,
      };

      expect(formatIngredientAmount(ingredient)).toBe("to taste salt");
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

  describe("validateRecipeFormData", () => {
    const validRecipeData: RecipeFormData = {
      title: "Test Recipe",
      description: "A test recipe",
      servings: 4,
      prepTimeMinutes: 30,
      cookTimeMinutes: 60,
      difficulty: RecipeDifficulty.MEDIUM,
      isPublic: true,
      ingredients: [
        {
          name: "flour",
          amount: "2",
          unit: "cups",
          isOptional: false,
        },
      ],
      instructions: [{ instruction: "Mix ingredients" }],
      tags: [],
    };

    it("should validate correct recipe data", () => {
      const result = validateRecipeFormData(validRecipeData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject recipe without title", () => {
      const invalidData = { ...validRecipeData, title: "" };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Recipe title is required");
    });

    it("should reject recipe with title too long", () => {
      const invalidData = {
        ...validRecipeData,
        title: "A".repeat(201), // 201 characters, exceeding the limit
      };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Title must be 200 characters or less");
    });

    it("should reject recipe without ingredients", () => {
      const invalidData = { ...validRecipeData, ingredients: [] };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("At least one ingredient is required");
    });

    it("should reject recipe without instructions", () => {
      const invalidData = { ...validRecipeData, instructions: [] };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("At least one instruction is required");
    });

    it("should validate servings range", () => {
      const invalidData = { ...validRecipeData, servings: 150 }; // Exceeds max
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Servings must be between 1 and 100");
    });

    it("should validate prep time range", () => {
      const invalidData = { ...validRecipeData, prepTimeMinutes: -10 };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Prep time must be between 0 and 600 minutes",
      );
    });

    it("should validate difficulty level", () => {
      const invalidData = {
        ...validRecipeData,
        difficulty: "impossible" as RecipeDifficulty, // Intentionally invalid for testing
      };
      const result = validateRecipeFormData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid difficulty level");
    });
  });
});
