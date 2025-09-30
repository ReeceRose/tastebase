"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipeImages, recipes } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { type FileValidationError, saveRecipeImage } from "@/lib/file-storage";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  type UpdateRecipeImageInput,
  type UploadRecipeImageInput,
  updateRecipeImageSchema,
  uploadRecipeImageSchema,
} from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("recipe-image-actions");

export async function uploadRecipeImage(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      logger.warn("Unauthorized recipe image upload attempt");
      return { success: false, error: "Unauthorized" };
    }

    logger.info({ userId: session.user.id }, "Processing recipe image upload");

    const file = formData.get("file") as File;

    if (!file) {
      logger.warn(
        { userId: session.user.id },
        "No file provided in upload request",
      );
      return { success: false, error: "No file provided" };
    }

    const result = await saveRecipeImage(file);

    if ("error" in result) {
      const error = result as FileValidationError;
      logger.warn({ userId: session.user.id, error: error.code }, error.error);
      return {
        success: false,
        error: error.error,
        code: error.code,
      };
    }

    logger.info(
      {
        userId: session.user.id,
        filename: result.filename,
        originalName: result.originalName,
        fileSize: result.fileSize,
      },
      "Recipe image uploaded successfully",
    );

    return {
      success: true,
      file: {
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        width: result.width,
        height: result.height,
        variants: result.variants,
        url: `/api/recipes/images/${result.filename}`,
        thumbnailUrl: `/api/recipes/images/${result.filename}?size=thumbnail`,
        smallUrl: `/api/recipes/images/${result.filename}?size=small`,
      },
    };
  } catch (error) {
    logError(logger, "Recipe image upload failed", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function attachImageToRecipe(
  rawData: UploadRecipeImageInput & {
    filename: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
  },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = uploadRecipeImageSchema.parse(rawData);

    // Verify recipe exists and belongs to user
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, validatedData.recipeId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Get current image count for sort order
    const imageCount = await db
      .select({ count: eq(recipeImages.recipeId, validatedData.recipeId) })
      .from(recipeImages)
      .where(eq(recipeImages.recipeId, validatedData.recipeId));

    const sortOrder = imageCount.length;

    // If this should be the hero image, unset any existing hero images
    if (validatedData.isHero) {
      await db
        .update(recipeImages)
        .set({ isHero: false })
        .where(eq(recipeImages.recipeId, validatedData.recipeId));
    }

    const [image] = await db
      .insert(recipeImages)
      .values({
        id: nanoid(),
        recipeId: validatedData.recipeId,
        filename: rawData.filename,
        originalName: rawData.originalName,
        mimeType: rawData.mimeType,
        fileSize: rawData.fileSize,
        width: rawData.width,
        height: rawData.height,
        altText: validatedData.altText,
        isHero: validatedData.isHero,
        sortOrder,
        uploadedAt: new Date(),
      })
      .returning();

    logger.info(
      {
        imageId: image.id,
        recipeId: validatedData.recipeId,
        userId: session.user.id,
      },
      "Recipe image attached successfully",
    );

    return { success: true, data: image };
  } catch (error) {
    logError(logger, "Failed to attach image to recipe", error);
    return { success: false, error: "Failed to attach image to recipe" };
  }
}

export async function updateRecipeImage(rawData: UpdateRecipeImageInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateRecipeImageSchema.parse(rawData);
    const { id: imageId, ...updateData } = validatedData;

    if (!imageId) {
      return { success: false, error: "Image ID is required" };
    }

    // Verify image exists and user owns the recipe
    const existingImage = await db
      .select({
        image: recipeImages,
        recipe: recipes,
      })
      .from(recipeImages)
      .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
      .where(
        and(eq(recipeImages.id, imageId), eq(recipes.userId, session.user.id)),
      )
      .limit(1);

    if (!existingImage.length) {
      return { success: false, error: "Image not found" };
    }

    // If setting as hero image, unset other hero images for this recipe
    if (updateData.isHero) {
      await db
        .update(recipeImages)
        .set({ isHero: false })
        .where(
          and(
            eq(recipeImages.recipeId, existingImage[0].image.recipeId),
            eq(recipeImages.isHero, true),
          ),
        );
    }

    const [updatedImage] = await db
      .update(recipeImages)
      .set(updateData)
      .where(eq(recipeImages.id, imageId))
      .returning();

    logger.info(
      {
        imageId,
        recipeId: existingImage[0].image.recipeId,
        userId: session.user.id,
      },
      "Recipe image updated successfully",
    );

    return { success: true, data: updatedImage };
  } catch (error) {
    logError(logger, "Failed to update recipe image", error);
    return { success: false, error: "Failed to update recipe image" };
  }
}

export async function deleteRecipeImage(imageId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify image exists and user owns the recipe
    const existingImage = await db
      .select({
        image: recipeImages,
        recipe: recipes,
      })
      .from(recipeImages)
      .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
      .where(
        and(eq(recipeImages.id, imageId), eq(recipes.userId, session.user.id)),
      )
      .limit(1);

    if (!existingImage.length) {
      return { success: false, error: "Image not found" };
    }

    const filename = existingImage[0].image.filename;
    const recipeId = existingImage[0].image.recipeId;

    // Delete database record first
    await db.delete(recipeImages).where(eq(recipeImages.id, imageId));

    // Check if this was the only image, and if so, check for remaining images to set as hero
    const remainingImages = await db
      .select()
      .from(recipeImages)
      .where(eq(recipeImages.recipeId, recipeId));

    // If there's exactly one image left and no hero image, make it the hero
    if (remainingImages.length === 1 && !remainingImages[0].isHero) {
      await db
        .update(recipeImages)
        .set({ isHero: true })
        .where(eq(recipeImages.id, remainingImages[0].id));

      logger.info(
        { imageId: remainingImages[0].id, recipeId },
        "Set remaining image as hero image",
      );
    }

    // Clean up image files AFTER database deletion succeeds
    try {
      const { deleteRecipeImage: deleteImageFile } = await import(
        "@/lib/file-storage"
      );
      await deleteImageFile(filename);
    } catch (error) {
      logger.warn(
        { imageId, filename, error },
        "Failed to delete image file from filesystem after database deletion",
      );
    }

    logger.info(
      {
        imageId,
        recipeId: existingImage[0].image.recipeId,
        userId: session.user.id,
      },
      "Recipe image deleted successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete recipe image", error, { imageId });
    return { success: false, error: "Failed to delete recipe image" };
  }
}

export async function getRecipeImages(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe exists and belongs to user
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    const images = await db
      .select()
      .from(recipeImages)
      .where(eq(recipeImages.recipeId, recipeId))
      .orderBy(desc(recipeImages.isHero), recipeImages.sortOrder);

    // Auto-fix: If there's exactly one image and no hero image, make it the hero
    if (images.length === 1 && !images[0].isHero) {
      await db
        .update(recipeImages)
        .set({ isHero: true })
        .where(eq(recipeImages.id, images[0].id));

      // Update the returned data to reflect the change
      images[0].isHero = true;

      logger.info(
        { imageId: images[0].id, recipeId },
        "Auto-set single image as hero image",
      );
    }

    return { success: true, data: images };
  } catch (error) {
    logError(logger, "Failed to get recipe images", error, { recipeId });
    return { success: false, error: "Failed to get recipe images" };
  }
}

export async function setHeroImage(recipeId: string, imageId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify both recipe and image exist and belong to user
    const imageExists = await db
      .select({
        image: recipeImages,
        recipe: recipes,
      })
      .from(recipeImages)
      .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
      .where(
        and(
          eq(recipeImages.id, imageId),
          eq(recipeImages.recipeId, recipeId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!imageExists.length) {
      return { success: false, error: "Image not found" };
    }

    // Use individual queries instead of transaction to avoid Drizzle transaction issues
    // First unset current hero image
    await db
      .update(recipeImages)
      .set({ isHero: false })
      .where(
        and(eq(recipeImages.recipeId, recipeId), eq(recipeImages.isHero, true)),
      );

    // Then set new hero image
    await db
      .update(recipeImages)
      .set({ isHero: true })
      .where(eq(recipeImages.id, imageId));

    logger.info(
      {
        imageId,
        recipeId,
        userId: session.user.id,
      },
      "Hero image updated successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to set hero image", error, { recipeId, imageId });
    return { success: false, error: "Failed to set hero image" };
  }
}

export async function reorderRecipeImages(
  recipeId: string,
  imageIds: string[],
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe exists and belongs to user
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Update sort order for each image
    await db.transaction(async (tx) => {
      for (let i = 0; i < imageIds.length; i++) {
        await tx
          .update(recipeImages)
          .set({ sortOrder: i })
          .where(
            and(
              eq(recipeImages.id, imageIds[i]),
              eq(recipeImages.recipeId, recipeId),
            ),
          );
      }
    });

    logger.info(
      {
        recipeId,
        imageCount: imageIds.length,
        userId: session.user.id,
      },
      "Recipe images reordered successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to reorder recipe images", error, { recipeId });
    return { success: false, error: "Failed to reorder recipe images" };
  }
}
