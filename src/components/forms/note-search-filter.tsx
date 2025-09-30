"use client";

import { Calendar, Filter, Search, SortAsc, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { RecipeNote } from "@/lib/types/recipe-types";

export enum NoteSortBy {
  NEWEST = "newest",
  OLDEST = "oldest",
  RATING_HIGH = "rating-high",
  RATING_LOW = "rating-low",
  RELEVANCE = "relevance",
}

export interface NoteFilters {
  searchQuery: string;
  ratingFilter: number[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sortBy: NoteSortBy;
  isPrivateOnly: boolean;
  hasRatingOnly: boolean;
}

export interface NoteSearchFilterProps {
  onFiltersChange: (filters: NoteFilters) => void;
  initialFilters?: Partial<NoteFilters>;
  resultsCount?: number;
  className?: string;
}

const defaultFilters: NoteFilters = {
  searchQuery: "",
  ratingFilter: [],
  dateRange: {},
  sortBy: NoteSortBy.NEWEST,
  isPrivateOnly: false,
  hasRatingOnly: false,
};

export function NoteSearchFilter({
  onFiltersChange,
  initialFilters = {},
  resultsCount,
  className,
}: NoteSearchFilterProps) {
  const [filters, setFilters] = useState<NoteFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  // Debounced search
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, searchQuery }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilters = useCallback((updates: Partial<NoteFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = () => {
    const clearedFilters = { ...defaultFilters };
    setFilters(clearedFilters);
    setSearchQuery("");
  };

  const activeFilterCount = [
    filters.ratingFilter.length > 0,
    filters.dateRange.from || filters.dateRange.to,
    filters.isPrivateOnly,
    filters.hasRatingOnly,
    filters.sortBy !== NoteSortBy.NEWEST,
  ].filter(Boolean).length;

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Filters and Results */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Rating Filters */}
                <DropdownMenuLabel className="text-xs">
                  Rating
                </DropdownMenuLabel>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <DropdownMenuCheckboxItem
                    key={rating}
                    checked={filters.ratingFilter.includes(rating)}
                    onCheckedChange={(checked) => {
                      const newRatingFilter = checked
                        ? [...filters.ratingFilter, rating]
                        : filters.ratingFilter.filter((r) => r !== rating);
                      updateFilters({ ratingFilter: newRatingFilter });
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>
                        {rating} star{rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />

                {/* Content Filters */}
                <DropdownMenuCheckboxItem
                  checked={filters.hasRatingOnly}
                  onCheckedChange={(checked) =>
                    updateFilters({ hasRatingOnly: checked })
                  }
                >
                  Has rating only
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={filters.isPrivateOnly}
                  onCheckedChange={(checked) =>
                    updateFilters({ isPrivateOnly: checked })
                  }
                >
                  Private notes only
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="h-3 w-3 mr-1" />
                  {filters.sortBy === NoteSortBy.NEWEST && "Newest"}
                  {filters.sortBy === NoteSortBy.OLDEST && "Oldest"}
                  {filters.sortBy === NoteSortBy.RATING_HIGH && "Rating: High"}
                  {filters.sortBy === NoteSortBy.RATING_LOW && "Rating: Low"}
                  {filters.sortBy === NoteSortBy.RELEVANCE && "Relevance"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateFilters({ sortBy: NoteSortBy.NEWEST })}
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateFilters({ sortBy: NoteSortBy.OLDEST })}
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: NoteSortBy.RATING_HIGH })
                  }
                >
                  <Star className="h-3 w-3 mr-2" />
                  Highest Rating
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: NoteSortBy.RATING_LOW })
                  }
                >
                  <Star className="h-3 w-3 mr-2" />
                  Lowest Rating
                </DropdownMenuItem>
                {filters.searchQuery && (
                  <DropdownMenuItem
                    onClick={() =>
                      updateFilters({ sortBy: NoteSortBy.RELEVANCE })
                    }
                  >
                    <Search className="h-3 w-3 mr-2" />
                    Relevance
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Results Count */}
          {typeof resultsCount === "number" && (
            <div className="text-sm text-muted-foreground">
              {resultsCount} note{resultsCount !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Active Filter Tags */}
        {(activeFilterCount > 0 || filters.searchQuery) && (
          <>
            <Separator />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">
                Active filters:
              </span>

              {filters.searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{filters.searchQuery}"
                </Badge>
              )}

              {filters.ratingFilter.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Ratings:{" "}
                  {filters.ratingFilter.sort((a, b) => b - a).join(", ")} ⭐
                </Badge>
              )}

              {filters.isPrivateOnly && (
                <Badge variant="secondary" className="text-xs">
                  Private Only
                </Badge>
              )}

              {filters.hasRatingOnly && (
                <Badge variant="secondary" className="text-xs">
                  Has Rating
                </Badge>
              )}

              {filters.sortBy !== NoteSortBy.NEWEST && (
                <Badge variant="secondary" className="text-xs">
                  Sort: {filters.sortBy.replace("-", " ")}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using note filtering logic
export function useNoteFilters(notes: RecipeNote[], filters: NoteFilters) {
  return useCallback(() => {
    let filtered = [...notes];

    // Text search
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((note) =>
        note.content.toLowerCase().includes(query),
      );
    }

    // Rating filter
    if (filters.ratingFilter.length > 0) {
      filtered = filtered.filter(
        (note) => note.rating && filters.ratingFilter.includes(note.rating),
      );
    }

    // Content filters
    if (filters.hasRatingOnly) {
      filtered = filtered.filter((note) => note.rating !== null);
    }

    if (filters.isPrivateOnly) {
      filtered = filtered.filter((note) => note.isPrivate);
    }

    // Date range (if implemented)
    if (filters.dateRange.from) {
      const fromDate = filters.dateRange.from;
      filtered = filtered.filter(
        (note) => new Date(note.createdAt) >= fromDate,
      );
    }

    if (filters.dateRange.to) {
      const toDate = filters.dateRange.to;
      filtered = filtered.filter((note) => new Date(note.createdAt) <= toDate);
    }

    // Sorting
    switch (filters.sortBy) {
      case NoteSortBy.NEWEST:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case NoteSortBy.OLDEST:
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case NoteSortBy.RATING_HIGH:
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case NoteSortBy.RATING_LOW:
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case NoteSortBy.RELEVANCE:
        // Basic relevance scoring based on search query position
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          filtered.sort((a, b) => {
            const aIndex = a.content.toLowerCase().indexOf(query);
            const bIndex = b.content.toLowerCase().indexOf(query);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
        }
        break;
    }

    return filtered;
  }, [notes, filters])();
}
