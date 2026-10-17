"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/lib/server-actions/recipe-favorites-actions";
import { ButtonVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeFavoriteButtonProps {
  recipeId: string;
  initialIsFavorited: boolean;
  className?: string;
}

export function RecipeFavoriteButton({
  recipeId,
  initialIsFavorited,
  className,
}: RecipeFavoriteButtonProps) {
  const [isFavourite, setIsFavourite] = useState(initialIsFavorited);
  const [isSaving, startSaving] = useTransition();

  const toggle = () => {
    const next = !isFavourite;
    setIsFavourite(next);
    startSaving(async () => {
      const result = await toggleFavorite(recipeId);
      if (!result.success) {
        setIsFavourite(!next);
        toast.error(result.error || "Couldn't update your favourites");
        return;
      }
      toast.success(next ? "Saved to favourites" : "Removed from favourites");
    });
  };

  return (
    <Button
      variant={ButtonVariant.SECONDARY}
      size="lg"
      onClick={toggle}
      disabled={isSaving}
      aria-pressed={isFavourite}
      className={className}
    >
      <Heart
        className={cn(
          "size-5 transition-transform duration-200 motion-safe:active:scale-110",
          isFavourite && "fill-swatch-tomato text-swatch-tomato",
        )}
      />
      {isFavourite ? "Saved" : "Save"}
    </Button>
  );
}
