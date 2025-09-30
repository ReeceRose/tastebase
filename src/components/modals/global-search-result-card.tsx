"use client";

import { ChefHat, Clock, User, Users } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { RecipeWithDetails } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import {
  formatTime,
  getDifficultyColor,
  getDifficultyLabel,
} from "@/lib/utils/recipe-utils";
import {
  extractSnippet,
  HighlightedText,
} from "@/lib/utils/search-highlighting";

interface GlobalSearchResultCardProps {
  recipe: RecipeWithDetails;
  isSelected: boolean;
  currentUserId?: string;
  onClick: () => void;
  className?: string;
  searchQuery?: string;
}

export function GlobalSearchResultCard({
  recipe,
  isSelected,
  currentUserId,
  onClick,
  className,
  searchQuery,
}: GlobalSearchResultCardProps) {
  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const heroImage =
    recipe.images?.find((img) => img.isHero) || recipe.images?.[0];
  const isOwnRecipe = currentUserId === recipe.userId;

  // Find the best snippet from all searchable fields
  const getBestSnippet = () => {
    if (!searchQuery?.trim()) return recipe.description || "";

    // Collect all searchable text
    const searchableFields = [
      recipe.description,
      recipe.ingredients
        ?.map((ing) => `${ing.amount || ""} ${ing.unit || ""} ${ing.name}`)
        .join(", "),
      recipe.instructions?.map((inst) => inst.instruction).join(" "),
      recipe.notes?.map((note) => note.content).join(" "),
    ].filter(Boolean);

    // Find which field contains the search term
    for (const field of searchableFields) {
      if (field?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return extractSnippet(field, searchQuery, 100);
      }
    }

    // Fallback to description
    return recipe.description || "";
  };

  const displaySnippet = getBestSnippet();

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors w-full text-left",
        "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isSelected && "bg-muted/50",
        className,
      )}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
    >
      {heroImage && (
        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <Image
            src={`/api/recipes/images/${heroImage.filename}`}
            alt={heroImage.altText || recipe.title}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1 text-foreground">
              <HighlightedText
                text={recipe.title}
                searchQuery={searchQuery || ""}
                className="bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-sm"
              />
            </h3>

            {displaySnippet && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                <HighlightedText
                  text={displaySnippet}
                  searchQuery={searchQuery || ""}
                  className="bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-sm"
                />
              </p>
            )}

            <div className="flex items-center gap-2 mt-1">
              {isOwnRecipe ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Your recipe</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>
                    {recipe.user?.name || recipe.user?.email?.split("@")[0]}
                  </span>
                  {recipe.isPublic && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5 h-4"
                    >
                      Public
                    </Badge>
                  )}
                </div>
              )}

              {recipe.cuisine && (
                <Badge variant="outline" className="text-xs h-4">
                  {recipe.cuisine}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
            {totalTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(totalTime)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{recipe.servings}</span>
                </div>
              )}

              {recipe.difficulty && (
                <div className="flex items-center gap-1">
                  <ChefHat className="h-3 w-3" />
                  <span className={getDifficultyColor(recipe.difficulty)}>
                    {getDifficultyLabel(recipe.difficulty)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
