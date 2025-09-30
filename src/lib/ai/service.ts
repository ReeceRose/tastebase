import { generateText, type LanguageModel } from "ai";
import { getProvider } from "@/lib/ai/providers";
import { hasToolsForTask } from "@/lib/ai/tools";
import { fetchRecipeTool } from "@/lib/ai/tools/fetch-recipe-tool";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type {
  AIProviderConfig,
  AIResponse,
  AITaskRequest,
  FetchRecipeResult,
  RecipeParsingResult,
} from "@/lib/types/ai-types";
import { RECIPE_PARSING_SCHEMA } from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("ai-service");

export async function processTask(
  request: AITaskRequest,
  config: AIProviderConfig,
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    logger.info(
      {
        taskType: request.taskType,
        provider: config.provider,
        userId: request.userId,
      },
      "Processing AI task",
    );

    const provider = getProvider(config);

    switch (request.taskType) {
      case "recipe-parsing":
        return await parseRecipe(request, provider, startTime, userPreferences);
      case "chat-conversation":
        return await handleConversation(request, provider, startTime);
      case "recipe-discovery":
        return await discoverRecipes(request, provider, startTime);
      case "cooking-assistance":
        return await provideCookingAssistance(request, provider, startTime);
      default:
        throw new Error(`Unsupported task type: ${request.taskType}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logError(logger, "AI task processing failed", error as Error, {
      taskType: request.taskType,
      provider: config.provider,
      userId: request.userId,
      responseTime,
    });

    return {
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

async function parseRecipe(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  try {
    // Check if this looks like a URL and we have tools available
    const isUrl = isValidUrl(request.input.trim());
    const hasTools = hasToolsForTask(request.taskType);

    if (isUrl && hasTools) {
      return await parseRecipeWithTools(
        request,
        provider,
        startTime,
        userPreferences,
      );
    } else {
      return await parseRecipeText(
        request,
        provider,
        startTime,
        userPreferences,
      );
    }
  } catch (error) {
    const _responseTime = Date.now() - startTime;
    throw new Error(
      `Recipe parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function parseRecipeWithTools(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  logger.info(
    {
      taskType: request.taskType,
      userId: request.userId,
      input: request.input.trim(),
    },
    "Detected URL input, using fetch tool with JSON-LD extraction",
  );

  try {
    // Use fetch tool directly for URL parsing with JSON-LD support
    const fetchResult: FetchRecipeResult = await fetchRecipeTool.execute({
      url: request.input.trim(),
    });

    // If JSON-LD extraction was successful, return the recipe directly
    if (fetchResult.method === "json-ld" && fetchResult.recipe) {
      logger.info(
        {
          method: "json-ld",
          confidence: fetchResult.confidence,
        },
        "Successfully parsed recipe via JSON-LD",
      );

      const responseTime = Date.now() - startTime;
      return {
        success: true,
        data: fetchResult.recipe,
        responseTime,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }

    // For other extraction methods, use AI to parse the content
    if (fetchResult.content) {
      logger.info(
        {
          method: fetchResult.method,
          confidence: fetchResult.confidence,
        },
        "Using AI to parse extracted content",
      );

      const contentRequest = {
        ...request,
        input: fetchResult.content,
      };

      return await parseRecipeText(
        contentRequest,
        provider,
        startTime,
        userPreferences,
      );
    }

    // Fallback to direct text parsing if no content extracted
    logger.info(
      "No content extracted from fetch tool, falling back to direct text parsing",
    );
    return await parseRecipeText(request, provider, startTime, userPreferences);
  } catch (error) {
    logger.error(
      { error },
      "Error in tool-based parsing, falling back to text parsing",
    );
    return await parseRecipeText(request, provider, startTime, userPreferences);
  }
}

async function parseRecipeText(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  // Log provider details for debugging
  const modelName = provider.toString();
  const providerInfo = {
    toString: provider.toString(),
  };

  logger.info(
    {
      taskType: request.taskType,
      userId: request.userId,
      providerInfo,
      modelName,
      inputLength: request.input.length,
    },
    "Starting text-based parsing with optimized prompt",
  );

  // Use text-based parsing for all content
  logger.info(
    {
      taskType: request.taskType,
      userId: request.userId,
      model: modelName,
    },
    "Using text-based parsing for recipe content",
  );

  return await parseRecipeTextFallback(
    request,
    provider,
    startTime,
    userPreferences,
  );
}

async function parseRecipeTextFallback(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  logger.info(
    {
      taskType: request.taskType,
      userId: request.userId,
    },
    "Starting text-based recipe parsing fallback",
  );
  // Build user preference instructions
  const preferenceInstructions = userPreferences
    ? `
USER PREFERENCES (apply these to the recipe):
- Temperature unit: ${userPreferences.temperatureUnit || "°F"}
- Measurement system: ${userPreferences.measurementSystem || "imperial"}
${
  userPreferences.measurementSystem === "metric"
    ? "- Use metric units: grams (g), kilograms (kg), milliliters (ml), liters (l), Celsius (°C)"
    : "- Use imperial units: ounces (oz), pounds (lb), cups, tablespoons (tbsp), teaspoons (tsp), Fahrenheit (°F)"
}
`
    : "";

  const prompt = `Parse the following recipe text and extract ALL available information. Return complete, detailed information in JSON format.

CRITICAL: Extract ALL steps, ingredients, and details EXACTLY as written in the source. Do not truncate, summarize, or rewrite the recipe content. Be consistent and deterministic - extract the same information every time for the same input.
${preferenceInstructions}
JSON Structure (extract ALL available data):
{
  "title": "Full recipe title (concise but complete)",
  "description": "Complete description of the dish and cooking method",
  "servings": number_of_servings,
  "prepTime": prep_time_in_minutes,
  "cookTime": cook_time_in_minutes,
  "ingredients": [
    {
      "name": "complete ingredient name",
      "quantity": "exact amount in user's preferred units",
      "unit": "measurement unit in user's preferred system"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Complete detailed instruction text",
      "timeMinutes": 15,
      "temperature": "${userPreferences?.temperatureUnit === "°C" ? "230°C" : "450°F"}"
    },
    {
      "step": 2,
      "instruction": "Next complete instruction with all details",
      "timeMinutes": 30,
      "temperature": null
    }
  ],
  "tags": ["relevant", "cooking", "tags"],
  "difficulty": "easy|medium|hard",
  "cuisine": "cuisine type"
}

Recipe source:
${request.input}

REQUIREMENTS:
- Extract ALL instruction steps (do not stop at 2-3 steps)
- Include ALL ingredients with complete quantities and units in user's preferred measurement system
- For each instruction step, extract:
  * Complete instruction text (copy the EXACT wording from the source - do not paraphrase, summarize, or rewrite)
  * Time in minutes as number in "timeMinutes" field: Extract timing EXACTLY as written in the source recipe. Look for phrases like "10 minutes", "about 30 minutes", "for 5 minutes", "cook until 20 minutes" and extract ONLY the number. For time ranges like "5-7 minutes" or "30 to 40 minutes", ALWAYS use the HIGHER value to ensure food is properly cooked. DO NOT modify or reinterpret the original timing - extract what is actually written
  * Temperature as string in "temperature" field: Look for temperatures like "350°F", "180°C", "medium heat", "high heat" and extract the temperature value in user's preferred unit (${userPreferences?.temperatureUnit || "°F"})

TIMING EXTRACTION EXAMPLES:
- "cook for 10 minutes" → timeMinutes: 10
- "about 30 minutes" → timeMinutes: 30
- "simmer 5-7 minutes" → timeMinutes: 7 (use HIGHER value in ranges)
- "bake until golden, 20-25 minutes" → timeMinutes: 25 (use HIGHER value in ranges)
- "30 to 40 minutes" → timeMinutes: 40 (use HIGHER value in ranges)
- "let rest for at least 5 minutes" → timeMinutes: 5

TEMPERATURE EXTRACTION EXAMPLES:
- "preheat oven to 350°F" → temperature: "350°F"
- "heat to 180°C" → temperature: "180°C"
- "cook over medium heat" → temperature: "medium heat"
- "high heat" → temperature: "high heat"

- Convert ALL measurements to user's preferred system: ${userPreferences?.measurementSystem || "imperial"}
- Convert ALL temperatures to user's preferred unit: ${userPreferences?.temperatureUnit || "°F"}
- If URL provided, fetch and parse the complete recipe content
- Return only valid JSON with complete information`;

  const { generateText } = await import("ai");
  const result = await generateText({
    model: provider,
    prompt,
    temperature: request.options?.temperature ?? 0.1, // Lower temperature for more consistent results
    // maxTokens: request.options?.maxTokens ?? 8000, // Property doesn't exist in current AI SDK version
  });

  const responseTime = Date.now() - startTime;

  try {
    // Try to parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Clean up null values in ingredients
    if (parsedData.ingredients) {
      parsedData.ingredients = parsedData.ingredients.map(
        (ingredient: {
          name: string;
          quantity?: string | null;
          unit?: string | null;
        }) => ({
          ...ingredient,
          quantity:
            ingredient.quantity === null ? undefined : ingredient.quantity,
          unit: ingredient.unit === null ? undefined : ingredient.unit,
        }),
      );
    }

    // Log the raw AI output for debugging
    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        rawText: result.text.slice(0, 1000), // First 1000 chars of AI response
      },
      "Raw AI output",
    );

    // Log the parsed data before validation for debugging
    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        instructionCount: parsedData.instructions?.length || 0,
        allInstructionTiming:
          parsedData.instructions?.map(
            (
              inst: {
                timeMinutes?: number;
                temperature?: string;
                instruction?: string;
              },
              i: number,
            ) => ({
              step: i + 1,
              hasTimeMinutes: "timeMinutes" in inst,
              timeMinutes: inst.timeMinutes,
              hasTemperature: "temperature" in inst,
              temperature: inst.temperature,
              instructionText: `${inst.instruction?.slice(0, 100)}...`, // First 100 chars
            }),
          ) || [],
      },
      "AI parsed data before validation",
    );

    const validatedData = RECIPE_PARSING_SCHEMA.parse(parsedData);

    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        responseTime,
        usage: result.usage,
      },
      "Recipe text parsing fallback completed",
    );

    return {
      success: true,
      data: validatedData,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
      responseTime,
    };
  } catch (parseError) {
    // If JSON parsing fails, return a minimal recipe structure
    logger.warn(
      {
        taskType: request.taskType,
        userId: request.userId,
        parseError:
          parseError instanceof Error ? parseError.message : String(parseError),
      },
      "JSON parsing failed, returning minimal structure",
    );

    // Try to extract any useful information from the raw text
    const textContent = result.text
      .replace(/```json|```|\{[\s\S]*\}/g, "")
      .trim();
    const description =
      textContent.length > 10
        ? `${textContent.slice(0, 200)}...`
        : "Recipe information could not be parsed properly.";

    return {
      success: true,
      data: {
        title: "Untitled Recipe",
        description,
      },
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
      responseTime,
    };
  }
}

function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function handleConversation(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
): Promise<AIResponse<string>> {
  try {
    const systemPrompt = `You are a helpful recipe assistant. You help users with:
- Finding recipes based on ingredients they have
- Answering cooking questions
- Providing cooking tips and techniques
- Helping with recipe modifications
- Suggesting ingredient substitutions

Be concise but helpful. Focus on practical cooking advice.`;

    const result = await generateText({
      model: provider,
      system: systemPrompt,
      prompt: request.input,
      temperature: request.options?.temperature ?? 0.7,
    });

    const responseTime = Date.now() - startTime;

    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        responseTime,
        usage: result.usage,
      },
      "Conversation response generated",
    );

    return {
      success: true,
      data: result.text,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
      responseTime,
    };
  } catch (error) {
    throw new Error(
      `Conversation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function discoverRecipes(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
): Promise<AIResponse<string>> {
  try {
    const systemPrompt = `You are a recipe discovery assistant. When users tell you what ingredients they have, suggest recipes they can make. 

Provide:
- Recipe names
- Brief descriptions
- Why the recipe fits their ingredients
- Any additional ingredients they might need

Keep suggestions practical and achievable.`;

    const result = await generateText({
      model: provider,
      system: systemPrompt,
      prompt: request.input,
      temperature: request.options?.temperature ?? 0.8,
    });

    const responseTime = Date.now() - startTime;

    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        responseTime,
        usage: result.usage,
      },
      "Recipe discovery completed",
    );

    return {
      success: true,
      data: result.text,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
      responseTime,
    };
  } catch (error) {
    throw new Error(
      `Recipe discovery failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function provideCookingAssistance(
  request: AITaskRequest,
  provider: LanguageModel,
  startTime: number,
): Promise<AIResponse<string>> {
  try {
    const systemPrompt = `You are a cooking assistant helping users while they cook. Provide:
- Step-by-step guidance
- Troubleshooting for cooking problems
- Timing and temperature advice
- Ingredient substitution suggestions
- Food safety tips

Be practical and assume the user is actively cooking.`;

    const result = await generateText({
      model: provider,
      system: systemPrompt,
      prompt: request.input,
      temperature: request.options?.temperature ?? 0.5,
    });

    const responseTime = Date.now() - startTime;

    logger.info(
      {
        taskType: request.taskType,
        userId: request.userId,
        responseTime,
        usage: result.usage,
      },
      "Cooking assistance provided",
    );

    return {
      success: true,
      data: result.text,
      usage: result.usage
        ? {
            inputTokens: result.usage.inputTokens ?? 0,
            outputTokens: result.usage.outputTokens ?? 0,
            totalTokens: result.usage.totalTokens ?? 0,
          }
        : undefined,
      responseTime,
    };
  } catch (error) {
    throw new Error(
      `Cooking assistance failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
