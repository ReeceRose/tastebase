"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

interface RecipeFiltersProps {
  selectedDifficulty: string;
  selectedCuisine: string;
  onDifficultyChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  availableCuisines?: string[];
  showActiveFilters?: boolean;
  searchQuery?: string;
}

export function RecipeFilters({
  selectedDifficulty,
  selectedCuisine,
  onDifficultyChange,
  onCuisineChange,
  availableCuisines = [...RECIPE_CONSTANTS.POPULAR_CUISINES],
  showActiveFilters = false,
  searchQuery,
}: RecipeFiltersProps) {
  const hasActiveFilters = searchQuery || selectedDifficulty || selectedCuisine;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {RECIPE_CONSTANTS.DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCuisine} onValueChange={onCuisineChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Cuisine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {availableCuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showActiveFilters && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary">Search: {searchQuery}</Badge>
          )}
          {selectedDifficulty && selectedDifficulty !== "all" && (
            <Badge variant="secondary">
              Difficulty:{" "}
              {
                RECIPE_CONSTANTS.DIFFICULTY_LEVELS.find(
                  (d) => d.value === selectedDifficulty,
                )?.label
              }
            </Badge>
          )}
          {selectedCuisine && selectedCuisine !== "all" && (
            <Badge variant="secondary">Cuisine: {selectedCuisine}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
