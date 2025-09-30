"use client";

import { Edit, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeFavoriteButton } from "@/components/ui/recipe-favorite-button";
import { deleteRecipe } from "@/lib/server-actions/recipe-actions";
import { ActionVariant, ButtonVariant, ComponentSize } from "@/lib/types";

interface RecipeQuickActionsProps {
  recipeId: string;
  recipeTitle: string;
  variant?: ActionVariant;
  size?: ComponentSize;
  showLabels?: boolean;
  onRecipeDeleted?: () => void;
  className?: string;
}

export function RecipeQuickActions({
  recipeId,
  recipeTitle,
  variant = ActionVariant.DROPDOWN,
  size = ComponentSize.SM,
  showLabels = false,
  onRecipeDeleted,
  className,
}: RecipeQuickActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map our size prop to Button component size
  const buttonSize = size === ComponentSize.MD ? "default" : size;

  const handleEdit = () => {
    router.push(`/recipes/${recipeId}/edit`);
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/recipes/${recipeId}`;

      if (navigator.share) {
        await navigator.share({
          title: recipeTitle,
          text: `Check out this recipe: ${recipeTitle}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Recipe link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing recipe:", error);
      toast.error("Failed to share recipe");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteRecipe(recipeId);

      if (result.success) {
        toast.success("Recipe deleted successfully");
        setShowDeleteDialog(false);
        onRecipeDeleted?.();
      } else {
        toast.error(result.error || "Failed to delete recipe");
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (variant === ActionVariant.INLINE) {
    return (
      <>
        <div className={`flex items-center gap-1 ${className || ""}`}>
          <RecipeFavoriteButton
            recipeId={recipeId}
            size={size}
            variant={ButtonVariant.GHOST}
            showText={showLabels}
          />

          <Button
            variant={ButtonVariant.GHOST}
            size={buttonSize}
            onClick={handleEdit}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit
              className={`${size === ComponentSize.SM ? "h-3 w-3" : size === ComponentSize.LG ? "h-5 w-5" : "h-4 w-4"}`}
            />
            {showLabels && <span className="ml-2">Edit</span>}
          </Button>

          <Button
            variant={ButtonVariant.GHOST}
            size={buttonSize}
            onClick={handleShare}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2
              className={`${size === ComponentSize.SM ? "h-3 w-3" : size === ComponentSize.LG ? "h-5 w-5" : "h-4 w-4"}`}
            />
            {showLabels && <span className="ml-2">Share</span>}
          </Button>

          <Button
            variant={ButtonVariant.GHOST}
            size={buttonSize}
            onClick={() => setShowDeleteDialog(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2
              className={`${size === ComponentSize.SM ? "h-3 w-3" : size === ComponentSize.LG ? "h-5 w-5" : "h-4 w-4"}`}
            />
            {showLabels && <span className="ml-2">Delete</span>}
          </Button>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recipe</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{recipeTitle}"? This action
                cannot be undone and will permanently remove the recipe,
                including all images, notes, and ratings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button
                variant={ButtonVariant.OUTLINE}
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant={ButtonVariant.DESTRUCTIVE}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Recipe
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Dropdown variant
  return (
    <>
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={ButtonVariant.GHOST} size={buttonSize}>
              <MoreHorizontal
                className={`${size === ComponentSize.SM ? "h-3 w-3" : size === ComponentSize.LG ? "h-5 w-5" : "h-4 w-4"}`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Recipe
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Recipe
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Recipe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separate favorite button for dropdown variant */}
        <RecipeFavoriteButton
          recipeId={recipeId}
          size={size}
          variant={ButtonVariant.GHOST}
          className="ml-1"
        />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipeTitle}"? This action
              cannot be undone and will permanently remove the recipe, including
              all images, notes, and ratings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant={ButtonVariant.OUTLINE}
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant={ButtonVariant.DESTRUCTIVE}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Recipe
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
