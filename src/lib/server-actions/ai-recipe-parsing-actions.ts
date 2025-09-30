"use server";

import { headers } from "next/headers";
import { parseRecipeText } from "@/lib/ai/recipe-parsing";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { getActiveAIConfigAction } from "@/lib/server-actions/ai-config-actions";
import type { RecipeParsingResult } from "@/lib/types";

const logger = createOperationLogger("ai-recipe-parsing-actions");

export interface ParseRecipeActionResult {
  success: boolean;
  data?: RecipeParsingResult;
  error?: string;
}

export async function parseRecipeTextAction(
  input: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<ParseRecipeActionResult> {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    logger.info(
      {
        userId: session.user.id,
        inputLength: input.length,
      },
      "Processing recipe text with AI",
    );

    // Get user's AI configuration
    const configResult = await getActiveAIConfigAction(session.user.id);

    if (!configResult.success || !configResult.data) {
      return {
        success: false,
        error: "No AI provider configured. Please set up AI in your settings.",
      };
    }

    // Prepare user preferences for AI parsing
    const userPreferences = {
      temperatureUnit: session.user.preferredTemperatureUnit || "°F",
      measurementSystem:
        session.user.preferredWeightUnit === "metric" ||
        session.user.preferredVolumeUnit === "metric"
          ? "metric"
          : "imperial",
    };

    logger.info(
      {
        userId: session.user.id,
        userPreferences,
      },
      "Using user preferences for recipe parsing",
    );

    // Parse the recipe text
    const result = await parseRecipeText(
      session.user.id,
      input,
      configResult.data,
      options,
      userPreferences,
    );

    if (result.success && result.data) {
      logger.info(
        {
          userId: session.user.id,
          success: true,
          responseTime: result.responseTime,
          instructionCount: result.data.instructions?.length || 0,
          instructionsWithTiming:
            result.data.instructions?.filter((inst) => inst.timeMinutes)
              .length || 0,
          instructionsWithTemp:
            result.data.instructions?.filter((inst) => inst.temperature)
              .length || 0,
        },
        "Recipe text parsing completed successfully",
      );

      return {
        success: true,
        data: result.data,
      };
    } else {
      logger.warn(
        {
          userId: session.user.id,
          error: result.error,
        },
        "Recipe text parsing failed",
      );

      return {
        success: false,
        error: result.error || "Failed to parse recipe text",
      };
    }
  } catch (error) {
    logError(logger, "Failed to parse recipe text", error, {
      inputLength: input?.length,
    });

    return {
      success: false,
      error: "Failed to parse recipe. Please try again.",
    };
  }
}
