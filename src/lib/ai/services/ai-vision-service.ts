import { generateObject } from "ai";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  AIProvider,
  type AIProviderConfig,
  ImageProcessingMethod,
  type ImageProcessingResult,
  type RecipeParsingResult,
  type VisionCapableProviderValue,
} from "@/lib/types";

const logger = createOperationLogger("ai-vision-service");

const RECIPE_VISION_SCHEMA = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  servings: z.number().optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
      }),
    )
    .optional(),
  instructions: z
    .array(
      z.object({
        step: z.number(),
        instruction: z.string(),
      }),
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  cuisine: z.string().optional(),
});

const RECIPE_VISION_PROMPT = `Analyze this image or PDF and extract any recipe information you can find.

Look carefully for:
- Recipe title and description
- Ingredient lists with quantities and units
- Step-by-step cooking instructions
- Cooking times, temperatures, and servings
- Any handwritten notes or modifications
- Cuisine type and difficulty level

Return the recipe data in structured JSON format.
If no recipe information is found in the image or PDF, return an object with only an empty title field.

Be precise with quantities and units. Convert any measurements to common cooking units (cups, tbsp, tsp, oz, lbs, etc).
Number the instruction steps sequentially starting from 1.`;

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const VISION_MODELS = {
  [AIProvider.OPENAI]: "gpt-4o",
  [AIProvider.ANTHROPIC]: "claude-3-5-sonnet-20241022",
  [AIProvider.GOOGLE]: "gemini-1.5-pro",
} as const;

export async function processImageWithVision(
  imageBuffer: Buffer,
  provider: VisionCapableProviderValue,
  userId: string,
): Promise<ImageProcessingResult> {
  const startTime = Date.now();

  try {
    logger.info(
      {
        provider,
        imageSize: imageBuffer.length,
        userId,
      },
      "Starting AI Vision processing",
    );

    // Get user's AI configuration
    const userConfig = await getActiveConfig(userId);
    if (!userConfig) {
      throw new Error("No AI configuration found for user");
    }

    // Validate image
    const validation = validateImage(imageBuffer);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create provider-specific config for vision
    const _visionConfig: AIProviderConfig = {
      ...userConfig,
      provider,
      modelName: VISION_MODELS[provider],
    };

    const model = getProvider(_visionConfig);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = detectMimeType(imageBuffer);

    // Generate recipe data using vision
    const { object: recipeData, usage } = await generateObject({
      model,
      schema: RECIPE_VISION_SCHEMA,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: RECIPE_VISION_PROMPT },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const processingTime = Date.now() - startTime;

    // Calculate cost estimate
    const costEstimate = estimateCost(provider, usage?.totalTokens || 0);

    const result: ImageProcessingResult = {
      ...recipeData,
      processingMethod: ImageProcessingMethod.AI_VISION,
      processingTime,
      confidence: calculateConfidence(recipeData),
      fallbackUsed: false,
      costEstimate,
    };

    logger.info(
      {
        provider,
        processingTime,
        confidence: result.confidence,
        costEstimate,
        hasTitle: !!result.title,
        ingredientCount: result.ingredients?.length || 0,
        instructionCount: result.instructions?.length || 0,
      },
      "AI Vision processing completed",
    );

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(logger, "AI Vision processing failed", error as Error, {
      provider,
      processingTime,
      imageSize: imageBuffer.length,
    });

    // Extract meaningful error message
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific quota/billing errors
    let userFriendlyError = "AI processing failed. Please try again.";
    if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
      userFriendlyError =
        "AI quota exceeded. Please check your API billing and try again.";
    } else if (errorMessage.includes("rate limit")) {
      userFriendlyError =
        "AI rate limit exceeded. Please wait a moment and try again.";
    } else if (errorMessage.includes("API key")) {
      userFriendlyError =
        "AI API key invalid. Please check your configuration.";
    }

    // Return empty result with error indication
    return {
      processingMethod: ImageProcessingMethod.AI_VISION,
      processingTime,
      confidence: 0,
      fallbackUsed: false,
      costEstimate: 0,
      error: userFriendlyError,
    };
  }
}

export async function processImageWithAutoProvider(
  imageBuffer: Buffer,
  userId: string,
): Promise<ImageProcessingResult> {
  const userConfig = await getActiveConfig(userId);

  if (!userConfig) {
    throw new Error("No AI configuration found for user");
  }

  // Determine best provider for vision based on user's config
  let visionProvider: VisionCapableProviderValue;

  switch (userConfig.provider) {
    case AIProvider.OPENAI:
      visionProvider = AIProvider.OPENAI;
      break;
    case AIProvider.ANTHROPIC:
      visionProvider = AIProvider.ANTHROPIC;
      break;
    case AIProvider.GOOGLE:
      visionProvider = AIProvider.GOOGLE;
      break;
    default:
      // Default to OpenAI for best vision capabilities
      visionProvider = AIProvider.OPENAI;
      break;
  }

  return processImageWithVision(imageBuffer, visionProvider, userId);
}

function validateImage(imageBuffer: Buffer): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (imageBuffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image too large (${Math.round(imageBuffer.length / 1024 / 1024)}MB). Maximum size is 20MB.`,
    };
  }

  // Check file format by examining header bytes
  const mimeType = detectMimeType(imageBuffer);
  if (
    !SUPPORTED_FORMATS.includes(mimeType as (typeof SUPPORTED_FORMATS)[number])
  ) {
    return {
      valid: false,
      error: `Unsupported file format. Please use JPEG, PNG, WebP, HEIC, or PDF.`,
    };
  }

  return { valid: true };
}

function detectMimeType(buffer: Buffer): string {
  // Check magic bytes to determine file format
  const header = buffer.slice(0, 12);

  // PDF: %PDF
  if (header.slice(0, 4).toString() === "%PDF") {
    return "application/pdf";
  }

  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP: RIFF...WEBP
  if (
    header.slice(0, 4).toString() === "RIFF" &&
    header.slice(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }

  // HEIC: ...ftyp with compatible brands containing heic/mif1
  if (header.slice(4, 8).toString() === "ftyp") {
    return "image/heic";
  }

  // Default to JPEG if cannot determine
  return "image/jpeg";
}

function calculateConfidence(recipeData: RecipeParsingResult): number {
  let confidence = 0;

  // Base confidence if we have any data
  if (
    recipeData.title ||
    recipeData.ingredients?.length ||
    recipeData.instructions?.length
  ) {
    confidence = 0.3;
  }

  // Increase confidence based on completeness
  if (recipeData.title) confidence += 0.2;
  if (recipeData.ingredients?.length) confidence += 0.25;
  if (recipeData.instructions?.length) confidence += 0.25;

  // Bonus for detailed data
  if (recipeData.ingredients && recipeData.ingredients.length >= 3)
    confidence += 0.1;
  if (recipeData.instructions && recipeData.instructions.length >= 3)
    confidence += 0.1;
  if (recipeData.prepTime || recipeData.cookTime) confidence += 0.05;
  if (recipeData.servings) confidence += 0.05;

  return Math.min(confidence, 1.0);
}

function estimateCost(
  provider: VisionCapableProviderValue,
  tokens: number,
): number {
  // Cost estimates per 1k tokens (including image processing costs)
  const costPer1k = {
    [AIProvider.OPENAI]: 0.01, // GPT-4V pricing
    [AIProvider.ANTHROPIC]: 0.003, // Claude 3.5 Sonnet pricing
    [AIProvider.GOOGLE]: 0.00125, // Gemini 1.5 Pro pricing
  };

  // Base image processing cost (additional to tokens)
  const baseCost = {
    [AIProvider.OPENAI]: 0.01,
    [AIProvider.ANTHROPIC]: 0.005,
    [AIProvider.GOOGLE]: 0.0025,
  };

  const tokenCost = (tokens / 1000) * costPer1k[provider];
  return baseCost[provider] + tokenCost;
}

export function isVisionSupported(provider: string): boolean {
  return (
    provider === AIProvider.OPENAI ||
    provider === AIProvider.ANTHROPIC ||
    provider === AIProvider.GOOGLE
  );
}

export function getSupportedFormats(): readonly string[] {
  return SUPPORTED_FORMATS;
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}
