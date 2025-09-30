"use server";

import { and, desc, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipes, recipeViews } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-tracking-actions");

export async function trackRecipeView(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe exists
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    const now = new Date();

    // Check if user viewed this recipe recently (within last hour)
    // to avoid inflating view counts with rapid refreshes
    const recentView = await db
      .select({ id: recipeViews.id, viewedAt: recipeViews.viewedAt })
      .from(recipeViews)
      .where(
        and(
          eq(recipeViews.recipeId, recipeId),
          eq(recipeViews.userId, session.user.id),
        ),
      )
      .orderBy(desc(recipeViews.viewedAt))
      .limit(1);

    const shouldCreateNewView =
      !recentView.length ||
      (recentView.length > 0 &&
        now.getTime() - new Date(recentView[0].viewedAt).getTime() >
          60 * 60 * 1000); // 1 hour

    if (shouldCreateNewView) {
      await db.insert(recipeViews).values({
        id: nanoid(),
        recipeId,
        userId: session.user.id,
        viewedAt: now,
      });

      logger.info(
        {
          recipeId,
          userId: session.user.id,
        },
        "Recipe view tracked successfully",
      );
    } else {
      // Update the existing view timestamp
      await db
        .update(recipeViews)
        .set({ viewedAt: now })
        .where(
          and(
            eq(recipeViews.recipeId, recipeId),
            eq(recipeViews.userId, session.user.id),
          ),
        );
    }

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to track recipe view", error, { recipeId });
    return { success: false, error: "Failed to track recipe view" };
  }
}

export async function getRecentlyViewedRecipes(limit: number = 10) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const recentViews = await db
      .select({
        recipe: recipes,
        viewedAt: recipeViews.viewedAt,
      })
      .from(recipeViews)
      .innerJoin(recipes, eq(recipeViews.recipeId, recipes.id))
      .where(
        and(
          eq(recipeViews.userId, session.user.id),
          // Only show recent views that are still accessible (public or user's own)
          or(
            eq(recipes.isPublic, true), // Public recipes from anyone
            eq(recipes.userId, session.user.id), // User's own recipes
          ),
        ),
      )
      .orderBy(desc(recipeViews.viewedAt))
      .limit(limit);

    return { success: true, data: recentViews };
  } catch (error) {
    logError(logger, "Failed to get recently viewed recipes", error);
    return { success: false, error: "Failed to get recently viewed recipes" };
  }
}

export async function getRecipeViewStats(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Get total view count for the recipe
    const totalViews = await db
      .select({ count: recipeViews.id })
      .from(recipeViews)
      .where(eq(recipeViews.recipeId, recipeId));

    // Get user's last view time
    const userLastView = await db
      .select({ viewedAt: recipeViews.viewedAt })
      .from(recipeViews)
      .where(
        and(
          eq(recipeViews.recipeId, recipeId),
          eq(recipeViews.userId, session.user.id),
        ),
      )
      .orderBy(desc(recipeViews.viewedAt))
      .limit(1);

    return {
      success: true,
      data: {
        totalViews: totalViews.length,
        lastViewedAt: userLastView[0]?.viewedAt || null,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get recipe view stats", error, { recipeId });
    return { success: false, error: "Failed to get recipe view stats" };
  }
}

export async function clearViewHistory() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db.delete(recipeViews).where(eq(recipeViews.userId, session.user.id));

    logger.info(
      { userId: session.user.id },
      "Recipe view history cleared successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to clear view history", error);
    return { success: false, error: "Failed to clear view history" };
  }
}
