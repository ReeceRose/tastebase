"use server";

import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipeFavorites, recipes } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-favorites-actions");

export async function addToFavorites(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe exists and user has access (public or user owns it)
    const recipeExists = await db
      .select({
        id: recipes.id,
        userId: recipes.userId,
        isPublic: recipes.isPublic,
      })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          or(
            eq(recipes.isPublic, true), // Public recipes from anyone
            eq(recipes.userId, session.user.id), // User's own recipes
          ),
        ),
      )
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found or access denied" };
    }

    // Check if already favorited
    const existingFavorite = await db
      .select({ id: recipeFavorites.id })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.recipeId, recipeId),
          eq(recipeFavorites.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      return { success: false, error: "Recipe already in favorites" };
    }

    await db.insert(recipeFavorites).values({
      id: nanoid(),
      recipeId,
      userId: session.user.id,
      favoritedAt: new Date(),
    });

    logger.info(
      {
        recipeId,
        userId: session.user.id,
      },
      "Recipe added to favorites successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to add recipe to favorites", error, { recipeId });
    return { success: false, error: "Failed to add recipe to favorites" };
  }
}

export async function removeFromFavorites(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const deletedRows = await db
      .delete(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.recipeId, recipeId),
          eq(recipeFavorites.userId, session.user.id),
        ),
      );

    if (deletedRows.changes === 0) {
      return { success: false, error: "Recipe not in favorites" };
    }

    logger.info(
      {
        recipeId,
        userId: session.user.id,
      },
      "Recipe removed from favorites successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to remove recipe from favorites", error, {
      recipeId,
    });
    return { success: false, error: "Failed to remove recipe from favorites" };
  }
}

export async function toggleFavorite(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Check if already favorited
    const existingFavorite = await db
      .select({ id: recipeFavorites.id })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.recipeId, recipeId),
          eq(recipeFavorites.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // Remove from favorites
      return await removeFromFavorites(recipeId);
    } else {
      // Add to favorites
      return await addToFavorites(recipeId);
    }
  } catch (error) {
    logError(logger, "Failed to toggle recipe favorite", error, { recipeId });
    return { success: false, error: "Failed to toggle recipe favorite" };
  }
}

export async function getUserFavoriteRecipes(userId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const targetUserId = userId || session.user.id;

    const favorites = await db
      .select({
        recipe: recipes,
        favoritedAt: recipeFavorites.favoritedAt,
      })
      .from(recipeFavorites)
      .innerJoin(recipes, eq(recipeFavorites.recipeId, recipes.id))
      .where(
        and(
          eq(recipeFavorites.userId, targetUserId),
          // Only show favorites that are still accessible (public or user's own)
          or(
            eq(recipes.isPublic, true), // Public recipes from anyone
            eq(recipes.userId, session.user.id), // User's own recipes
          ),
        ),
      )
      .orderBy(recipeFavorites.favoritedAt);

    return { success: true, data: favorites };
  } catch (error) {
    logError(logger, "Failed to get user favorite recipes", error, { userId });
    return { success: false, error: "Failed to get favorite recipes" };
  }
}

export async function getRecipeFavoriteStatus(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const favorite = await db
      .select({ id: recipeFavorites.id })
      .from(recipeFavorites)
      .where(
        and(
          eq(recipeFavorites.recipeId, recipeId),
          eq(recipeFavorites.userId, session.user.id),
        ),
      )
      .limit(1);

    return {
      success: true,
      data: { isFavorited: favorite.length > 0 },
    };
  } catch (error) {
    logError(logger, "Failed to get recipe favorite status", error, {
      recipeId,
    });
    return { success: false, error: "Failed to get favorite status" };
  }
}
