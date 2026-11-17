"use server";

import { stat } from "node:fs/promises";
import { and, count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipes, recipeVideos } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import {
  deleteRecipeVideo,
  getRecipeVideoPath,
  videoMimeTypeFor,
} from "@/lib/file-storage/videos";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import type { RecipeVideo } from "@/lib/types/recipe-types";
import {
  type AttachRecipeVideosInput,
  attachRecipeVideosSchema,
} from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("recipe-video-actions");

async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

async function fileExists(filename: string): Promise<boolean> {
  const info = await stat(getRecipeVideoPath(filename)).catch(() => null);
  return info?.isFile() ?? false;
}

export async function attachVideosToRecipe(
  rawData: AttachRecipeVideosInput,
): Promise<ServerActionResult<RecipeVideo[]>> {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const { recipeId, videos } = attachRecipeVideosSchema.parse(rawData);
    const [recipe] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
      .limit(1);
    if (!recipe) {
      return { success: false, error: "Recipe not found" };
    }

    const present = await Promise.all(
      videos.map((video) => fileExists(video.filename)),
    );
    const stored = videos.filter((_, index) => present[index]);
    if (stored.length === 0) {
      return { success: false, error: "Those videos are no longer stored" };
    }

    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(recipeVideos)
      .where(eq(recipeVideos.recipeId, recipeId));

    const inserted = await db
      .insert(recipeVideos)
      .values(
        stored.map((video, index) => ({
          id: nanoid(),
          recipeId,
          filename: video.filename,
          originalName: video.originalName,
          mimeType: videoMimeTypeFor(video.filename),
          fileSize: video.fileSize,
          durationSeconds: video.durationSeconds,
          title: video.title,
          stepNumbers: video.stepNumbers,
          sortOrder: existingCount + index,
        })),
      )
      .returning();

    logger.info(
      { recipeId, userId, count: stored.length },
      "Recipe videos attached",
    );
    return { success: true, data: inserted };
  } catch (error) {
    logError(logger, "Failed to attach videos to recipe", error);
    return { success: false, error: "Failed to attach videos to recipe" };
  }
}

export async function deleteRecipeVideoAction(
  videoId: string,
): Promise<ServerActionResult<null>> {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const [existing] = await db
      .select({ filename: recipeVideos.filename })
      .from(recipeVideos)
      .innerJoin(recipes, eq(recipeVideos.recipeId, recipes.id))
      .where(and(eq(recipeVideos.id, videoId), eq(recipes.userId, userId)))
      .limit(1);
    if (!existing) {
      return { success: false, error: "Video not found" };
    }

    await db.delete(recipeVideos).where(eq(recipeVideos.id, videoId));
    await deleteRecipeVideo(existing.filename);
    logger.info({ videoId, userId }, "Recipe video deleted");
    return { success: true, data: null };
  } catch (error) {
    logError(logger, "Failed to delete recipe video", error, { videoId });
    return { success: false, error: "Failed to delete the video" };
  }
}
