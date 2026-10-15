import { generateText, Output } from "ai";
import { z } from "zod";
import { getProvider } from "@/lib/ai/providers";
import { createOperationLogger } from "@/lib/logging/logger";
import { RecipeDifficulty } from "@/lib/types";
import type { AIProviderConfig, AIUsage } from "@/lib/types/ai-types";
import type { RecipeParsingResult } from "@/lib/types/import-types";

const logger = createOperationLogger("ai-recipe-cleanup");

const MAX_INPUT_CHARS = 60000;
const MAX_OUTPUT_TOKENS = 8192;
const REQUEST_TIMEOUT_MS = 120000;

const recipeOutputSchema = z.object({
  title: z.string().nullable().describe("Recipe title"),
  description: z
    .string()
    .nullable()
    .describe(
      "One or two sentences describing the dish, if the source has one",
    ),
  servings: z.number().int().nullable(),
  prepTimeMinutes: z.number().int().nullable(),
  cookTimeMinutes: z.number().int().nullable(),
  ingredients: z.array(
    z.object({
      name: z
        .string()
        .describe(
          "Ingredient name plus any preparation notes, e.g. 'onion, diced'",
        ),
      quantity: z
        .string()
        .nullable()
        .describe("Amount exactly as written, e.g. '1 1/2' or '2-3'"),
      unit: z
        .string()
        .nullable()
        .describe("Unit exactly as written, e.g. 'cups'"),
    }),
  ),
  instructions: z.array(
    z.object({
      instruction: z.string().describe("Step text, copied from the source"),
      timeMinutes: z
        .number()
        .int()
        .nullable()
        .describe(
          "Minutes mentioned in the step; use the higher end of a range",
        ),
      temperature: z
        .string()
        .nullable()
        .describe(
          "Temperature or heat level mentioned in the step, e.g. '350°F'",
        ),
    }),
  ),
  tags: z.array(z.string()),
  difficulty: z
    .enum([
      RecipeDifficulty.EASY,
      RecipeDifficulty.MEDIUM,
      RecipeDifficulty.HARD,
    ])
    .nullable(),
  cuisine: z.string().nullable(),
});

type RecipeOutput = z.infer<typeof recipeOutputSchema>;

const INSTRUCTIONS = `You extract recipes into structured data for a recipe manager.
- Copy ingredients and steps faithfully. Do not invent, summarise or reorder content.
- Keep quantities and units as written; do not convert units.
- Ignore anything that isn't part of the recipe (ads, stories, comments, navigation).
- Use null when the source doesn't state a value. Only add tags or difficulty when they're clear from the source.
- If there is no recipe in the input, return a null title and empty ingredient and instruction lists.`;

export interface RecipeCleanupResult {
  recipe: RecipeParsingResult;
  usage: AIUsage;
}

function toParsingResult(output: RecipeOutput): RecipeParsingResult {
  return {
    title: output.title?.trim() || null,
    description: output.description?.trim() || null,
    servings: output.servings && output.servings > 0 ? output.servings : null,
    prepTime:
      output.prepTimeMinutes && output.prepTimeMinutes > 0
        ? output.prepTimeMinutes
        : null,
    cookTime:
      output.cookTimeMinutes && output.cookTimeMinutes > 0
        ? output.cookTimeMinutes
        : null,
    ingredients: output.ingredients
      .filter((ingredient) => ingredient.name.trim().length > 0)
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity?.trim() || null,
        unit: ingredient.unit?.trim() || null,
      })),
    instructions: output.instructions
      .filter((step) => step.instruction.trim().length > 0)
      .map((step, index) => ({
        step: index + 1,
        instruction: step.instruction.trim(),
        timeMinutes:
          step.timeMinutes && step.timeMinutes > 0 ? step.timeMinutes : null,
        temperature: step.temperature?.trim() || null,
      })),
    tags: output.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length <= 30)
      .slice(0, 20),
    difficulty: output.difficulty,
    cuisine: output.cuisine?.trim() || null,
  };
}

function toUsage(usage: {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number | undefined;
}): AIUsage {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export async function cleanupRecipeText(
  text: string,
  config: AIProviderConfig,
): Promise<RecipeCleanupResult> {
  const { output, usage } = await generateText({
    model: getProvider(config),
    instructions: INSTRUCTIONS,
    prompt: `Extract the recipe from this text:\n\n${text.slice(0, MAX_INPUT_CHARS)}`,
    output: Output.object({ schema: recipeOutputSchema }),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    timeout: REQUEST_TIMEOUT_MS,
  });

  logger.info(
    { provider: config.provider, model: config.modelName, usage },
    "AI recipe cleanup completed",
  );

  return { recipe: toParsingResult(output), usage: toUsage(usage) };
}

export async function extractRecipeFromImage(
  image: Uint8Array,
  mediaType: string,
  config: AIProviderConfig,
): Promise<RecipeCleanupResult> {
  const { output, usage } = await generateText({
    model: getProvider(config),
    instructions: INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the recipe from this image." },
          { type: "file", mediaType, data: image },
        ],
      },
    ],
    output: Output.object({ schema: recipeOutputSchema }),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    timeout: REQUEST_TIMEOUT_MS,
  });

  logger.info(
    { provider: config.provider, model: config.modelName, usage },
    "AI recipe image extraction completed",
  );

  return { recipe: toParsingResult(output), usage: toUsage(usage) };
}
