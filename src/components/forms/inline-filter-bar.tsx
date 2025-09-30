"use client";

import { Grid3X3, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { type ActiveFilter, ActiveFilterChips } from "./active-filter-chips";

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

const SORT_OPTIONS = [
  { value: "createdAt", label: "Recently Added" },
  { value: "title", label: "Name A-Z" },
  { value: "prepTimeMinutes", label: "Prep Time" },
  { value: "cookTimeMinutes", label: "Cook Time" },
  { value: "updatedAt", label: "Recently Updated" },
];

interface InlineFilterBarProps {
  currentCuisine: string;
  currentDifficulty: string;
  currentSort: string;
  view: ViewMode;
  activeFilters: ActiveFilter[];
  onFilterChange: (filterType: string, value: string) => void;
  onViewChange: (view: ViewMode) => void;
  onClearFilter: (filterType: string) => void;
  onClearAll: () => void;
  isPending?: boolean;
}

export function InlineFilterBar({
  currentCuisine,
  currentDifficulty,
  currentSort,
  view,
  activeFilters,
  onFilterChange,
  onViewChange,
  onClearFilter,
  onClearAll,
  isPending = false,
}: InlineFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 p-4 bg-muted/30 rounded-lg border border-muted overflow-hidden">
      {/* Left Side: Primary Filters - Desktop */}
      <div className="hidden lg:flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Select
            value={currentCuisine}
            onValueChange={(value) => onFilterChange("cuisine", value)}
          >
            <SelectTrigger
              className={cn(
                "w-44 transition-colors",
                currentCuisine !== "all"
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/20"
                  : "bg-background hover:bg-muted/50",
              )}
            >
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {CUISINE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDifficulty}
            onValueChange={(value) => onFilterChange("difficulty", value)}
          >
            <SelectTrigger
              className={cn(
                "w-44 transition-colors",
                currentDifficulty !== "all"
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/20"
                  : "bg-background hover:bg-muted/50",
              )}
            >
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-0">
          <ActiveFilterChips
            filters={activeFilters}
            onClearFilter={onClearFilter}
            onClearAll={onClearAll}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex flex-col gap-3 lg:hidden min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={currentCuisine}
            onValueChange={(value) => onFilterChange("cuisine", value)}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {CUISINE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDifficulty}
            onValueChange={(value) => onFilterChange("difficulty", value)}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <ActiveFilterChips
            filters={activeFilters}
            onClearFilter={onClearFilter}
            onClearAll={onClearAll}
          />
        </div>
      </div>

      {/* Right Side: Sort & View - All Sizes */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-shrink-0">
        <Select
          value={currentSort}
          onValueChange={(value) => onFilterChange("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-56 lg:w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-lg p-1 flex-shrink-0">
          {[
            { value: "cards", icon: LayoutGrid, label: "Cards" },
            { value: "grid", icon: Grid3X3, label: "Grid" },
            { value: "list", icon: List, label: "List" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={view === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(option.value as ViewMode)}
              className="h-8 px-2 lg:px-3"
              disabled={isPending}
              aria-label={`Switch to ${option.label} view`}
            >
              <option.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
