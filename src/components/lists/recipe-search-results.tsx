import { ChefHat, Search } from "lucide-react";
import Link from "next/link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchRecipes } from "@/lib/search/recipe-search";
import { type RecipeDifficulty, SortOrder, ViewMode } from "@/lib/types";
import type { RecipeSearchParams } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";

// Extract union types for type safety
type RecipeSortBy = NonNullable<RecipeSearchParams["sortBy"]>;

interface RecipeSearchResultsProps {
  searchParams: {
    q?: string;
    cuisine?: string;
    difficulty?: string;
    tags?: string;
    view?: ViewMode;
    sort?: string;
  };
  userId: string;
}

export async function RecipeSearchResults({
  searchParams,
  userId,
}: RecipeSearchResultsProps) {
  const searchQuery = searchParams.q || "";
  const cuisine = searchParams.cuisine;
  const difficulty = searchParams.difficulty;
  const tags = searchParams.tags?.split(",").filter(Boolean);
  const view = searchParams.view || ViewMode.CARDS;
  const sortBy = searchParams.sort || "createdAt";

  const searchResult = await searchRecipes(userId, {
    query: searchQuery,
    cuisine: cuisine ? [cuisine] : undefined,
    difficulty: difficulty ? [difficulty as RecipeDifficulty] : undefined,
    tags,
    sortBy: sortBy as RecipeSortBy,
    sortOrder: SortOrder.DESC,
    limit: 50,
    offset: 0,
  }).catch(() => ({
    recipes: [],
    total: 0,
    hasMore: false,
    filters: { cuisines: [], difficulties: [], tags: [] },
  }));

  // Convert RecipeWithDetails to RecipeListItem format
  const recipes = searchResult.recipes.map((recipe) => ({
    ...recipe,
    heroImage: recipe.images?.find((img) => img.isHero) || recipe.images?.[0],
    ingredientCount: recipe.ingredients?.length || 0,
    instructionCount: recipe.instructions?.length || 0,
    imageCount: recipe.images?.length || 0,
    averageRating: undefined, // Add rating logic if available
  }));
  const hasSearchTerm = searchQuery.trim().length > 0;
  const hasFilters = Boolean(cuisine || difficulty || tags?.length);
  const hasResults = recipes.length > 0;

  // No results found
  if (!hasResults) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  {hasSearchTerm || hasFilters
                    ? "No recipes found"
                    : "No recipes yet"}
                </h2>
                <div className="text-muted-foreground max-w-md space-y-1">
                  {hasSearchTerm || hasFilters ? (
                    <>
                      <p>
                        {hasSearchTerm && <>No recipes match "{searchQuery}"</>}
                        {hasFilters &&
                          hasSearchTerm &&
                          "with the selected filters"}
                        {hasFilters &&
                          !hasSearchTerm &&
                          "No recipes match the selected filters"}
                      </p>
                      <p className="text-sm">
                        Try adjusting your search terms or filters to find more
                        recipes.
                      </p>
                    </>
                  ) : (
                    <p>
                      Start building your recipe collection by adding your first
                      recipe.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {hasSearchTerm || hasFilters ? (
                  <Button variant="outline" asChild>
                    <Link href="/search">Clear Search</Link>
                  </Button>
                ) : null}
                <Button asChild>
                  <Link href="/recipes/new">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Add Recipe
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show search results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {hasSearchTerm
              ? `Results for "${searchQuery}"`
              : hasFilters
                ? "Filtered Results"
                : "All Recipes"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasSearchTerm || hasFilters ? "Found" : "Showing"} {recipes.length}{" "}
            {recipes.length === 1 ? "recipe" : "recipes"}
            {hasFilters && !hasSearchTerm && " with selected filters"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          view === ViewMode.CARDS &&
            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
          view === ViewMode.GRID &&
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
          view === ViewMode.LIST && "flex flex-col space-y-3",
        )}
      >
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            showAuthor={true}
            currentUserId={userId}
          />
        ))}
      </div>
    </div>
  );
}
