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
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { RecipeDifficulty } from "@/lib/types";
import type {
  RecipeSearchResult,
  RecipeWithDetails,
} from "@/lib/types/recipe-types";
import type { RecipeSearchParams } from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("optimized-recipe-search");

// Cache for frequently accessed filter data
const filterCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance-optimized search with caching and batched queries
export async function searchRecipesOptimized(
  userId: string,
  searchParams: RecipeSearchParams,
): Promise<RecipeSearchResult> {
  const startTime = Date.now();

  try {
    logger.info({ userId, searchParams }, "Starting optimized recipe search");

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

    // Build optimized base query with necessary joins only
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
        totalTimeMinutes: sql<number>`COALESCE(${recipes.prepTimeMinutes}, 0) + COALESCE(${recipes.cookTimeMinutes}, 0)`,
        userName: users.name,
        userEmail: users.email,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.userId, users.id));

    // Build WHERE conditions efficiently
    const conditions = [
      eq(recipes.isArchived, false),
      isPublic !== undefined
        ? eq(recipes.isPublic, isPublic)
        : sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
    ];

    // Optimized full-text search
    if (query && query.trim().length > 0) {
      const searchTerm = query.trim();

      // Use FTS with better query optimization
      try {
        const ftsQuery = searchTerm
          .split(/\s+/)
          .filter((term) => term.length > 0)
          .map((term) => `"${term.replace(/"/g, '""')}"*`)
          .join(" OR ");

        // Single FTS query with ranking
        const ftsResults = await db.all(sql`
          SELECT id, rank() as rank_score
          FROM recipes_fts 
          WHERE recipes_fts MATCH ${ftsQuery}
          ORDER BY rank
          LIMIT 500
        `);

        if (ftsResults.length > 0) {
          const recipeIds = (ftsResults as Array<{ id: string }>).map(
            (row) => row.id,
          );
          conditions.push(inArray(recipes.id, recipeIds));

          // Note: Relevance sorting will be handled later in the query chain
        } else {
          // Optimized fallback search
          conditions.push(
            sql`(
              ${recipes.title} LIKE ${`%${searchTerm}%`} OR
              ${recipes.description} LIKE ${`%${searchTerm}%`} OR
              ${recipes.cuisine} LIKE ${`%${searchTerm}%`}
            )`,
          );
        }
      } catch (ftsError) {
        logger.warn(
          { error: ftsError, query: searchTerm },
          "FTS query failed, using fallback",
        );
        // Fallback to LIKE search
        conditions.push(
          sql`(
            ${recipes.title} LIKE ${`%${searchTerm}%`} OR
            ${recipes.description} LIKE ${`%${searchTerm}%`} OR
            ${recipes.cuisine} LIKE ${`%${searchTerm}%`}
          )`,
        );
      }
    }

    // Optimized filters
    if (cuisine && cuisine.length > 0) {
      conditions.push(inArray(recipes.cuisine, cuisine));
    }

    if (difficulty && difficulty.length > 0) {
      conditions.push(inArray(recipes.difficulty, difficulty));
    }

    if (maxPrepTime) {
      conditions.push(
        sql`COALESCE(${recipes.prepTimeMinutes}, 0) <= ${maxPrepTime}`,
      );
    }

    if (maxCookTime) {
      conditions.push(
        sql`COALESCE(${recipes.cookTimeMinutes}, 0) <= ${maxCookTime}`,
      );
    }

    if (servings) {
      conditions.push(eq(recipes.servings, servings));
    }

    // Optimized tag filtering with subquery
    if (searchTags && searchTags.length > 0) {
      const taggedRecipeIds = await db
        .select({ recipeId: recipeTagRelations.recipeId })
        .from(recipeTagRelations)
        .innerJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
        .where(inArray(recipeTags.name, searchTags))
        .groupBy(recipeTagRelations.recipeId)
        .having(sql`COUNT(DISTINCT ${recipeTags.id}) = ${searchTags.length}`);

      if (taggedRecipeIds.length > 0) {
        conditions.push(
          inArray(
            recipes.id,
            taggedRecipeIds.map((r) => r.recipeId),
          ),
        );
      } else {
        return {
          recipes: [],
          total: 0,
          hasMore: false,
          filters: await getCachedFilters(userId),
        };
      }
    }

    // Build the final queries with proper typing
    const finalQuery = baseQuery.where(and(...conditions));

    // Build sort order
    let orderByClause:
      | ReturnType<typeof asc>
      | ReturnType<typeof desc>
      | undefined;
    if (sortBy && sortBy !== "relevance") {
      const sortColumn = {
        title: recipes.title,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        prepTimeMinutes: recipes.prepTimeMinutes,
        cookTimeMinutes: recipes.cookTimeMinutes,
        difficulty: recipes.difficulty,
        averageRating: recipes.title, // Placeholder - averageRating would need to be computed
      }[sortBy];

      if (sortColumn) {
        orderByClause =
          sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);
      }
    }

    // Parallel execution of count and results
    const [totalResult, searchResults] = await Promise.all([
      // Count query - optimized to only count, no joins
      db
        .select({ count: count() })
        .from(recipes)
        .where(
          and(...conditions.filter((c) => !c.toString().includes("users"))),
        ),

      // Main query with sorting and pagination
      orderByClause
        ? finalQuery.orderBy(orderByClause).limit(limit).offset(offset)
        : finalQuery.limit(limit).offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;

    // Early return if no results
    if (searchResults.length === 0) {
      return {
        recipes: [],
        total,
        hasMore: false,
        filters: await getCachedFilters(userId),
      };
    }

    // Optimized detail fetching with batched queries
    const recipeIds = searchResults.map((r) => r.id);

    const [ingredients, instructions, tagsData, images] = await Promise.all([
      // Get all ingredients in one query
      db
        .select()
        .from(recipeIngredients)
        .where(inArray(recipeIngredients.recipeId, recipeIds))
        .orderBy(
          asc(recipeIngredients.recipeId),
          asc(recipeIngredients.sortOrder),
        ),

      // Get all instructions in one query
      db
        .select()
        .from(recipeInstructions)
        .where(inArray(recipeInstructions.recipeId, recipeIds))
        .orderBy(
          asc(recipeInstructions.recipeId),
          asc(recipeInstructions.stepNumber),
        ),

      // Get all tags in one query
      db
        .select({
          recipeId: recipeTagRelations.recipeId,
          id: recipeTags.id,
          name: recipeTags.name,
          color: recipeTags.color,
          category: recipeTags.category,
          createdAt: recipeTags.createdAt,
        })
        .from(recipeTagRelations)
        .innerJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
        .where(inArray(recipeTagRelations.recipeId, recipeIds)),

      // Get all images in one query
      db
        .select()
        .from(recipeImages)
        .where(inArray(recipeImages.recipeId, recipeIds))
        .orderBy(asc(recipeImages.recipeId), asc(recipeImages.sortOrder)),
    ]);

    // Group the results by recipe ID for faster lookup
    const ingredientsByRecipe = groupBy(ingredients, "recipeId");
    const instructionsByRecipe = groupBy(instructions, "recipeId");
    const tagsByRecipe = groupBy(tagsData, "recipeId");
    const imagesByRecipe = groupBy(images, "recipeId");

    // Assemble detailed recipes
    const detailedRecipes: RecipeWithDetails[] = searchResults.map(
      (recipe) =>
        ({
          ...recipe,
          ingredients: ingredientsByRecipe[recipe.id] || [],
          instructions: instructionsByRecipe[recipe.id] || [],
          tags:
            tagsByRecipe[recipe.id]?.map((t) => ({
              id: t.id,
              name: t.name,
              color: t.color,
              category: t.category,
              createdAt: t.createdAt,
            })) || [],
          images: imagesByRecipe[recipe.id] || [],
          notes: [], // Empty for search results to save memory
          user: recipe.userName
            ? {
                id: recipe.userId,
                name: recipe.userName,
                email: recipe.userEmail,
              }
            : undefined,
        }) as RecipeWithDetails,
    );

    const searchTime = Date.now() - startTime;

    logger.info(
      {
        userId,
        resultsCount: detailedRecipes.length,
        total,
        query: searchParams.query,
        searchTime,
        hasOptimizations: true,
      },
      "Optimized recipe search completed",
    );

    return {
      recipes: detailedRecipes,
      total,
      hasMore: offset + limit < total,
      filters: await getCachedFilters(userId),
      searchTime, // Include search time for debugging
    };
  } catch (error) {
    logError(logger, "Optimized recipe search failed", error, {
      userId,
      searchParams,
    });
    throw error;
  }
}

// Helper function to group array by key
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}

// Cached filter retrieval to avoid repeated queries
async function getCachedFilters(userId: string): Promise<{
  cuisines: string[];
  difficulties: RecipeDifficulty[];
  tags: Array<{
    name: string;
    id: string;
    createdAt: Date;
    color: string | null;
    category: string | null;
  }>;
}> {
  const cacheKey = `filters:${userId}`;
  const cached = filterCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as {
      cuisines: string[];
      difficulties: RecipeDifficulty[];
      tags: Array<{
        name: string;
        id: string;
        createdAt: Date;
        color: string | null;
        category: string | null;
      }>;
    };
  }

  try {
    const [availableCuisines, availableDifficulties, availableTags] =
      await Promise.all([
        db
          .selectDistinct({ cuisine: recipes.cuisine })
          .from(recipes)
          .where(
            and(
              eq(recipes.isArchived, false),
              sql`${recipes.cuisine} IS NOT NULL AND ${recipes.cuisine} != ''`,
              sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
            ),
          ),

        db
          .selectDistinct({ difficulty: recipes.difficulty })
          .from(recipes)
          .where(
            and(
              eq(recipes.isArchived, false),
              sql`${recipes.difficulty} IS NOT NULL`,
              sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
            ),
          ),

        db
          .select({
            id: recipeTags.id,
            name: recipeTags.name,
            color: recipeTags.color,
            category: recipeTags.category,
            createdAt: recipeTags.createdAt,
            recipeCount: count(recipeTagRelations.recipeId),
          })
          .from(recipeTags)
          .leftJoin(
            recipeTagRelations,
            eq(recipeTags.id, recipeTagRelations.tagId),
          )
          .leftJoin(
            recipes,
            and(
              eq(recipeTagRelations.recipeId, recipes.id),
              eq(recipes.isArchived, false),
              sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
            ),
          )
          .groupBy(
            recipeTags.id,
            recipeTags.name,
            recipeTags.color,
            recipeTags.category,
            recipeTags.createdAt,
          )
          .having(sql`COUNT(${recipeTagRelations.recipeId}) > 0`)
          .orderBy(
            desc(count(recipeTagRelations.recipeId)),
            asc(recipeTags.name),
          ),
      ]);

    const filters = {
      cuisines: (availableCuisines as Array<{ cuisine: string }>)
        .map((c) => c.cuisine)
        .filter(Boolean) as string[],
      difficulties: (
        availableDifficulties as Array<{
          difficulty: RecipeDifficulty;
        }>
      )
        .map((d) => d.difficulty)
        .filter(Boolean) as RecipeDifficulty[],
      tags: availableTags as Array<{
        name: string;
        id: string;
        createdAt: Date;
        color: string | null;
        category: string | null;
      }>,
    };

    // Cache the results
    filterCache.set(cacheKey, {
      data: filters,
      timestamp: Date.now(),
    });

    return filters;
  } catch (error) {
    logError(logger, "Failed to get cached filters", error, { userId });
    // Return empty filters on error
    return {
      cuisines: [],
      difficulties: [],
      tags: [],
    };
  }
}

// Cache cleanup function (can be called periodically)
export function clearFilterCache() {
  filterCache.clear();
}

// Performance monitoring for search queries
export function getSearchPerformanceStats() {
  return {
    cacheSize: filterCache.size,
    cacheTTL: CACHE_TTL,
  };
}

// Search suggestions with caching
export async function getSearchSuggestions(
  userId: string,
  partialQuery: string,
  limit: number = 10,
): Promise<string[]> {
  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const cacheKey = `suggestions:${userId}:${partialQuery.toLowerCase()}`;
  const cached = filterCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as string[];
  }

  try {
    const query = `%${partialQuery.toLowerCase()}%`;

    // Get suggestions from multiple sources
    const [titleSuggestions, cuisineSuggestions, tagSuggestions] =
      await Promise.all([
        // Recipe titles
        db
          .selectDistinct({ suggestion: recipes.title })
          .from(recipes)
          .where(
            and(
              sql`LOWER(${recipes.title}) LIKE ${query}`,
              eq(recipes.isArchived, false),
              sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
            ),
          )
          .limit(5),

        // Cuisines
        db
          .selectDistinct({ suggestion: recipes.cuisine })
          .from(recipes)
          .where(
            and(
              sql`LOWER(${recipes.cuisine}) LIKE ${query}`,
              sql`${recipes.cuisine} IS NOT NULL AND ${recipes.cuisine} != ''`,
              eq(recipes.isArchived, false),
              sql`(${recipes.userId} = ${userId} OR ${recipes.isPublic} = true)`,
            ),
          )
          .limit(3),

        // Tags
        db
          .select({ suggestion: recipeTags.name })
          .from(recipeTags)
          .where(sql`LOWER(${recipeTags.name}) LIKE ${query}`)
          .limit(3),
      ]);

    const suggestions = [
      ...(titleSuggestions as Array<{ suggestion: string }>).map(
        (s) => s.suggestion,
      ),
      ...(cuisineSuggestions as Array<{ suggestion: string }>).map(
        (s) => s.suggestion,
      ),
      ...(tagSuggestions as Array<{ suggestion: string }>).map(
        (s) => s.suggestion,
      ),
    ]
      .filter((s): s is string => Boolean(s))
      .slice(0, limit);

    // Cache suggestions
    filterCache.set(cacheKey, {
      data: suggestions,
      timestamp: Date.now(),
    });

    return suggestions;
  } catch (error) {
    logError(logger, "Failed to get search suggestions", error, {
      userId,
      partialQuery,
    });
    return [];
  }
}
