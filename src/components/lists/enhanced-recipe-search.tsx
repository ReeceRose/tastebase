"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import {
  getSearchRelevance,
  HighlightedText,
} from "@/lib/utils/search-highlighting";

interface EnhancedRecipeSearchProps {
  recipes: RecipeWithRelations[];
  onResultsUpdate: (results: RecipeWithRelations[]) => void;
  placeholder?: string;
  className?: string;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
}

export function EnhancedRecipeSearch({
  recipes,
  onResultsUpdate,
  placeholder = "Search recipes, ingredients, instructions...",
  className,
}: EnhancedRecipeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("recipe-search-history");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    }
  }, []);

  // Save search query to history
  const saveToHistory = useCallback(
    (query: string) => {
      if (!query.trim() || query.length < 3) return;

      const newHistoryItem: SearchHistory = {
        id: `search-${Date.now()}`,
        query: query.trim(),
        timestamp: new Date(),
      };

      const updatedHistory = [
        newHistoryItem,
        ...searchHistory.filter(
          (item) => item.query.toLowerCase() !== query.toLowerCase(),
        ),
      ].slice(0, 10); // Keep only last 10 searches

      setSearchHistory(updatedHistory);
      localStorage.setItem(
        "recipe-search-history",
        JSON.stringify(updatedHistory),
      );
    },
    [searchHistory],
  );

  // Generate search suggestions based on recipe data
  const generateSuggestions = useCallback(
    (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        return;
      }

      const queryLower = query.toLowerCase();
      const allSuggestions = new Set<string>();

      // Add recipe titles
      recipes.forEach((recipe) => {
        if (recipe.title.toLowerCase().includes(queryLower)) {
          allSuggestions.add(recipe.title);
        }
      });

      // Add ingredients
      recipes.forEach((recipe) => {
        recipe.ingredients?.forEach((ingredient) => {
          if (ingredient.name.toLowerCase().includes(queryLower)) {
            allSuggestions.add(ingredient.name);
          }
        });
      });

      // Add cuisines
      recipes.forEach((recipe) => {
        if (recipe.cuisine?.toLowerCase().includes(queryLower)) {
          allSuggestions.add(recipe.cuisine);
        }
      });

      // Add tags
      recipes.forEach((recipe) => {
        recipe.tags?.forEach((tag) => {
          if (tag.name.toLowerCase().includes(queryLower)) {
            allSuggestions.add(tag.name);
          }
        });
      });

      setSuggestions(Array.from(allSuggestions).slice(0, 8));
    },
    [recipes],
  );

  // Perform search with relevance scoring
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        onResultsUpdate(recipes);
        return;
      }

      const _queryLower = query.toLowerCase();

      // Score and filter recipes
      const scoredResults = recipes
        .map((recipe) => {
          let totalScore = 0;

          // Score title match
          totalScore += getSearchRelevance(recipe.title, query, {
            exactMatch: 20,
            wordStart: 10,
            wordContains: 5,
            caseSensitive: 2,
          });

          // Score description match
          if (recipe.description) {
            totalScore += getSearchRelevance(recipe.description, query, {
              exactMatch: 10,
              wordStart: 5,
              wordContains: 2,
              caseSensitive: 1,
            });
          }

          // Score ingredient matches
          recipe.ingredients?.forEach((ingredient) => {
            totalScore += getSearchRelevance(ingredient.name, query, {
              exactMatch: 15,
              wordStart: 8,
              wordContains: 4,
              caseSensitive: 1.5,
            });
          });

          // Score instruction matches
          recipe.instructions?.forEach((instruction) => {
            totalScore += getSearchRelevance(instruction.instruction, query, {
              exactMatch: 8,
              wordStart: 4,
              wordContains: 2,
              caseSensitive: 1,
            });
          });

          // Score cuisine match
          if (recipe.cuisine) {
            totalScore += getSearchRelevance(recipe.cuisine, query, {
              exactMatch: 12,
              wordStart: 6,
              wordContains: 3,
              caseSensitive: 1.5,
            });
          }

          // Score tag matches
          recipe.tags?.forEach((tag) => {
            totalScore += getSearchRelevance(tag.name, query, {
              exactMatch: 10,
              wordStart: 5,
              wordContains: 2,
              caseSensitive: 1,
            });
          });

          return { recipe, score: totalScore };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ recipe }) => recipe);

      onResultsUpdate(scoredResults);
    },
    [recipes, onResultsUpdate],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setShowSuggestions(false);

      if (query.trim()) {
        saveToHistory(query);
        performSearch(query);
      } else {
        onResultsUpdate(recipes);
      }
    },
    [saveToHistory, performSearch, onResultsUpdate, recipes],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    generateSuggestions(value);
    setShowSuggestions(true);

    // Debounced search
    if (value.trim()) {
      const timeoutId = setTimeout(() => performSearch(value), 300);
      return () => clearTimeout(timeoutId);
    } else {
      onResultsUpdate(recipes);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSuggestions([]);
    onResultsUpdate(recipes);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("recipe-search-history");
  };

  return (
    <div className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showSuggestions &&
        (suggestions.length > 0 || searchHistory.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-2 p-4 border shadow-lg">
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Suggestions
                </h4>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => handleSearch(suggestion)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                    >
                      <HighlightedText
                        text={suggestion}
                        searchQuery={searchQuery}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Recent Searches
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.slice(0, 5).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSearch(item.query)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-muted rounded"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

      {searchQuery && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Searching for: {searchQuery}
          </Badge>
        </div>
      )}
    </div>
  );
}
