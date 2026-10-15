"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/lib/server-actions/recipe-favorites-actions";
import { ButtonVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeFavoriteButtonProps {
  recipeId: string;
  initialIsFavorited: boolean;
}

export function RecipeFavoriteButton({
  recipeId,
  initialIsFavorited,
}: RecipeFavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    setIsSaving(true);
    const result = await toggleFavorite(recipeId);
    setIsSaving(false);

    if (result.success) {
      setIsFavorited(!isFavorited);
      toast.success(
        isFavorited ? "Removed from favorites" : "Added to favorites",
      );
    } else {
      toast.error(result.error || "Couldn't update favorites");
    }
  };

  return (
    <Button
      variant={ButtonVariant.OUTLINE}
      size="icon"
      onClick={handleToggle}
      disabled={isSaving}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          isFavorited ? "fill-primary text-primary" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}
