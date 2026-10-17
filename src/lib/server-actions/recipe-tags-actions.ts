"use server";

import { and, asc, count, desc, eq, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { recipes, recipeTagRelations, recipeTags } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { visibleTo } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import type { TagTileData } from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";
import { resolveSwatch } from "@/lib/utils/swatches";

const logger = createOperationLogger("recipe-tags-actions");

export async function getAllUserTags() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Get all tags used by the user's recipes and public recipes with usage count
    const tagsWithUsage = await db
      .select({
        id: recipeTags.id,
        name: recipeTags.name,
        color: recipeTags.color,
        category: recipeTags.category,
        createdAt: recipeTags.createdAt,
        recipeCount: count(recipeTagRelations.recipeId),
      })
      .from(recipeTags)
      .innerJoin(
        recipeTagRelations,
        eq(recipeTags.id, recipeTagRelations.tagId),
      )
      .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
      .where(
        and(
          eq(recipes.isArchived, false),
          or(eq(recipes.userId, session.user.id), eq(recipes.isPublic, true)),
        ),
      )
      .groupBy(recipeTags.id)
      .orderBy(desc(count(recipeTagRelations.recipeId)));

    return { success: true, data: tagsWithUsage };
  } catch (error) {
    logError(logger, "Failed to get user tags", error);
    return { success: false, error: "Failed to get user tags" };
  }
}

export async function getTagNameById(tagId: string): Promise<string | null> {
  try {
    const [tag] = await db
      .select({ name: recipeTags.name })
      .from(recipeTags)
      .where(eq(recipeTags.id, tagId))
      .limit(1);
    return tag?.name ?? null;
  } catch (error) {
    logError(logger, "Failed to look up tag", error, { tagId });
    return null;
  }
}

const PREVIEW_TITLES = 3;

export async function getTagTiles(): Promise<TagTileData[]> {
  try {
    const user = await getAuthenticatedUser();
    const tags = await db
      .select({
        id: recipeTags.id,
        name: recipeTags.name,
        color: recipeTags.color,
        category: recipeTags.category,
        recipeCount: count(recipeTagRelations.recipeId),
      })
      .from(recipeTags)
      .innerJoin(
        recipeTagRelations,
        eq(recipeTags.id, recipeTagRelations.tagId),
      )
      .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
      .where(visibleTo(user.id))
      .groupBy(recipeTags.id)
      .orderBy(desc(count(recipeTagRelations.recipeId)), asc(recipeTags.name));

    if (tags.length === 0) return [];

    const previews = await db
      .select({ tagId: recipeTagRelations.tagId, title: recipes.title })
      .from(recipeTagRelations)
      .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
      .where(
        and(
          visibleTo(user.id),
          inArray(
            recipeTagRelations.tagId,
            tags.map((tag) => tag.id),
          ),
        ),
      )
      .orderBy(desc(recipes.createdAt));

    const titlesByTag = new Map<string, string[]>();
    for (const preview of previews) {
      const titles = titlesByTag.get(preview.tagId) ?? [];
      if (titles.length < PREVIEW_TITLES) titles.push(preview.title);
      titlesByTag.set(preview.tagId, titles);
    }

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      category: tag.category,
      swatch: resolveSwatch(tag.id, tag.color),
      recipeCount: tag.recipeCount,
      previewTitles: titlesByTag.get(tag.id) ?? [],
    }));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load tag tiles", error);
    return [];
  }
}
