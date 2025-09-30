import { describe, expect, it } from "vitest";
import type { RecipeFormData, RecipeParsingResult } from "@/lib/types";
import { RecipeDifficulty } from "@/lib/types";
import {
  formatRecipeForAIContext,
  mapParsedRecipeToFormData,
  mergeRecipeData,
  validateParsedRecipe,
} from "@/lib/utils/ai-recipe-integration";

describe("AI Recipe Integration Utils", () => {
  describe("mapParsedRecipeToFormData", () => {
    it("should map basic recipe information", () => {
      const parsedRecipe: RecipeParsingResult = {
        title: "Test Recipe",
        description: "A test recipe description",
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        difficulty: "medium",
        cuisine: "Italian",
      };

      const result = mapParsedRecipeToFormData(parsedRecipe);

      expect(result.title).toBe("Test Recipe");
      expect(result.description).toBe("A test recipe description");
      expect(result.servings).toBe(4);
      expect(result.prepTimeMinutes).toBe(15);
      expect(result.cookTimeMinutes).toBe(30);
      expect(result.difficulty).toBe(RecipeDifficulty.MEDIUM);
      expect(result.cuisine).toBe("Italian");
    });

    it("should map ingredients correctly", () => {
      const parsedRecipe: RecipeParsingResult = {
        ingredients: [
          { name: "Flour", quantity: "2", unit: "cups" },
          { name: "Sugar", quantity: "1", unit: "cup" },
          { name: "Salt", quantity: "", unit: "" },
        ],
      };

      const result = mapParsedRecipeToFormData(parsedRecipe);

      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients?.[0]).toEqual({
        name: "Flour",
        amount: 2,
        unit: "cups",
        notes: "",
        groupName: "",
        isOptional: false,
      });
      expect(result.ingredients?.[1]).toEqual({
        name: "Sugar",
        amount: 1,
        unit: "cup",
        notes: "",
        groupName: "",
        isOptional: false,
      });
      expect(result.ingredients?.[2]).toEqual({
        name: "Salt",
        amount: undefined,
        unit: "",
        notes: "",
        groupName: "",
        isOptional: false,
      });
    });

    it("should map instructions correctly", () => {
      const parsedRecipe: RecipeParsingResult = {
        instructions: [
          { step: 1, instruction: "Mix dry ingredients" },
          { step: 2, instruction: "Add wet ingredients" },
        ],
      };

      const result = mapParsedRecipeToFormData(parsedRecipe);

      expect(result.instructions).toHaveLength(2);
      expect(result.instructions?.[0]).toEqual({
        instruction: "Mix dry ingredients",
        timeMinutes: undefined,
        temperature: "",
        notes: "",
        groupName: "",
      });
      expect(result.instructions?.[1]).toEqual({
        instruction: "Add wet ingredients",
        timeMinutes: undefined,
        temperature: "",
        notes: "",
        groupName: "",
      });
    });

    it("should handle tags correctly", () => {
      const parsedRecipe: RecipeParsingResult = {
        tags: ["vegetarian", "quick", "easy"],
      };

      const result = mapParsedRecipeToFormData(parsedRecipe);

      expect(result.tags).toEqual(["vegetarian", "quick", "easy"]);
    });

    it("should handle empty or missing data gracefully", () => {
      const parsedRecipe: RecipeParsingResult = {};

      const result = mapParsedRecipeToFormData(parsedRecipe);

      // Should not have undefined values that would break form validation
      expect(result.title).toBeUndefined();
      expect(result.ingredients).toBeUndefined();
      expect(result.instructions).toBeUndefined();
    });

    it("should clamp servings to valid range", () => {
      const parsedRecipe1: RecipeParsingResult = { servings: -1 };
      const parsedRecipe2: RecipeParsingResult = { servings: 1000 };

      const result1 = mapParsedRecipeToFormData(parsedRecipe1);
      const result2 = mapParsedRecipeToFormData(parsedRecipe2);

      expect(result1.servings).toBe(1); // MIN_SERVINGS
      expect(result2.servings).toBe(100); // MAX_SERVINGS
    });
  });

  describe("validateParsedRecipe", () => {
    it("should validate a complete recipe", () => {
      const recipe: RecipeParsingResult = {
        title: "Complete Recipe",
        ingredients: [{ name: "Flour", quantity: "2", unit: "cups" }],
        instructions: [{ step: 1, instruction: "Mix ingredients" }],
        servings: 4,
        prepTime: 15,
        cookTime: 30,
        difficulty: "medium",
        cuisine: "American",
      };

      const result = validateParsedRecipe(recipe);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it("should identify missing essential data", () => {
      const recipe: RecipeParsingResult = {};

      const result = validateParsedRecipe(recipe);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("No recipe title found");
      expect(result.warnings).toContain("No ingredients found");
      expect(result.warnings).toContain("No cooking instructions found");
    });

    it("should suggest improvements for incomplete data", () => {
      const recipe: RecipeParsingResult = {
        title: "Basic Recipe",
        ingredients: [
          { name: "Flour", quantity: "2", unit: "cups" },
          { name: "Salt", quantity: "", unit: "" }, // Missing quantity
        ],
        instructions: [{ step: 1, instruction: "Mix" }],
      };

      const result = validateParsedRecipe(recipe);

      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain(
        "1 ingredients missing quantities - consider adding measurements",
      );
      expect(result.suggestions).toContain(
        "Consider adding prep and cook times for better planning",
      );
      expect(result.suggestions).toContain(
        "Adding serving size helps with meal planning",
      );
    });
  });

  describe("mergeRecipeData", () => {
    it("should merge parsed data into existing form data", () => {
      const existingData: Partial<RecipeFormData> = {
        title: "Existing Recipe",
        servings: 2,
      };

      const parsedData: RecipeParsingResult = {
        description: "New description",
        prepTime: 15,
        ingredients: [{ name: "Flour", quantity: "2", unit: "cups" }],
      };

      const result = mergeRecipeData(existingData, parsedData);

      expect(result.title).toBe("Existing Recipe"); // Preserved
      expect(result.servings).toBe(2); // Preserved
      expect(result.description).toBe("New description"); // Added
      expect(result.prepTimeMinutes).toBe(15); // Added
      expect(result.ingredients).toHaveLength(1); // Added
    });

    it("should overwrite existing data when configured", () => {
      const existingData: Partial<RecipeFormData> = {
        title: "Existing Recipe",
        description: "Old description",
      };

      const parsedData: RecipeParsingResult = {
        title: "New Recipe",
        description: "New description",
      };

      const result = mergeRecipeData(existingData, parsedData, {
        overwriteExisting: true,
      });

      expect(result.title).toBe("New Recipe");
      expect(result.description).toBe("New description");
    });

    it("should merge tags without duplicates", () => {
      const existingData: Partial<RecipeFormData> = {
        tags: ["vegetarian", "quick"],
      };

      const parsedData: RecipeParsingResult = {
        tags: ["quick", "easy", "healthy"],
      };

      const result = mergeRecipeData(existingData, parsedData);

      expect(result.tags).toEqual(["vegetarian", "quick", "easy", "healthy"]);
    });
  });

  describe("formatRecipeForAIContext", () => {
    it("should format complete recipe data", () => {
      const formData: Partial<RecipeFormData> = {
        title: "Test Recipe",
        description: "A test recipe",
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        ingredients: [
          {
            name: "Flour",
            amount: "2",
            unit: "cups",
            notes: "",
            groupName: "",
            isOptional: false,
          },
          {
            name: "Sugar",
            amount: "1",
            unit: "cup",
            notes: "",
            groupName: "",
            isOptional: false,
          },
        ],
        instructions: [
          {
            instruction: "Mix dry ingredients",
            timeMinutes: undefined,
            temperature: "",
            notes: "",
            groupName: "",
          },
          {
            instruction: "Add wet ingredients",
            timeMinutes: undefined,
            temperature: "",
            notes: "",
            groupName: "",
          },
        ],
        tags: ["vegetarian", "quick"],
      };

      const result = formatRecipeForAIContext(formData);

      expect(result).toContain("Title: Test Recipe");
      expect(result).toContain("Description: A test recipe");
      expect(result).toContain("Servings: 4");
      expect(result).toContain("Prep Time: 15 minutes");
      expect(result).toContain("Cook Time: 30 minutes");
      expect(result).toContain("1. 2 cups Flour");
      expect(result).toContain("2. 1 cup Sugar");
      expect(result).toContain("1. Mix dry ingredients");
      expect(result).toContain("2. Add wet ingredients");
      expect(result).toContain("Tags: vegetarian, quick");
    });

    it("should handle missing data gracefully", () => {
      const formData: Partial<RecipeFormData> = {
        title: "Minimal Recipe",
      };

      const result = formatRecipeForAIContext(formData);

      expect(result).toBe("Title: Minimal Recipe");
    });

    it("should handle ingredients without amounts", () => {
      const formData: Partial<RecipeFormData> = {
        ingredients: [
          {
            name: "Salt",
            amount: undefined,
            unit: "",
            notes: "",
            groupName: "",
            isOptional: false,
          },
        ],
      };

      const result = formatRecipeForAIContext(formData);

      expect(result).toContain("1. Salt");
    });
  });
});
