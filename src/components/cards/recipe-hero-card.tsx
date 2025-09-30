"use client";

import { ChefHat, Clock, Eye, Heart, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RecipeFavoriteButton } from "@/components/ui/recipe-favorite-button";
import { RecipeQuickActions } from "@/components/ui/recipe-quick-actions";
import { RecipeStatusIndicators } from "@/components/ui/recipe-status-indicators";
import { ActionVariant, ButtonVariant, ComponentSize } from "@/lib/types";
import type { RecipeListItem } from "@/lib/types/recipe-types";

interface RecipeHeroCardProps {
  recipe: RecipeListItem;
  showFavorite?: boolean;
  showActions?: boolean;
  className?: string;
  onUpdate?: () => void;
}

export function RecipeHeroCard({
  recipe,
  showFavorite = true,
  showActions = true,
  className,
  onUpdate,
}: RecipeHeroCardProps) {
  const [imageError, setImageError] = useState(false);

  const heroImage =
    recipe.images?.find((img) => img.isHero) || recipe.images?.[0];
  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const tags = recipe.tags?.slice(0, 3) || []; // Show max 3 tags

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
    >
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
          {heroImage && !imageError ? (
            <Image
              src={`/api/recipes/images/${heroImage.filename}`}
              alt={heroImage.altText || recipe.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ChefHat className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status indicators - positioned at top */}
          <div className="absolute top-4 left-4">
            <RecipeStatusIndicators
              createdAt={recipe.createdAt.toISOString()}
              updatedAt={recipe.updatedAt.toISOString()}
              lastViewedAt={recipe.lastViewedAt?.toISOString()}
              isFavorited={recipe.isFavorited}
              averageRating={recipe.averageRating}
              viewCount={recipe.viewCount}
              className="flex-wrap gap-2"
            />
          </div>

          {/* Actions - positioned at top right */}
          {showActions && (
            <div className="absolute top-4 right-4 flex gap-2">
              {showFavorite && (
                <RecipeFavoriteButton
                  recipeId={recipe.id}
                  size={ComponentSize.SM}
                  variant={ButtonVariant.OUTLINE}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                />
              )}
              <RecipeQuickActions
                recipeId={recipe.id}
                recipeTitle={recipe.title}
                variant={ActionVariant.INLINE}
                size={ComponentSize.SM}
                onRecipeDeleted={onUpdate}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
              />
            </div>
          )}
        </div>

        {/* Content overlay - positioned at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="space-y-4">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="bg-white/20 text-white border-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <div>
              <Link href={`/recipes/${recipe.slug}`} className="group/title">
                <h2 className="text-2xl md:text-3xl font-bold line-clamp-2 group-hover/title:text-yellow-200 transition-colors">
                  {recipe.title}
                </h2>
              </Link>
            </div>

            {/* Description */}
            {recipe.description && (
              <p className="text-white/90 line-clamp-2 text-sm md:text-base">
                {recipe.description}
              </p>
            )}

            {/* Recipe metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}

              {totalTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalTime} min</span>
                </div>
              )}

              {recipe.difficulty && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="capitalize">{recipe.difficulty}</span>
                </div>
              )}

              {recipe.cuisine && (
                <Badge
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {recipe.cuisine}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-4 text-xs text-white/80">
                {recipe.averageRating && recipe.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{recipe.averageRating.toFixed(1)}</span>
                  </div>
                )}

                {recipe.viewCount && recipe.viewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>
                      {recipe.viewCount > 999
                        ? `${Math.floor(recipe.viewCount / 1000)}k`
                        : recipe.viewCount}
                    </span>
                  </div>
                )}

                {recipe.isFavorited && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-red-400 text-red-400" />
                    <span>Favorited</span>
                  </div>
                )}
              </div>

              <Button
                asChild
                size="sm"
                className="bg-white text-black hover:bg-white/90"
              >
                <Link href={`/recipes/${recipe.slug}`}>View Recipe</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface RecipeHeroCardSkeletonProps {
  className?: string;
}

export function RecipeHeroCardSkeleton({
  className,
}: RecipeHeroCardSkeletonProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        {/* Image skeleton */}
        <div className="h-64 md:h-80 bg-muted animate-pulse" />

        {/* Content overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-white/20 rounded animate-pulse" />
            <div className="h-5 w-16 bg-white/20 rounded animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-full bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-white/20 rounded animate-pulse" />
          </div>

          <div className="flex gap-4">
            <div className="h-4 w-16 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-12 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-14 bg-white/20 rounded animate-pulse" />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/20">
            <div className="flex gap-4">
              <div className="h-3 w-8 bg-white/20 rounded animate-pulse" />
              <div className="h-3 w-6 bg-white/20 rounded animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}
