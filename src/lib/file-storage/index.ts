import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("file-storage");

// File storage configuration
export const STORAGE_CONFIG = {
  uploadsDir: path.join(process.cwd(), "uploads"),
  recipeImagesDir: path.join(process.cwd(), "uploads", "recipe-images"),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ] as const,
  imageSizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 400, height: 300 },
    medium: { width: 800, height: 600 },
    large: { width: 1200, height: 900 },
  },
} as const;

export type ImageSize = keyof typeof STORAGE_CONFIG.imageSizes;

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  variants?: Record<ImageSize, string>;
}

export enum FileValidationErrorCode {
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_FILE = "INVALID_FILE",
  STORAGE_ERROR = "STORAGE_ERROR",
}

export interface FileValidationError {
  error: string;
  code: FileValidationErrorCode;
}

// Initialize storage directories
export function initializeStorage() {
  try {
    if (!existsSync(STORAGE_CONFIG.uploadsDir)) {
      mkdirSync(STORAGE_CONFIG.uploadsDir, { recursive: true });
      logger.info("Created uploads directory");
    }

    if (!existsSync(STORAGE_CONFIG.recipeImagesDir)) {
      mkdirSync(STORAGE_CONFIG.recipeImagesDir, { recursive: true });
      logger.info("Created recipe images directory");
    }
  } catch (error) {
    logError(logger, "Failed to initialize storage directories", error);
    throw error;
  }
}

// Validate file before processing
export function validateFile(file: File): FileValidationError | null {
  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    return {
      error: `File size too large. Maximum size is ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`,
      code: FileValidationErrorCode.FILE_TOO_LARGE,
    };
  }

  // Check MIME type
  if (
    !STORAGE_CONFIG.allowedMimeTypes.includes(
      file.type as (typeof STORAGE_CONFIG.allowedMimeTypes)[number],
    )
  ) {
    return {
      error: `Invalid file type. Allowed types: ${STORAGE_CONFIG.allowedMimeTypes.join(", ")}`,
      code: FileValidationErrorCode.INVALID_TYPE,
    };
  }

  // Basic file validation
  if (!file.name || file.size === 0) {
    return {
      error: "Invalid file",
      code: FileValidationErrorCode.INVALID_FILE,
    };
  }

  return null;
}

// Generate unique filename with extension
export function generateFilename(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  const uniqueId = randomUUID();
  return `${uniqueId}${extension}`;
}

// Save uploaded file and create optimized variants
export async function saveRecipeImage(
  file: File,
): Promise<FileUploadResult | FileValidationError> {
  const validation = validateFile(file);
  if (validation) {
    return validation;
  }

  const filename = generateFilename(file.name);
  const filePath = path.join(STORAGE_CONFIG.recipeImagesDir, filename);

  try {
    // Initialize storage if needed
    initializeStorage();

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    logger.info(
      {
        filename,
        originalName: file.name,
        size: file.size,
        dimensions: `${metadata.width}x${metadata.height}`,
      },
      "Processing recipe image upload",
    );

    // Save original image optimized for web
    await sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .png({ compressionLevel: 6 })
      .webp({ quality: 85 })
      .toFile(filePath);

    // Create image variants
    const variants: Record<ImageSize, string> = {} as Record<ImageSize, string>;

    for (const [sizeName, dimensions] of Object.entries(
      STORAGE_CONFIG.imageSizes,
    )) {
      const variantFilename = `${path.parse(filename).name}_${sizeName}${path.extname(filename)}`;
      const variantPath = path.join(
        STORAGE_CONFIG.recipeImagesDir,
        variantFilename,
      );

      await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 80 })
        .png({ compressionLevel: 6 })
        .webp({ quality: 80 })
        .toFile(variantPath);

      variants[sizeName as ImageSize] = variantFilename;
    }

    const result: FileUploadResult = {
      filename,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      width: metadata.width,
      height: metadata.height,
      variants,
    };

    logger.info(
      { filename, variants: Object.keys(variants) },
      "Recipe image processed successfully",
    );
    return result;
  } catch (error) {
    logError(logger, "Failed to save recipe image", error, {
      filename,
      originalName: file.name,
    });

    // Cleanup on error
    try {
      await unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }

    return {
      error: "Failed to process image. Please try again.",
      code: FileValidationErrorCode.STORAGE_ERROR,
    };
  }
}

// Delete recipe image and all variants
export async function deleteRecipeImage(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(STORAGE_CONFIG.recipeImagesDir, filename);

    // Delete main file
    try {
      await unlink(filePath);
    } catch (_error) {
      logger.warn({ filename }, "Main image file not found during deletion");
    }

    // Delete variants
    const baseName = path.parse(filename).name;
    const extension = path.extname(filename);

    for (const sizeName of Object.keys(STORAGE_CONFIG.imageSizes)) {
      const variantFilename = `${baseName}_${sizeName}${extension}`;
      const variantPath = path.join(
        STORAGE_CONFIG.recipeImagesDir,
        variantFilename,
      );

      try {
        await unlink(variantPath);
      } catch {
        // Ignore variant deletion errors
      }
    }

    logger.info({ filename }, "Recipe image and variants deleted successfully");
    return true;
  } catch (error) {
    logError(logger, "Failed to delete recipe image", error, { filename });
    return false;
  }
}

// Get file path for serving
export function getRecipeImagePath(filename: string, size?: ImageSize): string {
  if (size) {
    const baseName = path.parse(filename).name;
    const extension = path.extname(filename);
    const variantFilename = `${baseName}_${size}${extension}`;
    return path.join(STORAGE_CONFIG.recipeImagesDir, variantFilename);
  }

  return path.join(STORAGE_CONFIG.recipeImagesDir, filename);
}

// Cleanup orphaned files (files not in database)
export async function cleanupOrphanedFiles(
  validFilenames: string[],
): Promise<number> {
  try {
    const fs = await import("node:fs/promises");
    const files = await fs.readdir(STORAGE_CONFIG.recipeImagesDir);

    let deletedCount = 0;

    for (const file of files) {
      // Skip files that are in the valid list or are variants of valid files
      const isValid = validFilenames.some((validFile) => {
        const baseName = path.parse(validFile).name;
        return file.startsWith(baseName);
      });

      if (!isValid) {
        const filePath = path.join(STORAGE_CONFIG.recipeImagesDir, file);
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    logger.info(
      { deletedCount, totalFiles: files.length },
      "Cleanup orphaned files completed",
    );
    return deletedCount;
  } catch (error) {
    logError(logger, "Failed to cleanup orphaned files", error);
    return 0;
  }
}
