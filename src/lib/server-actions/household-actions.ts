"use server";

import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { recipeFavorites, recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { visibleTo } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import type {
  HouseholdMember,
  HouseholdMemberOverview,
  NavCounts,
} from "@/lib/types";
import { isNextRedirectError } from "@/lib/utils";

const logger = createOperationLogger("household-actions");

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  try {
    await getAuthenticatedUser();
    return await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .orderBy(asc(users.createdAt));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load household members", error);
    return [];
  }
}

export async function getNavCounts(): Promise<NavCounts> {
  try {
    const user = await getAuthenticatedUser();
    const [[recipeCount], [favouriteCount]] = await Promise.all([
      db.select({ value: count() }).from(recipes).where(visibleTo(user.id)),
      db
        .select({ value: count() })
        .from(recipeFavorites)
        .where(eq(recipeFavorites.userId, user.id)),
    ]);
    return {
      recipes: recipeCount?.value ?? 0,
      favourites: favouriteCount?.value ?? 0,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load navigation counts", error);
    return { recipes: 0, favourites: 0 };
  }
}

export async function getHouseholdOverview(): Promise<
  HouseholdMemberOverview[]
> {
  try {
    await getAuthenticatedUser();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        joinedAt: users.createdAt,
        sharedRecipes: count(recipes.id),
      })
      .from(users)
      .leftJoin(
        recipes,
        and(
          eq(recipes.userId, users.id),
          eq(recipes.isPublic, true),
          eq(recipes.isArchived, false),
        ),
      )
      .groupBy(users.id)
      .orderBy(asc(users.createdAt));
    return rows;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load household overview", error);
    return [];
  }
}
