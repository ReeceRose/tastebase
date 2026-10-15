import { MockLanguageModelV4 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProviderMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/providers", () => ({ getProvider: getProviderMock }));

import {
  cleanupRecipeText,
  extractRecipeFromImage,
} from "@/lib/ai/recipe-cleanup";
import {
  AIProvider,
  type AIProviderConfig,
  ImageProcessingMethod,
} from "@/lib/types/ai-types";

const CONFIG: AIProviderConfig = {
  provider: AIProvider.ANTHROPIC,
  apiKey: "test-key",
  modelName: "claude-haiku-5-5",
  ollamaHost: null,
  imageProcessingMethod: ImageProcessingMethod.AUTO,
};

function mockModel(output: object) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: {
          total: 100,
          noCache: 100,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: { total: 50, text: 50, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

const VALID_OUTPUT = {
  title: "  Lemon Pasta ",
  description: null,
  servings: 0,
  prepTimeMinutes: 10,
  cookTimeMinutes: 12,
  ingredients: [
    { name: "spaghetti", quantity: "200", unit: "g" },
    { name: " ", quantity: null, unit: null },
  ],
  instructions: [
    { instruction: "Boil the pasta.", timeMinutes: 12, temperature: null },
    { instruction: "Toss with lemon.", timeMinutes: null, temperature: null },
  ],
  tags: ["Pasta", "  ", "a-tag-that-is-much-too-long-to-keep-around"],
  difficulty: "easy",
  cuisine: "Italian",
};

beforeEach(() => {
  getProviderMock.mockReset();
});

describe("cleanupRecipeText", () => {
  it("returns a normalised recipe from structured output", async () => {
    getProviderMock.mockReturnValue(mockModel(VALID_OUTPUT));

    const { recipe, usage } = await cleanupRecipeText(
      "some recipe text",
      CONFIG,
    );

    expect(recipe.title).toBe("Lemon Pasta");
    expect(recipe.servings).toBeNull();
    expect(recipe.prepTime).toBe(10);
    expect(recipe.ingredients).toEqual([
      { name: "spaghetti", quantity: "200", unit: "g" },
    ]);
    expect(recipe.instructions.map((step) => step.step)).toEqual([1, 2]);
    expect(recipe.tags).toEqual(["pasta"]);
    expect(recipe.difficulty).toBe("easy");
    expect(usage.totalTokens).toBe(150);
  });

  it("rejects output that doesn't match the schema", async () => {
    getProviderMock.mockReturnValue(
      mockModel({ ...VALID_OUTPUT, ingredients: "two eggs" }),
    );

    await expect(cleanupRecipeText("text", CONFIG)).rejects.toThrow();
  });
});

describe("extractRecipeFromImage", () => {
  it("sends the image to the model and returns the recipe", async () => {
    const model = mockModel(VALID_OUTPUT);
    getProviderMock.mockReturnValue(model);

    const { recipe } = await extractRecipeFromImage(
      new Uint8Array([1, 2, 3]),
      "image/png",
      CONFIG,
    );

    expect(recipe.title).toBe("Lemon Pasta");
    const prompt = model.doGenerateCalls[0].prompt;
    const userMessage = prompt.find((message) => message.role === "user");
    expect(JSON.stringify(userMessage)).toContain("image/png");
  });
});
