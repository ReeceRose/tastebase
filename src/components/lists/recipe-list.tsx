"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RecipeCard } from "@/components/cards/recipe-card";
import { RecipeFilters } from "@/components/lists/recipe-filters";
import { RecipeSearchBar } from "@/components/lists/recipe-search-bar";
import { RecipeSortOptions } from "@/components/lists/recipe-sort-options";
import { RecipeCardGridSkeleton } from "@/components/skeletons/recipe-card-skeleton";
import { Button } from "@/components/ui/button";
import { getUserRecipes } from "@/lib/server-actions/recipe-actions";
import { type RecipeDifficulty, SortOrder } from "@/lib/types";
import type {
  RecipeListItem,
  RecipeSearchParams,
} from "@/lib/types/recipe-types";

// Extract union types for type safety
type RecipeSortBy = NonNullable<RecipeSearchParams["sortBy"]>;
type RecipeSortOrder = NonNullable<RecipeSearchParams["sortOrder"]>;

interface RecipeListProps {
  initialRecipes?: RecipeListItem[];
  searchParams?: RecipeSearchParams;
  currentUserId?: string;
  showAuthor?: boolean;
}

export function RecipeList({
  initialRecipes = [],
  searchParams = {},
  currentUserId,
  showAuthor = false,
}: RecipeListProps) {
  const router = useRouter();

  const [recipes, setRecipes] = useState<RecipeListItem[]>(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearchParams, setCurrentSearchParams] =
    useState<RecipeSearchParams>(searchParams);

  const [searchQuery, setSearchQuery] = useState(searchParams.query || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(
    searchParams.difficulty?.[0] || "all",
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string>(
    searchParams.cuisine?.[0] || "all",
  );
  const [sortBy, setSortBy] = useState(searchParams.sortBy || "updatedAt");
  const [sortOrder, setSortOrder] = useState(
    searchParams.sortOrder || SortOrder.DESC,
  );

  const updateURLParams = useCallback(
    (params: RecipeSearchParams) => {
      const newSearchParams = new URLSearchParams();

      if (params.query?.trim()) {
        newSearchParams.set("search", params.query.trim());
      }
      if (params.difficulty?.length) {
        newSearchParams.set("difficulty", params.difficulty[0]);
      }
      if (params.cuisine?.length && params.cuisine[0] !== "all") {
        newSearchParams.set("cuisine", params.cuisine[0]);
      }
      if (params.sortBy && params.sortBy !== "updatedAt") {
        newSearchParams.set("sortBy", params.sortBy);
      }
      if (params.sortOrder && params.sortOrder !== SortOrder.DESC) {
        newSearchParams.set("sortOrder", params.sortOrder);
      }

      const newURL = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;

      router.replace(newURL, { scroll: false });
    },
    [router],
  );

  const loadRecipes = useCallback(
    async (params: RecipeSearchParams, append = false) => {
      setLoading(true);
      try {
        const result = await getUserRecipes(params);

        if (result.success && result.data) {
          const recipesWithCounts = result.data.recipes.map((recipe) => ({
            ...recipe,
            ingredientCount: 0,
            instructionCount: 0,
            imageCount: 0,
          }));
          setRecipes((prev) =>
            append ? [...prev, ...recipesWithCounts] : recipesWithCounts,
          );
          setHasMore(result.data.hasMore);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const applyFilters = () => {
    const newParams: RecipeSearchParams = {
      ...currentSearchParams,
      query: searchQuery?.trim() || undefined,
      difficulty:
        selectedDifficulty && selectedDifficulty !== "all"
          ? [selectedDifficulty as RecipeDifficulty]
          : undefined,
      cuisine:
        selectedCuisine && selectedCuisine !== "all"
          ? [selectedCuisine]
          : undefined,
      sortBy: sortBy as RecipeSortBy,
      sortOrder: sortOrder as RecipeSortOrder,
      offset: 0,
    };

    setCurrentSearchParams(newParams);
    updateURLParams(newParams);
    loadRecipes(newParams);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const newParams = {
        ...currentSearchParams,
        offset: recipes.length,
      };
      loadRecipes(newParams, true);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("");
    setSelectedCuisine("");
    setSortBy("updatedAt");
    setSortOrder(SortOrder.DESC);

    const newParams: RecipeSearchParams = {
      sortBy: "updatedAt",
      sortOrder: SortOrder.DESC,
      offset: 0,
    };

    setCurrentSearchParams(newParams);
    updateURLParams(newParams);
    loadRecipes(newParams);
  };

  useEffect(() => {
    if (initialRecipes.length === 0) {
      loadRecipes(currentSearchParams);
    }
  }, [currentSearchParams, initialRecipes.length, loadRecipes]);

  useEffect(() => {
    if (searchParams && Object.keys(searchParams).length > 0) {
      setCurrentSearchParams(searchParams);

      setSearchQuery(searchParams.query || "");
      setSelectedDifficulty(searchParams.difficulty?.[0] || "all");
      setSelectedCuisine(searchParams.cuisine?.[0] || "all");
      setSortBy(searchParams.sortBy || "updatedAt");
      setSortOrder(searchParams.sortOrder || SortOrder.DESC);

      loadRecipes(searchParams);
    }
  }, [searchParams, loadRecipes]);

  const hasActiveFilters = !!(
    searchQuery ||
    selectedDifficulty ||
    selectedCuisine
  );

  if (loading && recipes.length === 0) {
    return <RecipeCardGridSkeleton count={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <RecipeSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={applyFilters}
          onClear={clearFilters}
          showClearButton={hasActiveFilters}
        />

        <div className="flex flex-wrap gap-4">
          <RecipeFilters
            selectedDifficulty={selectedDifficulty}
            selectedCuisine={selectedCuisine}
            onDifficultyChange={setSelectedDifficulty}
            onCuisineChange={setSelectedCuisine}
            searchQuery={searchQuery}
            showActiveFilters={true}
          />

          <RecipeSortOptions
            sortBy={sortBy}
            sortOrder={sortOrder as SortOrder}
            onSortChange={(field, order) => {
              setSortBy(field as RecipeSortBy);
              setSortOrder(order);
            }}
          />
        </div>
      </div>

      {recipes.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No recipes found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search criteria or create your first recipe
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                showAuthor={showAuthor}
                currentUserId={currentUserId}
                searchQuery={searchQuery}
              />
            ))}
          </div>

          {loading && recipes.length > 0 && (
            <RecipeCardGridSkeleton count={3} />
          )}

          {hasMore && !loading && recipes.length > 0 && (
            <div className="text-center">
              <Button onClick={loadMore} variant="outline">
                Load More Recipes
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
