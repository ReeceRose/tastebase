"use server";

import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { recipes, recipeTagRelations, recipeTags } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-tags-actions");

export interface TagWithUsage {
  id: string;
  name: string;
  color: string | null;
  category: string | null;
  createdAt: Date;
  recipeCount: number;
}

export interface TagsByCategory {
  [category: string]: TagWithUsage[];
}

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

export async function getTagsByCategory() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const tagsResult = await getAllUserTags();
    if (!tagsResult.success || !tagsResult.data) {
      return tagsResult;
    }

    const tagsByCategory: TagsByCategory = {};

    tagsResult.data.forEach((tag) => {
      const category = tag.category || "uncategorized";
      if (!tagsByCategory[category]) {
        tagsByCategory[category] = [];
      }
      tagsByCategory[category].push(tag);
    });

    return { success: true, data: tagsByCategory };
  } catch (error) {
    logError(logger, "Failed to get tags by category", error);
    return { success: false, error: "Failed to get tags by category" };
  }
}

export async function getRecipesByTag(
  tagId: string,
  limit: number = 20,
  offset: number = 0,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify tag exists and get tag details
    const tagResult = await db
      .select()
      .from(recipeTags)
      .where(eq(recipeTags.id, tagId))
      .limit(1);

    if (!tagResult.length) {
      return { success: false, error: "Tag not found" };
    }

    const tag = tagResult[0];

    // Get recipes with this tag (user's recipes and public recipes)
    const recipesWithTag = await db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        userId: recipes.userId,
        title: recipes.title,
        description: recipes.description,
        servings: recipes.servings,
        prepTimeMinutes: recipes.prepTimeMinutes,
        cookTimeMinutes: recipes.cookTimeMinutes,
        difficulty: recipes.difficulty,
        cuisine: recipes.cuisine,
        sourceUrl: recipes.sourceUrl,
        sourceName: recipes.sourceName,
        isPublic: recipes.isPublic,
        isArchived: recipes.isArchived,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        // Add user info for author display
        userName: users.name,
        userEmail: users.email,
      })
      .from(recipes)
      .innerJoin(
        recipeTagRelations,
        eq(recipes.id, recipeTagRelations.recipeId),
      )
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(
        and(
          eq(recipeTagRelations.tagId, tagId),
          eq(recipes.isArchived, false),
          or(eq(recipes.userId, session.user.id), eq(recipes.isPublic, true)),
        ),
      )
      .orderBy(desc(recipes.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(recipes)
      .innerJoin(
        recipeTagRelations,
        eq(recipes.id, recipeTagRelations.recipeId),
      )
      .where(
        and(
          eq(recipeTagRelations.tagId, tagId),
          eq(recipes.isArchived, false),
          or(eq(recipes.userId, session.user.id), eq(recipes.isPublic, true)),
        ),
      );

    const totalCount = totalCountResult[0]?.count || 0;
    const hasMore = offset + recipesWithTag.length < totalCount;

    // Transform recipes to include user info
    const recipesWithUserInfo = recipesWithTag.map((recipe) => ({
      ...recipe,
      user: recipe.userName
        ? {
            id: recipe.userId,
            name: recipe.userName,
            email: recipe.userEmail,
          }
        : undefined,
    }));

    return {
      success: true,
      data: {
        tag,
        recipes: recipesWithUserInfo,
        totalCount,
        hasMore,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get recipes by tag", error, { tagId });
    return { success: false, error: "Failed to get recipes by tag" };
  }
}

export async function getTagStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const [totalTags, totalRecipesTagged, avgTagsPerRecipe] = await Promise.all(
      [
        // Total unique tags used by user's recipes and public recipes
        db
          .select({ count: sql<number>`count(distinct ${recipeTags.id})` })
          .from(recipeTags)
          .innerJoin(
            recipeTagRelations,
            eq(recipeTags.id, recipeTagRelations.tagId),
          )
          .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
          .where(
            and(
              eq(recipes.isArchived, false),
              or(
                eq(recipes.userId, session.user.id),
                eq(recipes.isPublic, true),
              ),
            ),
          ),

        // Total recipes that have at least one tag (user's + public)
        db
          .select({ count: sql<number>`count(distinct ${recipes.id})` })
          .from(recipes)
          .innerJoin(
            recipeTagRelations,
            eq(recipes.id, recipeTagRelations.recipeId),
          )
          .where(
            and(
              eq(recipes.isArchived, false),
              or(
                eq(recipes.userId, session.user.id),
                eq(recipes.isPublic, true),
              ),
            ),
          ),

        // Average tags per recipe (user's + public)
        db
          .select({
            avg: sql<number>`avg(tag_count)`,
          })
          .from(
            db
              .select({
                recipeId: recipeTagRelations.recipeId,
                tagCount: sql<number>`count(${recipeTagRelations.tagId})`.as(
                  "tag_count",
                ),
              })
              .from(recipeTagRelations)
              .innerJoin(recipes, eq(recipeTagRelations.recipeId, recipes.id))
              .where(
                and(
                  eq(recipes.isArchived, false),
                  or(
                    eq(recipes.userId, session.user.id),
                    eq(recipes.isPublic, true),
                  ),
                ),
              )
              .groupBy(recipeTagRelations.recipeId)
              .as("recipe_tag_counts"),
          ),
      ],
    );

    return {
      success: true,
      data: {
        totalTags: totalTags[0]?.count || 0,
        totalRecipesTagged: totalRecipesTagged[0]?.count || 0,
        avgTagsPerRecipe: Math.round((avgTagsPerRecipe[0]?.avg || 0) * 10) / 10,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get tag stats", error);
    return { success: false, error: "Failed to get tag stats" };
  }
}
