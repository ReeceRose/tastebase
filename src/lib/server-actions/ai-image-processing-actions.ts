"use server";

import { headers } from "next/headers";
import { processRecipeImage } from "@/lib/ai/services/image-processor";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  ImageProcessingMethod,
  type ImageProcessingResult,
  type ImageProcessingSettings,
} from "@/lib/types";

const logger = createOperationLogger("ai-image-processing-actions");

export interface ProcessImageActionResult {
  success: boolean;
  data?: ImageProcessingResult;
  error?: string;
}

export async function processRecipeImageAction(
  imageFile: File,
  method: ImageProcessingMethod = ImageProcessingMethod.AUTO,
  settings?: ImageProcessingSettings,
): Promise<ProcessImageActionResult> {
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
        fileName: imageFile.name,
        fileSize: imageFile.size,
        method,
      },
      "Processing recipe image",
    );

    // Validate file
    if (!imageFile) {
      return {
        success: false,
        error: "No image file provided",
      };
    }

    // Check file size (max 20MB for images and PDFs)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (imageFile.size > maxSize) {
      return {
        success: false,
        error: "File is too large (max 20MB)",
      };
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (!allowedTypes.includes(imageFile.type)) {
      return {
        success: false,
        error:
          "Invalid file type. Please use JPEG, PNG, WebP, HEIC, or PDF files.",
      };
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the image
    const result = await processRecipeImage(
      buffer,
      method,
      session.user.id,
      settings,
    );

    // Check if processing returned an error
    if (result.error) {
      logger.info(
        {
          userId: session.user.id,
          success: false,
          processingTime: result.processingTime,
          error: result.error,
        },
        "Image processing failed with error",
      );

      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      {
        userId: session.user.id,
        success: true,
        processingTime: result.processingTime,
      },
      "Image processing completed successfully",
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logError(logger, "Failed to process recipe image", error, {
      fileName: imageFile?.name,
      fileSize: imageFile?.size,
      method,
    });

    return {
      success: false,
      error: "Failed to process image. Please try again.",
    };
  }
}
