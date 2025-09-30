"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { recipeModifications, recipes } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-modifications");

export interface CreateModificationInput {
  recipeId: string;
  changeType:
    | "title"
    | "ingredients"
    | "instructions"
    | "metadata"
    | "images"
    | "major";
  changeDescription: string;
  oldValue?: string | number | boolean | null;
  newValue?: string | number | boolean | null;
}

type RecipeChangeType =
  | "title"
  | "ingredients"
  | "instructions"
  | "metadata"
  | "images"
  | "major";

export interface GetModificationsOptions {
  limit?: number;
  changeType?: RecipeChangeType;
  userId?: string;
}

// Create a new modification record
export async function createRecipeModification(input: CreateModificationInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get current version number
    const latestModification = await db
      .select({ versionNumber: recipeModifications.versionNumber })
      .from(recipeModifications)
      .where(eq(recipeModifications.recipeId, input.recipeId))
      .orderBy(desc(recipeModifications.versionNumber))
      .limit(1);

    const nextVersionNumber =
      latestModification.length > 0
        ? latestModification[0].versionNumber + 1
        : 1;

    const modificationId = nanoid();

    await db.insert(recipeModifications).values({
      id: modificationId,
      recipeId: input.recipeId,
      userId: session.user.id,
      changeType: input.changeType,
      changeDescription: input.changeDescription,
      oldValue: input.oldValue ? JSON.stringify(input.oldValue) : null,
      newValue: input.newValue ? JSON.stringify(input.newValue) : null,
      versionNumber: nextVersionNumber,
    });

    logger.info(
      {
        modificationId,
        recipeId: input.recipeId,
        changeType: input.changeType,
        versionNumber: nextVersionNumber,
      },
      "Recipe modification created",
    );

    return {
      success: true,
      modification: {
        id: modificationId,
        versionNumber: nextVersionNumber,
      },
    };
  } catch (error) {
    logError(logger, "Failed to create recipe modification", error, {
      recipeId: input.recipeId,
      changeType: input.changeType,
    });
    return { success: false, error: "Failed to create modification record" };
  }
}

// Get modification history for a recipe
export async function getRecipeModifications(
  recipeId: string,
  options: GetModificationsOptions = {},
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Build where conditions
    const whereConditions = [eq(recipeModifications.recipeId, recipeId)];

    if (options.changeType) {
      whereConditions.push(
        eq(recipeModifications.changeType, options.changeType),
      );
    }

    if (options.userId) {
      whereConditions.push(eq(recipeModifications.userId, options.userId));
    }

    const baseQuery = db
      .select({
        id: recipeModifications.id,
        recipeId: recipeModifications.recipeId,
        userId: recipeModifications.userId,
        userName: users.name,
        changeType: recipeModifications.changeType,
        changeDescription: recipeModifications.changeDescription,
        oldValue: recipeModifications.oldValue,
        newValue: recipeModifications.newValue,
        versionNumber: recipeModifications.versionNumber,
        createdAt: recipeModifications.createdAt,
      })
      .from(recipeModifications)
      .leftJoin(users, eq(recipeModifications.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(recipeModifications.versionNumber));

    const modifications = await (options.limit
      ? baseQuery.limit(options.limit)
      : baseQuery);

    logger.info(
      {
        recipeId,
        count: modifications.length,
        options,
      },
      "Retrieved recipe modifications",
    );

    return {
      success: true,
      modifications: modifications.map(
        (mod: typeof recipeModifications.$inferSelect) => ({
          ...mod,
          createdAt:
            typeof mod.createdAt === "number"
              ? new Date(mod.createdAt * 1000)
              : mod.createdAt instanceof Date
                ? mod.createdAt
                : new Date(mod.createdAt),
        }),
      ),
    };
  } catch (error) {
    logError(logger, "Failed to get recipe modifications", error, {
      recipeId,
      options,
    });
    return { success: false, error: "Failed to retrieve modification history" };
  }
}

// Get all modifications for a user
export async function getUserRecipeModifications(
  userId?: string,
  options: { limit?: number } = {},
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const targetUserId = userId || session.user.id;

  try {
    const baseQuery = db
      .select({
        id: recipeModifications.id,
        recipeId: recipeModifications.recipeId,
        recipeTitle: recipes.title,
        changeType: recipeModifications.changeType,
        changeDescription: recipeModifications.changeDescription,
        versionNumber: recipeModifications.versionNumber,
        createdAt: recipeModifications.createdAt,
      })
      .from(recipeModifications)
      .innerJoin(recipes, eq(recipeModifications.recipeId, recipes.id))
      .where(eq(recipeModifications.userId, targetUserId))
      .orderBy(desc(recipeModifications.createdAt));

    const modifications = await (options.limit
      ? baseQuery.limit(options.limit)
      : baseQuery);

    logger.info(
      {
        userId: targetUserId,
        count: modifications.length,
      },
      "Retrieved user recipe modifications",
    );

    return {
      success: true,
      modifications: modifications.map((mod) => ({
        ...mod,
        createdAt:
          typeof mod.createdAt === "number"
            ? new Date(mod.createdAt * 1000)
            : mod.createdAt instanceof Date
              ? mod.createdAt
              : new Date(mod.createdAt),
      })),
    };
  } catch (error) {
    logError(logger, "Failed to get user recipe modifications", error, {
      userId: targetUserId,
    });
    return { success: false, error: "Failed to retrieve user modifications" };
  }
}

// Get specific modification by ID
export async function getRecipeModification(modificationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const modification = await db
      .select({
        id: recipeModifications.id,
        recipeId: recipeModifications.recipeId,
        userId: recipeModifications.userId,
        userName: users.name,
        changeType: recipeModifications.changeType,
        changeDescription: recipeModifications.changeDescription,
        oldValue: recipeModifications.oldValue,
        newValue: recipeModifications.newValue,
        versionNumber: recipeModifications.versionNumber,
        createdAt: recipeModifications.createdAt,
        recipeTitle: recipes.title,
      })
      .from(recipeModifications)
      .leftJoin(users, eq(recipeModifications.userId, users.id))
      .innerJoin(recipes, eq(recipeModifications.recipeId, recipes.id))
      .where(eq(recipeModifications.id, modificationId))
      .limit(1);

    if (modification.length === 0) {
      return { success: false, error: "Modification not found" };
    }

    const result = {
      ...modification[0],
      createdAt:
        typeof modification[0].createdAt === "number"
          ? new Date(modification[0].createdAt * 1000)
          : modification[0].createdAt instanceof Date
            ? modification[0].createdAt
            : new Date(modification[0].createdAt),
    };

    logger.info(
      {
        modificationId,
        recipeId: result.recipeId,
        changeType: result.changeType,
      },
      "Retrieved recipe modification",
    );

    return { success: true, modification: result };
  } catch (error) {
    logError(logger, "Failed to get recipe modification", error, {
      modificationId,
    });
    return { success: false, error: "Failed to retrieve modification" };
  }
}

// Delete a modification record (admin/owner only)
export async function deleteRecipeModification(modificationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // First check if the modification exists and user owns it or the recipe
    const modification = await db
      .select({
        id: recipeModifications.id,
        userId: recipeModifications.userId,
        recipeId: recipeModifications.recipeId,
      })
      .from(recipeModifications)
      .where(eq(recipeModifications.id, modificationId))
      .limit(1);

    if (modification.length === 0) {
      return { success: false, error: "Modification not found" };
    }

    // Check if user owns the modification or the recipe
    const recipe = await db
      .select({ userId: recipes.userId })
      .from(recipes)
      .where(eq(recipes.id, modification[0].recipeId))
      .limit(1);

    const canDelete =
      modification[0].userId === session.user.id ||
      (recipe.length > 0 && recipe[0].userId === session.user.id);

    if (!canDelete) {
      return {
        success: false,
        error: "Not authorized to delete this modification",
      };
    }

    await db
      .delete(recipeModifications)
      .where(eq(recipeModifications.id, modificationId));

    logger.info(
      {
        modificationId,
        recipeId: modification[0].recipeId,
        userId: session.user.id,
      },
      "Recipe modification deleted",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete recipe modification", error, {
      modificationId,
    });
    return { success: false, error: "Failed to delete modification" };
  }
}

// Get modification statistics for a recipe
export async function getRecipeModificationStats(recipeId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const stats = await db
      .select({
        changeType: recipeModifications.changeType,
        count: recipeModifications.id,
      })
      .from(recipeModifications)
      .where(eq(recipeModifications.recipeId, recipeId));

    const changeTypeCounts = (
      stats as Array<{ changeType: RecipeChangeType; count: string }>
    ).reduce(
      (acc: Record<string, number>, stat) => {
        acc[stat.changeType] = (acc[stat.changeType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalModifications = stats.length;
    const latestModification = await db
      .select({
        versionNumber: recipeModifications.versionNumber,
        createdAt: recipeModifications.createdAt,
      })
      .from(recipeModifications)
      .where(eq(recipeModifications.recipeId, recipeId))
      .orderBy(desc(recipeModifications.versionNumber))
      .limit(1);

    logger.info(
      {
        recipeId,
        totalModifications,
        changeTypeCounts,
      },
      "Retrieved recipe modification stats",
    );

    return {
      success: true,
      stats: {
        totalModifications,
        changeTypeCounts,
        currentVersion: latestModification[0]?.versionNumber || 0,
        lastModified: latestModification[0]
          ? typeof latestModification[0].createdAt === "number"
            ? new Date(latestModification[0].createdAt * 1000)
            : latestModification[0].createdAt instanceof Date
              ? latestModification[0].createdAt
              : new Date(latestModification[0].createdAt)
          : null,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get recipe modification stats", error, {
      recipeId,
    });
    return { success: false, error: "Failed to retrieve modification stats" };
  }
}
