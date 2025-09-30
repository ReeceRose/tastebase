import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getProviderRequirements, validateConfig } from "@/lib/ai/config";
import { parseRecipeText } from "@/lib/ai/recipe-parsing";
import {
  AIProvider,
  type AIProviderConfig,
  type RecipeParsingResult,
} from "@/lib/types";
import { mapParsedRecipeToFormData } from "@/lib/utils/ai-recipe-integration";

// Mock the AI service to avoid making real API calls
vi.mock("@/lib/ai/service", () => ({
  processTask: vi.fn(),
}));

describe("AI Integration Tests", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;
  const testSecret = "test-secret-key-that-is-at-least-32-characters-long";

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.BETTER_AUTH_SECRET = originalSecret;
  });

  describe("Recipe Parsing Workflow", () => {
    it("should handle complete recipe parsing workflow", async () => {
      // Mock AI service response
      const { processTask } = await import("@/lib/ai/service");
      const mockParseResult: RecipeParsingResult = {
        title: "Chocolate Chip Cookies",
        description: "Classic homemade chocolate chip cookies",
        servings: 24,
        prepTime: 15,
        cookTime: 12,
        difficulty: "easy",
        cuisine: "American",
        ingredients: [
          { name: "All-purpose flour", quantity: "2.25", unit: "cups" },
          { name: "Baking soda", quantity: "1", unit: "teaspoon" },
          { name: "Salt", quantity: "1", unit: "teaspoon" },
          { name: "Butter", quantity: "1", unit: "cup" },
          { name: "Granulated sugar", quantity: "0.75", unit: "cup" },
          { name: "Brown sugar", quantity: "0.75", unit: "cup" },
          { name: "Vanilla extract", quantity: "1", unit: "teaspoon" },
          { name: "Large eggs", quantity: "2", unit: "" },
          { name: "Chocolate chips", quantity: "2", unit: "cups" },
        ],
        instructions: [
          { step: 1, instruction: "Preheat oven to 375°F (190°C)." },
          {
            step: 2,
            instruction:
              "In a medium bowl, whisk together flour, baking soda, and salt.",
          },
          {
            step: 3,
            instruction:
              "In a large bowl, cream together butter and both sugars until light and fluffy.",
          },
          {
            step: 4,
            instruction: "Beat in eggs one at a time, then stir in vanilla.",
          },
          { step: 5, instruction: "Gradually blend in flour mixture." },
          { step: 6, instruction: "Stir in chocolate chips." },
          {
            step: 7,
            instruction:
              "Drop rounded tablespoons of dough onto ungreased cookie sheets.",
          },
          {
            step: 8,
            instruction: "Bake for 9-11 minutes or until golden brown.",
          },
          {
            step: 9,
            instruction:
              "Cool on baking sheet for 2 minutes; remove to wire rack.",
          },
        ],
        tags: ["dessert", "cookies", "chocolate", "baking"],
      };

      vi.mocked(processTask).mockResolvedValue({
        success: true,
        data: mockParseResult,
        usage: {
          inputTokens: 150,
          outputTokens: 300,
          totalTokens: 450,
        },
        responseTime: 1200,
      });

      // Test configuration
      const config: AIProviderConfig = {
        provider: AIProvider.OLLAMA,
        modelName: "llama3.2",
        ollamaHost: "http://localhost:11434",
        maxTokens: 4000,
        temperature: 0.3,
        enabledTasks: "recipe-parsing",
        isActive: true,
      };

      // Test recipe parsing
      const recipeText = `
        Chocolate Chip Cookies
        
        Ingredients:
        - 2 1/4 cups all-purpose flour
        - 1 teaspoon baking soda
        - 1 teaspoon salt
        - 1 cup butter, softened
        - 3/4 cup granulated sugar
        - 3/4 cup packed brown sugar
        - 1 teaspoon vanilla extract
        - 2 large eggs
        - 2 cups chocolate chips
        
        Instructions:
        1. Preheat oven to 375°F.
        2. Mix dry ingredients in a bowl.
        3. Cream butter and sugars.
        4. Add eggs and vanilla.
        5. Combine wet and dry ingredients.
        6. Stir in chocolate chips.
        7. Drop dough onto baking sheets.
        8. Bake 9-11 minutes until golden.
        9. Cool before serving.
      `;

      const parseResult = await parseRecipeText(
        "test-user-id",
        recipeText,
        config,
      );

      // Verify parsing succeeded
      expect(parseResult.success).toBe(true);
      expect(parseResult.data).toBeDefined();
      expect(parseResult.data?.title).toBe("Chocolate Chip Cookies");
      expect(parseResult.data?.ingredients).toHaveLength(9);
      expect(parseResult.data?.instructions).toHaveLength(9);

      // Test form data mapping
      if (parseResult.data) {
        const formData = mapParsedRecipeToFormData(parseResult.data);

        expect(formData.title).toBe("Chocolate Chip Cookies");
        expect(formData.description).toBe(
          "Classic homemade chocolate chip cookies",
        );
        expect(formData.servings).toBe(24);
        expect(formData.prepTimeMinutes).toBe(15);
        expect(formData.cookTimeMinutes).toBe(12);
        expect(formData.difficulty).toBe("easy");
        expect(formData.cuisine).toBe("American");

        expect(formData.ingredients).toHaveLength(9);
        expect(formData.ingredients?.[0]).toMatchObject({
          name: "All-purpose flour",
          amount: 2.25,
          unit: "cups",
        });

        expect(formData.instructions).toHaveLength(9);
        expect(formData.instructions?.[0]).toMatchObject({
          instruction: "Preheat oven to 375°F (190°C).",
          sortOrder: 1,
        });

        expect(formData.tags).toEqual([
          "dessert",
          "cookies",
          "chocolate",
          "baking",
        ]);
      }

      // Verify the AI service was called correctly
      expect(processTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskType: "recipe-parsing",
          userId: "test-user-id",
          input: recipeText.trim(),
        }),
        config,
      );
    });

    it("should handle parsing errors gracefully", async () => {
      const { processTask } = await import("@/lib/ai/service");

      vi.mocked(processTask).mockResolvedValue({
        success: false,
        error: "AI service unavailable",
        responseTime: 500,
      });

      const config: AIProviderConfig = {
        provider: AIProvider.OPENAI,
        apiKey: "sk-test-key",
        modelName: "gpt-4o-mini",
        maxTokens: 4000,
        temperature: 0.3,
        enabledTasks: "recipe-parsing",
        isActive: true,
      };

      const parseResult = await parseRecipeText(
        "test-user-id",
        "Invalid recipe text",
        config,
      );

      expect(parseResult.success).toBe(false);
      expect(parseResult.error).toBe("AI service unavailable");
      expect(parseResult.data).toBeUndefined();
    });
  });

  describe("Configuration Validation", () => {
    it("should validate configurations correctly", () => {
      // Test valid configurations
      const validConfigs = [
        {
          provider: AIProvider.OLLAMA,
          ollamaHost: "http://localhost:11434",
          maxTokens: 4000,
          temperature: 0.7,
        },
        {
          provider: AIProvider.OPENAI,
          apiKey: "sk-test-key",
          maxTokens: 2000,
          temperature: 0.5,
        },
        {
          provider: AIProvider.NONE,
        },
      ];

      validConfigs.forEach((config) => {
        const result = validateConfig(config);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Test invalid configurations
      const invalidConfigs = [
        {
          provider: AIProvider.OPENAI,
          // Missing API key
        },
        {
          provider: AIProvider.OLLAMA,
          ollamaHost: "invalid-url",
        },
        {
          provider: AIProvider.ANTHROPIC,
          apiKey: "valid-key",
          maxTokens: 50, // Too low
        },
        {
          provider: AIProvider.GOOGLE,
          apiKey: "valid-key",
          temperature: 3, // Too high
        },
      ];

      invalidConfigs.forEach((config) => {
        const result = validateConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Provider Requirements", () => {
    it("should return correct requirements for all providers", () => {
      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
        AIProvider.OLLAMA,
        AIProvider.NONE,
      ] as const;

      providers.forEach((provider) => {
        const requirements = getProviderRequirements(provider);

        expect(requirements).toHaveProperty("requiresApiKey");
        expect(requirements).toHaveProperty("requiresOllamaHost");
        expect(requirements).toHaveProperty("defaultModel");
        expect(requirements).toHaveProperty("supportedTasks");

        if (provider === AIProvider.NONE) {
          expect(requirements.supportedTasks).toHaveLength(0);
        } else {
          expect(requirements.supportedTasks.length).toBeGreaterThan(0);
          expect(requirements.supportedTasks).toContain("recipe-parsing");
        }
      });
    });
  });
});
