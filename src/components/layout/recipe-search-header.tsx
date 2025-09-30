"use client";

import { Loader2, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { ActiveFilter } from "@/components/forms/active-filter-chips";
import { InlineFilterBar } from "@/components/forms/inline-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearSearchHistory,
  deleteSearchHistoryEntry,
} from "@/lib/server-actions/search-history-actions";
import { ViewMode } from "@/lib/types";

interface RecipeSearchHeaderProps {
  initialQuery?: string;
  initialView?: ViewMode;
  initialHistory?: Array<{
    query: string;
    resultsCount: number;
    runCount: number;
    lastSearchedAt: string;
  }>;
}

const CUISINE_OPTIONS = [
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "asian", label: "Asian" },
  { value: "american", label: "American" },
  { value: "french", label: "French" },
  { value: "indian", label: "Indian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "thai", label: "Thai" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function RecipeSearchHeader({
  initialQuery = "",
  initialView = ViewMode.CARDS,
  initialHistory = [],
}: RecipeSearchHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [view, setView] = useState<ViewMode>(initialView);
  const [recentHistory, setRecentHistory] = useState(initialHistory);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const currentCuisine = searchParams.get("cuisine") || "all";
  const currentDifficulty = searchParams.get("difficulty") || "all";
  const currentSort = searchParams.get("sort") || "createdAt";

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        const next = params.toString();
        router.push(next ? `/search?${next}` : "/search");
      });
    },
    [router, searchParams],
  );

  // Debounced search functionality
  const debouncedSearch = useCallback(
    (query: string) => {
      updateSearchParams({ q: query.trim() || null });
    },
    [updateSearchParams],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300); // 300ms delay - optimal for search UX

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-search handles this now, but keep form for accessibility
  };

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    updateSearchParams({ view: newView });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    updateSearchParams({ [filterType]: value === "all" ? null : value });
  };

  const handleHistorySelect = (historyQuery: string) => {
    if (!historyQuery) return;
    setSearchQuery(historyQuery);
    updateSearchParams({ q: historyQuery });
  };

  useEffect(() => {
    setRecentHistory(initialHistory);
  }, [initialHistory]);

  const clearFilter = (filterType: string) => {
    updateSearchParams({ [filterType]: null });
  };

  const clearAllFilters = () => {
    updateSearchParams({
      q: null,
      cuisine: null,
      difficulty: null,
      sort: null,
    });
    setSearchQuery("");
  };

  const activeFilters: ActiveFilter[] = [
    currentCuisine !== "all" && {
      type: "cuisine",
      value: currentCuisine,
      label:
        CUISINE_OPTIONS.find((o) => o.value === currentCuisine)?.label ||
        currentCuisine,
    },
    currentDifficulty !== "all" && {
      type: "difficulty",
      value: currentDifficulty,
      label:
        DIFFICULTY_OPTIONS.find((o) => o.value === currentDifficulty)?.label ||
        currentDifficulty,
    },
  ].filter(Boolean) as ActiveFilter[];

  const handleClearHistory = () => {
    startClearTransition(async () => {
      const result = await clearSearchHistory();
      if (result.success) {
        setRecentHistory([]);
      }
    });
  };

  const handleDeleteEntry = (entryQuery: string) => {
    if (!entryQuery) return;
    setPendingDelete(entryQuery);
    startDeleteTransition(async () => {
      try {
        const result = await deleteSearchHistoryEntry(entryQuery);
        if (result.success) {
          setRecentHistory((prev) =>
            prev.filter((item) => item.query !== entryQuery),
          );
        }
      } finally {
        setPendingDelete(null);
      }
    });
  };

  const formattedHistory = useMemo(() => {
    return recentHistory.slice(0, 8);
  }, [recentHistory]);

  return (
    <div
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-search-header
    >
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Search Recipes
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Find recipes in your personal collection
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipe name, ingredients, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>
          </form>

          {formattedHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recent searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formattedHistory.map((entry) => (
                  <div
                    key={entry.query}
                    className="flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-1 text-xs text-secondary-foreground"
                  >
                    <button
                      type="button"
                      className="flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => handleHistorySelect(entry.query)}
                    >
                      <span>{entry.query}</span>
                      <span className="text-[10px] text-secondary-foreground/70">
                        {entry.resultsCount} result
                        {entry.resultsCount === 1 ? "" : "s"}
                        {entry.runCount > 1 ? ` · ×${entry.runCount}` : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-secondary-foreground/80 transition hover:bg-secondary-foreground/10 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => handleDeleteEntry(entry.query)}
                      aria-label={`Remove ${entry.query} from search history`}
                      disabled={isDeleting && pendingDelete === entry.query}
                    >
                      {isDeleting && pendingDelete === entry.query ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InlineFilterBar
            currentCuisine={currentCuisine}
            currentDifficulty={currentDifficulty}
            currentSort={currentSort}
            view={view}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onViewChange={handleViewChange}
            onClearFilter={clearFilter}
            onClearAll={clearAllFilters}
            isPending={isPending}
          />
        </div>
      </div>
    </div>
  );
}
