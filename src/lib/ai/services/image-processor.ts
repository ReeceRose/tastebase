import { getActiveConfig } from "@/lib/ai/config";
import { processTask } from "@/lib/ai/service";
import {
  processImageWithAutoProvider,
  processImageWithVision,
} from "@/lib/ai/services/ai-vision-service";
import { extractTextFromImage } from "@/lib/ai/services/ocr-service";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  AIProvider,
  type AIProviderConfig,
  type AITaskRequest,
  ImageProcessingMethod,
  type ImageProcessingResult,
  type ImageProcessingSettings,
  type RecipeParsingResult,
  VISION_CAPABLE_PROVIDERS,
  type VisionCapableProviderValue,
} from "@/lib/types";

const logger = createOperationLogger("image-processor");

export async function processRecipeImage(
  imageBuffer: Buffer,
  method: ImageProcessingMethod,
  userId: string,
  settings?: ImageProcessingSettings,
): Promise<ImageProcessingResult> {
  const startTime = Date.now();

  try {
    logger.info(
      {
        method,
        fileSize: imageBuffer.length,
        userId,
        settings,
      },
      "Starting image/PDF processing",
    );

    switch (method) {
      case ImageProcessingMethod.OCR:
        return await processWithOCR(imageBuffer);
      case ImageProcessingMethod.AI_VISION:
        return await processWithAIVision(imageBuffer, userId, settings);
      case ImageProcessingMethod.AUTO:
        return await processWithAutoSelection(imageBuffer, userId, settings);
      default:
        throw new Error(`Unsupported processing method: ${method}`);
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(logger, "Image processing failed", error as Error, {
      method,
      processingTime,
      imageSize: imageBuffer.length,
    });

    // Return empty result indicating failure
    return {
      processingMethod:
        method === ImageProcessingMethod.AI_VISION
          ? ImageProcessingMethod.AI_VISION
          : ImageProcessingMethod.OCR,
      processingTime,
      confidence: 0,
      fallbackUsed: false,
      costEstimate: method === ImageProcessingMethod.AI_VISION ? 0 : undefined,
    };
  }
}

async function processWithOCR(
  imageBuffer: Buffer,
): Promise<ImageProcessingResult> {
  const startTime = Date.now();

  try {
    // Extract text using OCR
    const ocrResult = await extractTextFromImage(imageBuffer);

    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      return {
        processingMethod: ImageProcessingMethod.OCR,
        processingTime: ocrResult.processingTime,
        confidence: 0,
        fallbackUsed: false,
      };
    }

    // Parse the extracted text with AI to get structured recipe data
    const aiRequest: AITaskRequest = {
      taskType: "recipe-parsing",
      userId: "system", // OCR processing doesn't require user-specific config
      input: ocrResult.text,
      options: {
        temperature: 0.3,
      },
    };

    // Get a basic AI config for text parsing (prefer free options)
    const dummyConfig = {
      provider: AIProvider.OLLAMA,
      modelName: "llama3.2",
      maxTokens: 4000,
      temperature: 0.3,
      enabledTasks: "recipe-parsing",
      ollamaHost: "http://localhost:11434",
      isActive: true,
    };

    const aiResponse = await processTask(aiRequest, dummyConfig);
    const totalProcessingTime = Date.now() - startTime;

    if (!aiResponse.success || !aiResponse.data) {
      return {
        processingMethod: ImageProcessingMethod.OCR,
        processingTime: totalProcessingTime,
        confidence: ocrResult.confidence,
        fallbackUsed: false,
      };
    }

    const recipeData = aiResponse.data as RecipeParsingResult;

    return {
      ...recipeData,
      processingMethod: ImageProcessingMethod.OCR,
      processingTime: totalProcessingTime,
      confidence: Math.min(
        ocrResult.confidence,
        calculateRecipeCompleteness(recipeData),
      ),
      fallbackUsed: false,
    };
  } catch (error) {
    logError(logger, "OCR processing failed", error as Error);

    return {
      processingMethod: ImageProcessingMethod.OCR,
      processingTime: Date.now() - startTime,
      confidence: 0,
      fallbackUsed: false,
    };
  }
}

async function processWithAIVision(
  imageBuffer: Buffer,
  userId: string,
  settings?: ImageProcessingSettings,
): Promise<ImageProcessingResult> {
  try {
    // Use preferred provider from settings, or auto-detect from user config
    let result: ImageProcessingResult;
    if (settings?.preferredProvider) {
      result = await processImageWithVision(
        imageBuffer,
        settings.preferredProvider,
        userId,
      );
    } else {
      result = await processImageWithAutoProvider(imageBuffer, userId);
    }

    // If AI Vision returned with an error, handle fallback or propagate error
    if (result.error) {
      // Don't fallback for quota/billing errors - user needs to fix their AI config
      const isQuotaError =
        result.error.includes("quota") || result.error.includes("billing");
      const isRateLimitError = result.error.includes("rate limit");

      if (isQuotaError || isRateLimitError) {
        logger.info(
          { userId, aiError: result.error },
          "Not falling back for quota/rate limit error",
        );
        return result;
      }

      // If fallback is enabled for other errors, try OCR
      if (settings?.enableFallback !== false) {
        logger.info(
          { userId, aiError: result.error },
          "Falling back to OCR after AI Vision error",
        );

        try {
          const ocrResult = await processWithOCR(imageBuffer);
          return {
            ...ocrResult,
            fallbackUsed: true,
          };
        } catch (ocrError) {
          // If OCR also fails, return the original AI error
          logger.warn({ userId, ocrError }, "OCR fallback also failed");
          return result;
        }
      }

      // No fallback - return the error result
      return result;
    }

    return result;
  } catch (error) {
    logError(logger, "AI Vision processing failed", error as Error, {
      userId,
    });

    // If fallback is enabled, try OCR
    if (settings?.enableFallback !== false) {
      logger.info({ userId }, "Falling back to OCR after AI Vision failure");

      const ocrResult = await processWithOCR(imageBuffer);
      return {
        ...ocrResult,
        fallbackUsed: true,
      };
    }

    throw error;
  }
}

async function processWithAutoSelection(
  imageBuffer: Buffer,
  userId: string,
  settings?: ImageProcessingSettings,
): Promise<ImageProcessingResult> {
  try {
    const userConfig = await getActiveConfig(userId);

    // Decision logic for auto-selection
    const shouldUseAIVisionFlag = shouldUseAIVision(userConfig);

    if (shouldUseAIVisionFlag) {
      logger.info({ userId }, "Auto-selection: Using AI Vision");

      const result = await processWithAIVision(imageBuffer, userId, settings);

      // If AI Vision returned with an error and no fallback was used, conditionally try OCR
      if (result.error && !result.fallbackUsed) {
        // Don't fallback for quota/billing errors - user needs to fix their AI config
        const isQuotaError =
          result.error.includes("quota") || result.error.includes("billing");
        const isRateLimitError = result.error.includes("rate limit");

        if (isQuotaError || isRateLimitError) {
          logger.info(
            { userId, aiError: result.error },
            "Not falling back for quota/rate limit error in auto-selection",
          );
          return result;
        }

        logger.info(
          { userId, aiError: result.error },
          "AI Vision failed, falling back to OCR",
        );

        try {
          const ocrResult = await processWithOCR(imageBuffer);
          return {
            ...ocrResult,
            fallbackUsed: true,
          };
        } catch (ocrError) {
          // If OCR also fails, return the original AI error
          logger.warn(
            { userId, ocrError },
            "OCR fallback also failed in auto-selection",
          );
          return result;
        }
      }

      return result;
    } else {
      logger.info({ userId }, "Auto-selection: Using OCR");
      return await processWithOCR(imageBuffer);
    }
  } catch (error) {
    logError(logger, "Auto-selection processing failed", error as Error, {
      userId,
    });

    // Final fallback to OCR
    return await processWithOCR(imageBuffer);
  }
}

function shouldUseAIVision(userConfig: AIProviderConfig | null): boolean {
  if (!userConfig) {
    return false; // No AI config means use OCR
  }

  // Don't use AI Vision for Ollama users (local-first preference)
  if (userConfig.provider === AIProvider.OLLAMA) {
    return false;
  }

  // Use AI Vision if user has configured a vision-capable provider
  const hasVisionProvider = VISION_CAPABLE_PROVIDERS.includes(
    userConfig.provider as VisionCapableProviderValue,
  );
  const hasApiKey = Boolean(userConfig.apiKey);
  const isActive = Boolean(userConfig.isActive ?? false);

  return hasVisionProvider && hasApiKey && isActive;
}

function calculateRecipeCompleteness(recipe: RecipeParsingResult): number {
  let completeness = 0;

  // Base score for having any data
  if (
    recipe.title ||
    recipe.ingredients?.length ||
    recipe.instructions?.length
  ) {
    completeness = 0.2;
  }

  // Score based on recipe completeness
  if (recipe.title) completeness += 0.2;
  if (recipe.ingredients && recipe.ingredients.length > 0) completeness += 0.3;
  if (recipe.instructions && recipe.instructions.length > 0)
    completeness += 0.3;

  // Bonus for additional details
  if (recipe.description) completeness += 0.05;
  if (recipe.servings) completeness += 0.05;
  if (recipe.prepTime || recipe.cookTime) completeness += 0.1;
  if (recipe.tags && recipe.tags.length > 0) completeness += 0.05;

  return Math.min(completeness, 1.0);
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size (20MB max)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 20MB.`,
    };
  }

  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
  ];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported file format. Please use JPEG, PNG, WebP, or HEIC.",
    };
  }

  return { valid: true };
}

export async function validateImageBuffer(
  buffer: Buffer,
): Promise<{ valid: boolean; error?: string }> {
  if (buffer.length === 0) {
    return { valid: false, error: "Empty image file" };
  }

  if (buffer.length > 20 * 1024 * 1024) {
    return {
      valid: false,
      error: `Image too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum size is 20MB.`,
    };
  }

  return { valid: true };
}

export function getRecommendedMethod(
  userConfig: AIProviderConfig | null,
): ImageProcessingMethod {
  if (!userConfig) {
    return ImageProcessingMethod.OCR;
  }

  if (userConfig.provider === AIProvider.OLLAMA) {
    return ImageProcessingMethod.OCR;
  }

  if (
    VISION_CAPABLE_PROVIDERS.includes(
      userConfig.provider as VisionCapableProviderValue,
    ) &&
    userConfig.apiKey &&
    (userConfig.isActive ?? false)
  ) {
    return ImageProcessingMethod.AUTO;
  }

  return ImageProcessingMethod.OCR;
}

export function getProcessingMethodInfo(method: ImageProcessingMethod) {
  switch (method) {
    case ImageProcessingMethod.OCR:
      return {
        name: "Local OCR Processing",
        description: "Private, free, works offline. Best for printed recipes.",
        privacy: "high",
        cost: "free",
        accuracy: "good",
        speed: "moderate",
      };
    case ImageProcessingMethod.AI_VISION:
      return {
        name: "AI Vision Processing",
        description:
          "Higher accuracy, better for handwritten recipes. Requires API key.",
        privacy: "low",
        cost: "$0.01-0.05 per image",
        accuracy: "excellent",
        speed: "fast",
      };
    case ImageProcessingMethod.AUTO:
      return {
        name: "Auto (Recommended)",
        description:
          "AI Vision if available, OCR fallback. Best of both worlds.",
        privacy: "medium",
        cost: "varies",
        accuracy: "excellent",
        speed: "fast",
      };
  }
}
