"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  recipeFavorites,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("dashboard-stats-actions");

export interface DashboardStats {
  totalRecipes: number;
  favoriteRecipes: number;
  uniqueCategories: number;
  recentRecipes: number;
}

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  let session: { user?: { id: string } } | null = null;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const [
      totalRecipesResult,
      favoriteRecipesResult,
      uniqueCategoriesResult,
      recentRecipesResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(recipes)
        .where(eq(recipes.userId, session.user.id)),

      db
        .select({ count: count() })
        .from(recipeFavorites)
        .where(eq(recipeFavorites.userId, session.user.id)),

      db
        .select({ count: sql<number>`count(distinct ${recipeTags.name})` })
        .from(recipeTags)
        .innerJoin(
          recipeTagRelations,
          eq(recipeTags.id, recipeTagRelations.tagId),
        )
        .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
        .where(eq(recipes.userId, session.user.id)),

      db
        .select({ count: count() })
        .from(recipes)
        .where(
          and(
            eq(recipes.userId, session.user.id),
            sql`${recipes.createdAt} >= (unixepoch() - 2592000)`,
          ),
        ),
    ]);

    const stats: DashboardStats = {
      totalRecipes: totalRecipesResult[0]?.count || 0,
      favoriteRecipes: favoriteRecipesResult[0]?.count || 0,
      uniqueCategories: Number(uniqueCategoriesResult[0]?.count || 0),
      recentRecipes: recentRecipesResult[0]?.count || 0,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    logError(logger, "Failed to fetch dashboard statistics", error, {
      userId: session?.user?.id,
    });
    return {
      success: false,
      error: "Failed to fetch dashboard statistics",
    };
  }
}
