import { ChefHat, Clock, Star, User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeTags } from "@/components/recipes/recipe-tags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeVariant, SizeVariant } from "@/lib/types";
import type { RecipeListItem, RecipeTag } from "@/lib/types/recipe-types";
import {
  formatTime,
  getDifficultyColor,
  getDifficultyLabel,
} from "@/lib/utils/recipe-utils";
import {
  extractSnippet,
  HighlightedText,
} from "@/lib/utils/search-highlighting";

interface RecipeCardProps {
  recipe: RecipeListItem & {
    user?: {
      id: string;
      name?: string | null;
      email: string;
    };
    tags?: RecipeTag[];
  };
  showImages?: boolean;
  showAuthor?: boolean;
  currentUserId?: string;
  className?: string;
  searchQuery?: string;
}

export function RecipeCard({
  recipe,
  showImages = true,
  showAuthor = false,
  currentUserId,
  className,
  searchQuery,
}: RecipeCardProps) {
  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <Link href={`/recipes/${recipe.slug}`}>
      <Card
        className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col ${className || ""}`}
      >
        {showImages && (
          <div className="bg-muted relative overflow-hidden aspect-video">
            {recipe.heroImage ? (
              <Image
                src={`/api/recipes/images/${recipe.heroImage.filename}`}
                alt={recipe.heroImage.altText || recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground">
                <ChefHat className="h-12 w-12 mb-2 opacity-60" />
                <div className="text-center space-y-1">
                  <div className="text-sm font-medium opacity-80">
                    {recipe.cuisine || "Recipe"}
                  </div>
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1 text-xs opacity-60">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(totalTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col flex-1">
          <CardHeader className="pb-2">
            <div className="space-y-2">
              <CardTitle className="line-clamp-1">
                <HighlightedText
                  text={recipe.title}
                  searchQuery={searchQuery || ""}
                  className="bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-sm"
                />
              </CardTitle>

              {showAuthor && (recipe.user || currentUserId) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>
                    {currentUserId === recipe.userId
                      ? "Your recipe"
                      : recipe.user?.name ||
                        recipe.user?.email.split("@")[0] ||
                        "Unknown"}
                  </span>
                  {recipe.isPublic && currentUserId !== recipe.userId && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5 h-4"
                    >
                      Public
                    </Badge>
                  )}
                </div>
              )}

              {recipe.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  <HighlightedText
                    text={
                      searchQuery
                        ? extractSnippet(recipe.description, searchQuery, 150)
                        : recipe.description
                    }
                    searchQuery={searchQuery || ""}
                    className="bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-sm"
                  />
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-4">
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
              </div>

              {recipe.averageRating && recipe.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{recipe.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {recipe.tags && recipe.tags.length > 0 ? (
                  <RecipeTags
                    tags={recipe.tags}
                    variant={BadgeVariant.OUTLINE}
                    size={SizeVariant.SM}
                    className="flex-wrap"
                  />
                ) : recipe.cuisine ? (
                  <Badge variant="outline" className="text-xs">
                    {recipe.cuisine}
                  </Badge>
                ) : null}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {recipe.ingredientCount > 0 && (
                  <span>{recipe.ingredientCount} ingredients</span>
                )}
                {recipe.instructionCount > 0 && (
                  <span>{recipe.instructionCount} steps</span>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
