import { Calendar, ChefHat, Clock, Link, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Recipe } from "@/lib/types/recipe-types";
import {
  formatTime,
  getDifficultyColor,
  getDifficultyLabel,
} from "@/lib/utils/recipe-utils";

interface RecipeMetadataProps {
  recipe: Recipe;
  averageRating?: number;
  compact?: boolean;
  className?: string;
}

export function RecipeMetadata({
  recipe,
  averageRating,
  compact = false,
  className,
}: RecipeMetadataProps) {
  if (!recipe) {
    return null;
  }

  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-4 text-sm text-muted-foreground ${className || ""}`}
      >
        {totalTime > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(totalTime)}</span>
          </div>
        )}

        {recipe.servings && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
        )}

        {recipe.difficulty && (
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4" />
            <span className={getDifficultyColor(recipe.difficulty)}>
              {getDifficultyLabel(recipe.difficulty)}
            </span>
          </div>
        )}

        {averageRating && averageRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recipe.prepTimeMinutes && recipe.prepTimeMinutes > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">
                {formatTime(recipe.prepTimeMinutes)}
              </div>
              <div className="text-xs text-muted-foreground">Prep Time</div>
            </div>
          )}

          {recipe.cookTimeMinutes && recipe.cookTimeMinutes > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">
                {formatTime(recipe.cookTimeMinutes)}
              </div>
              <div className="text-xs text-muted-foreground">Cook Time</div>
            </div>
          )}

          {recipe.servings && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{recipe.servings}</div>
              <div className="text-xs text-muted-foreground">Servings</div>
            </div>
          )}

          {recipe.difficulty && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ChefHat className="h-5 w-5 text-muted-foreground" />
              </div>
              <div
                className={`text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}
              >
                {getDifficultyLabel(recipe.difficulty)}
              </div>
              <div className="text-xs text-muted-foreground">Difficulty</div>
            </div>
          )}
        </div>

        {totalTime > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm font-medium">
                Total Time: {formatTime(totalTime)}
              </div>
            </div>
          </div>
        )}

        {(recipe.cuisine ||
          averageRating ||
          recipe.sourceUrl ||
          recipe.sourceName) && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {recipe.cuisine && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cuisine</span>
                <Badge variant="outline">{recipe.cuisine}</Badge>
              </div>
            )}

            {averageRating && averageRating > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {(recipe.sourceUrl || recipe.sourceName) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <div className="flex items-center gap-2">
                  {recipe.sourceName && (
                    <span className="text-sm">{recipe.sourceName}</span>
                  )}
                  {recipe.sourceUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <Link className="h-3 w-3" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {(recipe.createdAt || recipe.updatedAt) && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
            {recipe.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {new Date(recipe.createdAt).toLocaleDateString()}
              </div>
            )}
            {recipe.updatedAt && recipe.updatedAt !== recipe.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated: {new Date(recipe.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
