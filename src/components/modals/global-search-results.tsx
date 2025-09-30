"use client";

import { ArrowRight, Search } from "lucide-react";
import { GlobalSearchResultCard } from "@/components/modals/global-search-result-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecipeWithDetails } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";

interface GlobalSearchResultsProps {
  query: string;
  results: RecipeWithDetails[];
  isSearching: boolean;
  isPending: boolean;
  hasCompletedSearch: boolean;
  selectedIndex: number;
  currentUserId?: string;
  onSelectResult: (result: RecipeWithDetails) => void;
  onViewAllResults: () => void;
  className?: string;
}

export function GlobalSearchResults({
  query,
  results,
  isSearching,
  isPending,
  hasCompletedSearch,
  selectedIndex,
  currentUserId,
  onSelectResult,
  onViewAllResults,
  className,
}: GlobalSearchResultsProps) {
  const showResults = query.trim().length > 0;
  const hasResults = results.length > 0;
  const skeleton = (
    <div className={cn("space-y-3 p-2", className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={`search-loading-${index}`}
          className="flex items-center gap-3 p-3"
        >
          <Skeleton className="w-12 h-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-8 ml-auto" />
            <Skeleton className="h-3 w-6 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!showResults) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Start typing to search your recipes...</p>
        <p className="text-xs mt-1">
          Search across titles, ingredients, instructions, and notes
        </p>
      </div>
    );
  }

  if (isSearching) {
    return skeleton;
  }

  if (!hasResults && hasCompletedSearch) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-foreground mb-2">
          No recipes found for "{query}"
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Try different search terms or browse all recipes
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewAllResults}
          className="text-xs"
        >
          View All Recipes
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    );
  }

  if (!hasResults || isPending || !hasCompletedSearch) {
    return skeleton;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="space-y-1 p-2" role="listbox">
        {results.map((recipe, index) => (
          <GlobalSearchResultCard
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedIndex === index}
            currentUserId={currentUserId}
            onClick={() => onSelectResult(recipe)}
            searchQuery={query}
          />
        ))}
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAllResults}
          className="w-full justify-between text-xs h-8"
        >
          <span>See all results for "{query}"</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
