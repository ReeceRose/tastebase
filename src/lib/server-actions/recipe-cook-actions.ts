"use server";

import { and, count, desc, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { recipeCooks, recipes } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { visibleTo } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import type { RecipeCookSummary } from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";

const logger = createOperationLogger("recipe-cook-actions");

const REPEAT_WINDOW_MS = 2 * 60 * 60 * 1000;

interface CookResult {
  success: boolean;
  recorded: boolean;
  error: string | null;
}

export async function recordRecipeCook(recipeId: string): Promise<CookResult> {
  try {
    const user = await getAuthenticatedUser();

    const [recipe] = await db
      .select({ id: recipes.id, slug: recipes.slug })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), visibleTo(user.id)))
      .limit(1);
    if (!recipe) {
      return { success: false, recorded: false, error: "Recipe not found" };
    }

    const since = new Date(Date.now() - REPEAT_WINDOW_MS);
    const [recent] = await db
      .select({ id: recipeCooks.id })
      .from(recipeCooks)
      .where(
        and(
          eq(recipeCooks.recipeId, recipeId),
          eq(recipeCooks.userId, user.id),
          gte(recipeCooks.cookedAt, since),
        ),
      )
      .limit(1);
    if (recent) {
      return { success: true, recorded: false, error: null };
    }

    await db.insert(recipeCooks).values({
      id: nanoid(),
      recipeId,
      userId: user.id,
      cookedAt: new Date(),
    });

    revalidatePath(`/recipes/${recipe.slug}`);
    revalidatePath("/");
    logger.info({ recipeId, userId: user.id }, "Recorded recipe cook");
    return { success: true, recorded: true, error: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to record recipe cook", error, { recipeId });
    return {
      success: false,
      recorded: false,
      error: "Couldn't mark this recipe as cooked",
    };
  }
}

export async function getRecipeCookSummary(
  recipeId: string,
): Promise<RecipeCookSummary> {
  try {
    await getAuthenticatedUser();
    const [[total], [last]] = await Promise.all([
      db
        .select({ value: count() })
        .from(recipeCooks)
        .where(eq(recipeCooks.recipeId, recipeId)),
      db
        .select({
          cookedAt: recipeCooks.cookedAt,
          userId: users.id,
          userName: users.name,
        })
        .from(recipeCooks)
        .innerJoin(users, eq(recipeCooks.userId, users.id))
        .where(eq(recipeCooks.recipeId, recipeId))
        .orderBy(desc(recipeCooks.cookedAt))
        .limit(1),
    ]);

    return {
      count: total?.value ?? 0,
      lastCookedAt: last?.cookedAt ?? null,
      lastCookedBy: last ? { id: last.userId, name: last.userName } : null,
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load cook summary", error, { recipeId });
    return { count: 0, lastCookedAt: null, lastCookedBy: null };
  }
}
