import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeNotes,
  recipes,
  recipeTagRelations,
  recipeTags,
  userSearchHistory,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  parseSearchTerms,
  recipeMatchesTerms,
  titleMatchRank,
} from "@/lib/search/recipe-text-search";
import type { RecipeDifficulty } from "@/lib/types";
import type {
  RecipeSearchResult,
  RecipeWithDetails,
} from "@/lib/types/recipe-types";
import type { RecipeSearchParams } from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("recipe-search");

export async function searchRecipes(
  userId: string,
  searchParams: RecipeSearchParams,
): Promise<RecipeSearchResult> {
  try {
    logger.info({ userId, searchParams }, "Starting recipe search");

    const {
      query,
      cuisine,
      difficulty,
      tags: searchTags,
      maxPrepTime,
      maxCookTime,
      maxTotalTime,
      authorId,
      recipeIds,
      recordHistory = true,
      servings,
      isPublic,
      sortBy,
      sortOrder,
      limit,
      offset,
    } = searchParams;

    // Build the base query
    const baseQuery = db
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
        swatch: recipes.swatch,
        sourceUrl: recipes.sourceUrl,
        sourceName: recipes.sourceName,
        videoUrl: recipes.videoUrl,
        isPublic: recipes.isPublic,
        isArchived: recipes.isArchived,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        // Calculate total time
        totalTimeMinutes: sql<number>`COALESCE(${recipes.prepTimeMinutes}, 0) + COALESCE(${recipes.cookTimeMinutes}, 0)`,
        // Add user info
        userName: users.name,
        userEmail: users.email,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.userId, users.id));

    // Build WHERE conditions
    const conditions = [
      eq(recipes.isArchived, false),
      sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
    ];

    if (isPublic !== undefined) {
      conditions.push(eq(recipes.isPublic, isPublic));
    }

    if (authorId) {
      conditions.push(eq(recipes.userId, authorId));
    }

    if (recipeIds) {
      if (recipeIds.length === 0) {
        return {
          recipes: [],
          total: 0,
          hasMore: false,
          filters: { cuisines: [], difficulties: [], tags: [] },
        };
      }
      conditions.push(inArray(recipes.id, recipeIds));
    }

    const searchTerms = parseSearchTerms(query ?? "");
    const matchesTerms = recipeMatchesTerms(searchTerms);
    if (matchesTerms) {
      conditions.push(matchesTerms);
    }

    // Filter by cuisine
    if (cuisine && cuisine.length > 0) {
      conditions.push(inArray(recipes.cuisine, cuisine));
    }

    // Filter by difficulty
    if (difficulty && difficulty.length > 0) {
      conditions.push(inArray(recipes.difficulty, difficulty));
    }

    // Filter by prep time
    if (maxPrepTime) {
      conditions.push(
        sql`COALESCE(${recipes.prepTimeMinutes}, 0) <= ${maxPrepTime}`,
      );
    }

    // Filter by cook time
    if (maxCookTime) {
      conditions.push(
        sql`COALESCE(${recipes.cookTimeMinutes}, 0) <= ${maxCookTime}`,
      );
    }

    if (maxTotalTime) {
      conditions.push(
        sql`(COALESCE(${recipes.prepTimeMinutes}, 0) + COALESCE(${recipes.cookTimeMinutes}, 0)) BETWEEN 1 AND ${maxTotalTime}`,
      );
    }

    // Filter by servings
    if (servings) {
      conditions.push(eq(recipes.servings, servings));
    }

    // Filter by tags if provided
    if (searchTags && searchTags.length > 0) {
      const taggedRecipes = db
        .select({ recipeId: recipeTagRelations.recipeId })
        .from(recipeTagRelations)
        .innerJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
        .where(inArray(recipeTags.name, searchTags))
        .groupBy(recipeTagRelations.recipeId)
        .having(sql`COUNT(DISTINCT ${recipeTags.id}) = ${searchTags.length}`);

      const taggedRecipeIds = await taggedRecipes;
      if (taggedRecipeIds.length > 0) {
        conditions.push(
          inArray(
            recipes.id,
            taggedRecipeIds.map((r) => r.recipeId),
          ),
        );
      } else {
        // No recipes match all tags, return empty result
        return {
          recipes: [],
          total: 0,
          hasMore: false,
          filters: {
            cuisines: [],
            difficulties: [],
            tags: [],
          },
        };
      }
    }

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(recipes)
      .where(and(...conditions));

    const [totalResult] = await totalQuery;
    const total = totalResult?.count || 0;

    // Apply sorting
    const sortColumn =
      sortBy === "relevance"
        ? null
        : {
            title: recipes.title,
            createdAt: recipes.createdAt,
            updatedAt: recipes.updatedAt,
            prepTimeMinutes: recipes.prepTimeMinutes,
            cookTimeMinutes: recipes.cookTimeMinutes,
            difficulty: recipes.difficulty,
            totalTime: sql`COALESCE(${recipes.prepTimeMinutes}, 0) + COALESCE(${recipes.cookTimeMinutes}, 0)`,
            averageRating: sql`(SELECT AVG(${recipeNotes.rating}) FROM ${recipeNotes} WHERE ${recipeNotes.recipeId} = ${recipes.id})`,
          }[sortBy];

    // Build final query with conditions and sorting
    const finalQuery = baseQuery.where(and(...conditions));

    let searchResults: Awaited<ReturnType<typeof finalQuery.limit>>;
    if (sortColumn) {
      searchResults = await finalQuery
        .orderBy(sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset);
    } else if (searchTerms.length > 0) {
      searchResults = await finalQuery
        .orderBy(titleMatchRank(searchTerms), desc(recipes.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      searchResults = await finalQuery.limit(limit).offset(offset);
    }

    // Get detailed recipe data with ingredients, instructions, etc.
    const detailedRecipes: RecipeWithDetails[] = [];

    for (const recipe of searchResults) {
      // Get ingredients
      const ingredients = await db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipe.id))
        .orderBy(asc(recipeIngredients.sortOrder));

      // Get instructions
      const instructions = await db
        .select()
        .from(recipeInstructions)
        .where(eq(recipeInstructions.recipeId, recipe.id))
        .orderBy(asc(recipeInstructions.stepNumber));

      // Get tags
      const tags = await db
        .select({
          id: recipeTags.id,
          name: recipeTags.name,
          color: recipeTags.color,
          category: recipeTags.category,
          createdAt: recipeTags.createdAt,
        })
        .from(recipeTags)
        .innerJoin(
          recipeTagRelations,
          eq(recipeTags.id, recipeTagRelations.tagId),
        )
        .where(eq(recipeTagRelations.recipeId, recipe.id));

      // Get images
      const images = await db
        .select()
        .from(recipeImages)
        .where(eq(recipeImages.recipeId, recipe.id))
        .orderBy(asc(recipeImages.sortOrder));

      detailedRecipes.push({
        ...recipe,
        ingredients,
        instructions,
        tags,
        images,
        notes: [], // Notes can be added later if needed for search results
        user: recipe.userName
          ? {
              id: recipe.userId,
              name: recipe.userName,
              email: recipe.userEmail,
            }
          : undefined,
      } as RecipeWithDetails);
    }

    const trimmedQuery = query?.trim();
    if (trimmedQuery && recordHistory) {
      const normalizedQuery = trimmedQuery.toLowerCase();
      try {
        await db
          .insert(userSearchHistory)
          .values({
            userId,
            query: normalizedQuery,
            resultsCount: total,
            runCount: 1,
            lastSearchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userSearchHistory.userId, userSearchHistory.query],
            set: {
              resultsCount: total,
              runCount: sql`${userSearchHistory.runCount} + 1`,
              lastSearchedAt: new Date(),
            },
          });
      } catch (historyError) {
        logger.warn(
          {
            userId,
            query: normalizedQuery,
            error: historyError,
          },
          "Failed to persist search history",
        );
      }
    }

    // Get available filters
    const [availableCuisines, availableDifficulties, availableTags] =
      await Promise.all([
        db
          .selectDistinct({ cuisine: recipes.cuisine })
          .from(recipes)
          .where(
            and(
              eq(recipes.isArchived, false),
              sql`${recipes.cuisine} IS NOT NULL AND ${recipes.cuisine} != ''`,
            ),
          ),

        db
          .selectDistinct({ difficulty: recipes.difficulty })
          .from(recipes)
          .where(
            and(
              eq(recipes.isArchived, false),
              sql`${recipes.difficulty} IS NOT NULL`,
            ),
          ),

        db.select().from(recipeTags).orderBy(asc(recipeTags.name)),
      ]);

    logger.info(
      {
        userId,
        resultsCount: detailedRecipes.length,
        total,
        query: searchParams.query,
      },
      "Recipe search completed",
    );

    return {
      recipes: detailedRecipes,
      total,
      hasMore: offset + limit < total,
      filters: {
        cuisines: availableCuisines
          .map((c) => c.cuisine)
          .filter((c): c is string => Boolean(c)),
        difficulties: availableDifficulties
          .map((d) => d.difficulty)
          .filter((d): d is RecipeDifficulty => Boolean(d)),
        tags: availableTags,
      },
    };
  } catch (error) {
    logError(logger, "Recipe search failed", error, { userId, searchParams });
    throw error;
  }
}
