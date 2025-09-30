"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipeImages } from "@/db/schema.recipes";
import type { ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";
import {
  generateRecipeImage,
  validateImageGenerationConfig,
  validateRecipeData,
} from "@/lib/ai/services/image-generation-service";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { getUserAIConfig } from "@/lib/server-actions/ai-config-actions";

const logger = createOperationLogger("recipe-image-generation");

export interface GeneratedImage {
  id: string;
  url: string;
  filename: string;
  isAIGenerated: boolean;
  metadata: unknown;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function generateRecipeImageAction(
  recipeId: string,
  recipeData: ImageGenerationPromptData,
  providerId?: string,
): Promise<ActionResult<GeneratedImage>> {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      {
        userId: session.user.id,
        recipeId,
        providerId,
        recipeTitle: recipeData.title,
      },
      "Starting recipe image generation",
    );

    // Validate recipe data
    const recipeValidationErrors = validateRecipeData(recipeData);
    if (recipeValidationErrors.length > 0) {
      logger.warn(
        {
          userId: session.user.id,
          recipeId,
          validationErrors: recipeValidationErrors,
        },
        "Recipe data validation failed",
      );
      return { success: false, error: recipeValidationErrors[0] };
    }

    // Get ALL user AI configurations (same logic as provider listing)
    const allConfigsResult = await getUserAIConfig(session.user.id);
    if (!allConfigsResult.success || !allConfigsResult.data) {
      return { success: false, error: "AI configuration not found" };
    }

    const allConfigs = allConfigsResult.data.configurations || [];
    let userConfig = null;

    // Find the config for the requested provider, or use active config
    if (providerId) {
      userConfig = allConfigs.find(
        (config) => config.provider === providerId && config.apiKey,
      );
    } else {
      userConfig = allConfigsResult.data.activeConfiguration;
    }

    if (!userConfig || !userConfig.apiKey) {
      return {
        success: false,
        error: "No valid AI configuration found for image generation",
      };
    }

    // Validate AI configuration
    const configValidationErrors = validateImageGenerationConfig(userConfig);
    if (configValidationErrors.length > 0) {
      logger.warn(
        {
          userId: session.user.id,
          recipeId,
          configValidationErrors,
        },
        "AI configuration validation failed",
      );
      return { success: false, error: configValidationErrors[0] };
    }

    // Validate that provider supports image generation
    if (userConfig.provider !== "google" && userConfig.provider !== "openai") {
      return {
        success: false,
        error: `Provider "${userConfig.provider}" does not support image generation. Please use Google or OpenAI.`,
      };
    }

    // Generate image
    const result = await generateRecipeImage(recipeData, userConfig);

    if (!result.success) {
      logger.error(
        {
          userId: session.user.id,
          recipeId,
          error: result.error,
        },
        "Image generation failed",
      );
      return {
        success: false,
        error: result.error || "Image generation failed",
      };
    }

    // Save image to filesystem
    const filename = `recipe-ai-${nanoid()}.png`;
    const uploadsDir = join(process.cwd(), "uploads", "recipe-images");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, filename);
    if (!result.imageData) {
      throw new Error("Generated image data is missing");
    }
    const imageBuffer = Buffer.from(result.imageData, "base64");
    await writeFile(filePath, imageBuffer);

    // Save to database
    const [savedImage] = await db
      .insert(recipeImages)
      .values({
        id: nanoid(),
        recipeId,
        filename,
        originalName: `${recipeData.title} - AI Generated`,
        mimeType: "image/png",
        fileSize: imageBuffer.length,
        sortOrder: 0,
        metadata: {
          source: "ai-generated",
          ...result.metadata,
        },
      })
      .returning();

    logger.info(
      {
        userId: session.user.id,
        recipeId,
        imageId: savedImage.id,
        provider: result.metadata.provider,
        fileSize: imageBuffer.length,
      },
      "Successfully generated and saved recipe image",
    );

    return {
      success: true,
      data: {
        id: savedImage.id,
        url: `/api/recipes/images/${filename}`,
        filename: savedImage.filename,
        isAIGenerated: true,
        metadata: savedImage.metadata,
      },
    };
  } catch (error) {
    logError(logger, "Recipe image generation error", error as Error, {
      recipeId,
      providerId,
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}

export async function getAvailableImageGenerationProvidersAction(): Promise<
  ActionResult<{
    providers: Array<{ id: string; name: string; model: string }>;
  }>
> {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Get ALL user AI configurations (not just active one)
    const allConfigsResult = await getUserAIConfig(session.user.id);
    if (!allConfigsResult.success || !allConfigsResult.data) {
      return { success: false, error: "AI configuration not found" };
    }

    const allConfigs = allConfigsResult.data.configurations || [];
    const providers = [];

    // Check all configured providers for image generation capability
    for (const config of allConfigs) {
      if (config.apiKey) {
        // Has valid decrypted API key
        if (config.provider === "google") {
          providers.push({
            id: "google",
            name: "Gemini Flash Image",
            model: "gemini-2.5-flash-image-preview",
          });
        }
        if (config.provider === "openai") {
          providers.push({
            id: "openai",
            name: "DALL-E 3",
            model: "dall-e-3",
          });
        }
      }
    }

    logger.info(
      {
        userId: session.user.id,
        totalConfigs: allConfigs.length,
        availableProviders: providers.map((p) => p.id),
      },
      "Retrieved available image generation providers",
    );

    return { success: true, data: { providers } };
  } catch (error) {
    logError(logger, "Failed to get available providers", error as Error);
    return { success: false, error: "Failed to get available providers" };
  }
}
