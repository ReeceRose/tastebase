"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipeImages, recipes, storageStats, users } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { env } from "@/lib/config/env";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("storage-actions");

interface StorageStatsResult {
  totalRecipes: number;
  totalImages: number;
  databaseSizeMB: number;
  imagesSizeMB: number;
  totalSizeMB: number;
  avgRecipeSize: number;
  lastCalculated: Date;
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  try {
    // Check if directory exists first
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat) {
      logger.info(
        { path: dirPath },
        "Directory does not exist, returning 0 size",
      );
      return 0;
    }

    if (!stat.isDirectory()) {
      return stat.size;
    }

    const files = await fs.readdir(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const fileStat = await fs.stat(filePath);

        if (fileStat.isDirectory()) {
          totalSize += await calculateDirectorySize(filePath);
        } else {
          totalSize += fileStat.size;
        }
      } catch (fileError) {
        logger.warn(
          { path: filePath, error: fileError },
          "Failed to stat file, skipping",
        );
      }
    }

    return totalSize;
  } catch (error) {
    logger.warn({ path: dirPath, error }, "Failed to calculate directory size");
    return 0;
  }
}

async function getDatabaseSize(): Promise<number> {
  try {
    // For SQLite, check the database file size
    const dbPath = env.DATABASE_URL?.replace("file:", "") || "./data/db.sqlite";
    const stat = await fs.stat(dbPath);
    return stat.size;
  } catch (error) {
    logger.warn({ error }, "Failed to get database size");
    return 0;
  }
}

export async function calculateStorageStats(): Promise<
  | { success: true; data: StorageStatsResult }
  | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;

    logger.info({ userId }, "Calculating storage stats");

    // Get recipe and image counts
    const recipeCountResult = await db
      .select({ count: count(recipes.id) })
      .from(recipes)
      .where(eq(recipes.userId, userId));

    const imageCountResult = await db
      .select({ count: count(recipeImages.id) })
      .from(recipeImages)
      .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
      .where(eq(recipes.userId, userId));

    logger.info(
      {
        recipeCountResult,
        imageCountResult,
      },
      "Database query results",
    );

    const [recipeCount] = recipeCountResult;
    const [imageCount] = imageCountResult;

    // Calculate file sizes
    const uploadsDir = path.join(process.cwd(), "uploads", userId);

    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      logger.warn({ uploadsDir, error }, "Failed to create uploads directory");
    }

    const imagesSizeBytes = await calculateDirectorySize(uploadsDir);
    const databaseSizeBytes = await getDatabaseSize();

    // Convert to MB
    const imagesSizeMB = imagesSizeBytes / (1024 * 1024);
    const databaseSizeMB = databaseSizeBytes / (1024 * 1024);
    const totalSizeMB = imagesSizeMB + databaseSizeMB;

    // Get user's storage limit (default 10GB)
    const [_user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Safely extract counts with fallbacks
    const totalRecipes = recipeCount?.count || 0;
    const totalImages = imageCount?.count || 0;

    // Calculate average recipe size (database portion only, not including images)
    const avgRecipeSize = totalRecipes > 0 ? databaseSizeMB / totalRecipes : 0;

    const statsData: StorageStatsResult = {
      totalRecipes,
      totalImages,
      databaseSizeMB: parseFloat(databaseSizeMB.toFixed(2)),
      imagesSizeMB: parseFloat(imagesSizeMB.toFixed(2)),
      totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
      avgRecipeSize: parseFloat(avgRecipeSize.toFixed(4)),
      lastCalculated: new Date(),
    };

    // Upsert storage stats using the unique userId constraint
    await db
      .insert(storageStats)
      .values({
        id: crypto.randomUUID(),
        userId,
        totalRecipes: statsData.totalRecipes,
        totalImages: statsData.totalImages,
        databaseSizeMB: statsData.databaseSizeMB,
        imagesSizeMB: statsData.imagesSizeMB,
        totalSizeMB: statsData.totalSizeMB,
        lastCalculated: new Date(),
      })
      .onConflictDoUpdate({
        target: storageStats.userId,
        set: {
          totalRecipes: statsData.totalRecipes,
          totalImages: statsData.totalImages,
          databaseSizeMB: statsData.databaseSizeMB,
          imagesSizeMB: statsData.imagesSizeMB,
          totalSizeMB: statsData.totalSizeMB,
          lastCalculated: new Date(),
          updatedAt: new Date(),
        },
      });

    logger.info(
      {
        userId,
        totalRecipes: statsData.totalRecipes,
        totalSizeMB: statsData.totalSizeMB,
        avgRecipeSize: statsData.avgRecipeSize,
      },
      "Storage stats calculated successfully",
    );

    return { success: true, data: statsData };
  } catch (error) {
    logError(logger, "Failed to calculate storage stats", error);
    return { success: false, error: "Failed to calculate storage statistics" };
  }
}

export async function getStorageStats(): Promise<
  | { success: true; data: StorageStatsResult }
  | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;

    // Try to get cached stats first
    const [cachedStats] = await db
      .select()
      .from(storageStats)
      .where(eq(storageStats.userId, userId))
      .limit(1);

    // If stats are older than 5 minutes, recalculate
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (!cachedStats || new Date(cachedStats.lastCalculated) < fiveMinutesAgo) {
      return await calculateStorageStats();
    }

    // Return cached stats
    const statsData: StorageStatsResult = {
      totalRecipes: cachedStats.totalRecipes,
      totalImages: cachedStats.totalImages,
      databaseSizeMB: cachedStats.databaseSizeMB,
      imagesSizeMB: cachedStats.imagesSizeMB,
      totalSizeMB: cachedStats.totalSizeMB,
      avgRecipeSize:
        cachedStats.totalRecipes > 0
          ? cachedStats.databaseSizeMB / cachedStats.totalRecipes
          : 0,
      lastCalculated: new Date(cachedStats.lastCalculated),
    };

    return { success: true, data: statsData };
  } catch (error) {
    logError(logger, "Failed to get storage stats", error);
    return { success: false, error: "Failed to retrieve storage statistics" };
  }
}
