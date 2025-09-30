"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getRecipeFavoriteStatus,
  toggleFavorite,
} from "@/lib/server-actions/recipe-favorites-actions";
import { ButtonVariant, ComponentSize } from "@/lib/types";

interface RecipeFavoriteButtonProps {
  recipeId: string;
  size?: ComponentSize;
  variant?: ButtonVariant;
  showText?: boolean;
  className?: string;
}

export function RecipeFavoriteButton({
  recipeId,
  size = ComponentSize.MD,
  variant = ButtonVariant.GHOST,
  showText = false,
  className,
}: RecipeFavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Map our size prop to Button component size
  const buttonSize = size === ComponentSize.MD ? "default" : size;

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        const result = await getRecipeFavoriteStatus(recipeId);
        if (result.success && result.data) {
          setIsFavorited(result.data.isFavorited);
        }
      } catch (error) {
        console.error("Error loading favorite status:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadFavoriteStatus();
  }, [recipeId]);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const result = await toggleFavorite(recipeId);

      if (result.success) {
        const newStatus = !isFavorited;
        setIsFavorited(newStatus);
        toast.success(
          newStatus
            ? "Recipe added to favorites"
            : "Recipe removed from favorites",
        );
      } else {
        toast.error(result.error || "Failed to update favorite status");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until we've loaded the initial state
  if (!isInitialized) {
    return (
      <Button
        variant={variant}
        size={buttonSize}
        disabled
        className={className}
      >
        <Heart
          className={`${size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}`}
        />
        {showText && <span className="ml-2">Favorite</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={buttonSize}
      onClick={handleToggle}
      disabled={isLoading}
      className={className}
    >
      <Heart
        className={`${size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} ${
          isFavorited
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-red-500"
        } transition-colors`}
      />
      {showText && (
        <span className="ml-2">{isFavorited ? "Favorited" : "Favorite"}</span>
      )}
    </Button>
  );
}
