import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipes,
  recipeTagRelations,
  recipeTags,
  userSearchHistory,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
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
        sourceUrl: recipes.sourceUrl,
        sourceName: recipes.sourceName,
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
      // User can see their own recipes or public recipes
      isPublic !== undefined
        ? eq(recipes.isPublic, isPublic)
        : sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
    ];

    // Full-text search using FTS if query provided
    if (query && query.trim().length > 0) {
      // Sanitize search terms - remove special characters that can break FTS
      const sanitizeForFts = (term: string) =>
        term.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      const cleanQuery = sanitizeForFts(query);

      if (!cleanQuery) {
        // If query becomes empty after sanitization, skip FTS and use fallback
        const likePattern = `%${query}%`;
        conditions.push(
          sql`(
            ${recipes.title} LIKE ${likePattern} OR
            ${recipes.description} LIKE ${likePattern} OR
            ${recipes.cuisine} LIKE ${likePattern}
          )`,
        );
      } else {
        const searchTerms = cleanQuery.split(/\s+/).filter(Boolean);

        // Create search strategies with proper FTS5 syntax
        const searchStrategies = [];

        // Strategy 1: Exact phrase match (highest relevance)
        if (searchTerms.length === 1) {
          searchStrategies.push(`"${searchTerms[0]}"`);
        } else {
          searchStrategies.push(`"${cleanQuery}"`);
        }

        // Strategy 2: All terms must appear (AND logic)
        if (searchTerms.length > 1) {
          searchStrategies.push(searchTerms.join(" AND "));
        }

        // Strategy 3: Prefix matching for single terms
        if (searchTerms.length === 1 && searchTerms[0].length >= 3) {
          searchStrategies.push(`${searchTerms[0]}*`);
        }

        // Strategy 4: Any term can appear (OR logic) - most fuzzy
        if (searchTerms.length > 1) {
          searchStrategies.push(searchTerms.join(" OR "));
        }

        let ftsResults: Array<{ id: string }> = [];

        for (const strategy of searchStrategies) {
          try {
            ftsResults = (await db.all(sql`
              SELECT id FROM recipes_fts 
              WHERE recipes_fts MATCH ${strategy}
              ORDER BY rank
              LIMIT 100
            `)) as Array<{ id: string }>;

            if (ftsResults.length > 0) {
              break;
            }
          } catch (_error) {}
        }

        if (ftsResults.length > 0) {
          const recipeIds = ftsResults.map((row) => row.id);
          conditions.push(inArray(recipes.id, recipeIds));
        } else {
          // Enhanced fallback with ingredient and instruction search
          const likePattern = `%${query}%`;
          conditions.push(
            sql`(
              ${recipes.title} LIKE ${likePattern} OR
              ${recipes.description} LIKE ${likePattern} OR
              ${recipes.cuisine} LIKE ${likePattern} OR
              EXISTS (
                SELECT 1 FROM recipe_ingredients ri 
                WHERE ri.recipe_id = ${recipes.id} 
                AND (ri.name LIKE ${likePattern} OR ri.notes LIKE ${likePattern})
              ) OR
              EXISTS (
                SELECT 1 FROM recipe_instructions inst 
                WHERE inst.recipe_id = ${recipes.id} 
                AND inst.instruction LIKE ${likePattern}
              ) OR
              EXISTS (
                SELECT 1 FROM recipe_notes rn 
                WHERE rn.recipe_id = ${recipes.id} 
                AND rn.content LIKE ${likePattern}
              )
            )`,
          );
        }
      }
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
            averageRating: recipes.title, // Placeholder - averageRating would need to be computed
          }[sortBy];

    // Build final query with conditions and sorting
    const finalQuery = baseQuery.where(and(...conditions));

    let searchResults: Awaited<ReturnType<typeof finalQuery.limit>>;
    if (sortColumn) {
      searchResults = await finalQuery
        .orderBy(sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn))
        .limit(limit)
        .offset(offset);
    } else {
      searchResults = await finalQuery.limit(limit).offset(offset);
    }

    // Get detailed recipe data with ingredients, instructions, etc.
    const _recipeIds = searchResults.map((r) => r.id);
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
    if (trimmedQuery) {
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
