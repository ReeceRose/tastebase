"use client";

import {
  BookOpen,
  ChefHat,
  Clock,
  Edit,
  MoreHorizontal,
  Share2,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RecipeNotesSection } from "@/components/cards/recipe-notes-section";
import { ImageGallery } from "@/components/recipes/image-gallery";
import { IngredientList } from "@/components/recipes/ingredient-list";
import { InstructionSteps } from "@/components/recipes/instruction-steps";
import { RecipeMetadata } from "@/components/recipes/recipe-metadata";
import { RecipeTags } from "@/components/recipes/recipe-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ModernUnitReset } from "@/components/ui/modern-unit-display";
import { RatingDisplay } from "@/components/ui/rating-display";
import { RecipeImageGenerator } from "@/components/ui/recipe-image-generator";
import { VisibilityBadge } from "@/components/ui/visibility-badge";
import { useIngredientUnitToggle } from "@/hooks/use-ingredient-unit-toggle";
import { deleteRecipe } from "@/lib/server-actions/recipe-actions";
import {
  BadgeVariant,
  ButtonVariant,
  ComponentSize,
  MeasurementUnit,
  RatingVariant,
  SizeVariant,
  TemperatureUnit,
} from "@/lib/types";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";

interface RecipeDetailViewProps {
  recipe: RecipeWithRelations;
  canEdit?: boolean;
  onRecipeChange?: () => void;
  className?: string;
  user?: {
    preferredWeightUnit?: string;
    preferredVolumeUnit?: string;
    preferredTemperatureUnit?: string;
  };
}

export function RecipeDetailView({
  recipe,
  canEdit = true,
  onRecipeChange,
  className,
  user,
}: RecipeDetailViewProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(recipe.notes || []);
  const toggleHook = useIngredientUnitToggle();

  const handleNotesChange = (updatedNotes?: typeof recipe.notes) => {
    if (updatedNotes) {
      setCurrentNotes(updatedNotes);
    }
    onRecipeChange?.();
  };

  const handleDeleteRecipe = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteRecipe(recipe.id);

      if (result.success) {
        toast.success("Recipe deleted successfully");
        router.push("/recipes");
      } else {
        toast.error(result.error || "Failed to delete recipe");
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShareRecipe = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || `Check out this ${recipe.title} recipe!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Recipe link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing recipe:", error);
      toast.error("Failed to share recipe");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  // Reactive rating calculation that updates when notes change
  const averageRating = useMemo(() => {
    const ratingsWithValues =
      currentNotes?.filter((note) => note.rating !== null) || [];
    return ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, note) => sum + (note.rating || 0), 0) /
          ratingsWithValues.length
      : null;
  }, [currentNotes]);

  // Check for toggled units
  const hasToggledIngredients = useMemo(() => {
    return (
      recipe.ingredients?.some((ingredient) => {
        const display = toggleHook.getIngredientDisplay(
          ingredient.id,
          ingredient.amount || "",
          ingredient.unit || "",
          user?.preferredWeightUnit === "metric" ||
            user?.preferredVolumeUnit === "metric"
            ? MeasurementUnit.METRIC
            : MeasurementUnit.IMPERIAL,
        );
        return display.isToggled;
      }) || false
    );
  }, [recipe.ingredients, toggleHook, user]);

  const hasToggledTemperatures = useMemo(() => {
    return (
      recipe.instructions?.some((instruction) => {
        if (!instruction.temperature) return false;
        const display = toggleHook.getTemperatureDisplay(
          instruction.id,
          instruction.temperature,
          (user?.preferredTemperatureUnit as TemperatureUnit) ||
            TemperatureUnit.FAHRENHEIT,
        );
        return display.isToggled;
      }) || false
    );
  }, [recipe.instructions, toggleHook, user]);

  return (
    <>
      <div className={`space-y-8 ${className || ""}`}>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <ChefHat className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {recipe.title}
                  </h1>
                  <VisibilityBadge isPublic={recipe.isPublic} />
                </div>

                {recipe.description && (
                  <p className="text-muted-foreground text-base leading-relaxed mb-4">
                    {recipe.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Total: {totalTime > 0 ? totalTime : "Unknown"} min
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Serves {recipe.servings || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span className="capitalize">
                      {recipe.difficulty || "Medium"}
                    </span>
                  </div>
                  <RatingDisplay
                    rating={averageRating}
                    variant={RatingVariant.COMPACT}
                    size={ComponentSize.SM}
                  />
                  <span>•</span>
                  <span>
                    Added {formatDate(recipe.createdAt?.toISOString())}
                  </span>
                  {recipe.updatedAt !== recipe.createdAt && (
                    <>
                      <span>•</span>
                      <span>
                        Updated {formatDate(recipe.updatedAt?.toISOString())}
                      </span>
                    </>
                  )}
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mt-4">
                    <RecipeTags
                      tags={recipe.tags}
                      variant={BadgeVariant.OUTLINE}
                      size={SizeVariant.SM}
                    />
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={ButtonVariant.OUTLINE} size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {canEdit && (
                    <DropdownMenuItem asChild>
                      <Link href={`/recipes/${recipe.slug}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Recipe
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleShareRecipe}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Recipe
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Recipe
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Images
                {recipe.images && recipe.images.length > 0 && (
                  <Badge variant={BadgeVariant.SECONDARY}>
                    {recipe.images.length}
                  </Badge>
                )}
              </CardTitle>
              {canEdit && (
                <RecipeImageGenerator
                  recipeId={recipe.id}
                  recipeData={{
                    title: recipe.title,
                    description: recipe.description || undefined,
                    ingredients: recipe.ingredients || [],
                    instructions: recipe.instructions || [],
                    cuisineType: recipe.cuisine || undefined,
                    tags: recipe.tags?.map((tag) => tag.name) || [],
                    servings: recipe.servings || undefined,
                    prepTime: recipe.prepTimeMinutes || undefined,
                    cookTime: recipe.cookTimeMinutes || undefined,
                  }}
                  onImageGenerated={() => {
                    router.refresh();
                    onRecipeChange?.();
                  }}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recipe.images && recipe.images.length > 0 ? (
              <ImageGallery images={recipe.images} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No images yet</p>
                {canEdit && (
                  <p className="text-sm">
                    Generate an AI image to get started!
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <RecipeMetadata recipe={recipe} />

        {(hasToggledIngredients || hasToggledTemperatures) && (
          <ModernUnitReset
            onResetIngredients={toggleHook.resetAllIngredients}
            onResetTemperatures={toggleHook.resetAllTemperatures}
            hasToggledIngredients={hasToggledIngredients}
            hasToggledTemperatures={hasToggledTemperatures}
            className="flex justify-end"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ingredients
                <Badge variant={BadgeVariant.SECONDARY} className="ml-2">
                  {recipe.ingredients?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <IngredientList
                  ingredients={recipe.ingredients}
                  showCheckboxes={true}
                  showToggles={true}
                  userPreferences={
                    user
                      ? {
                          preferredWeightUnit:
                            user.preferredWeightUnit || "imperial",
                          preferredVolumeUnit:
                            user.preferredVolumeUnit || "imperial",
                        }
                      : undefined
                  }
                />
              ) : (
                <p className="text-muted-foreground italic">
                  No ingredients listed
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Instructions
                <Badge variant={BadgeVariant.SECONDARY} className="ml-2">
                  {recipe.instructions?.length || 0} steps
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                <InstructionSteps
                  instructions={recipe.instructions}
                  showToggles={true}
                  userTemperaturePreference={
                    (user?.preferredTemperatureUnit as TemperatureUnit) ||
                    TemperatureUnit.FAHRENHEIT
                  }
                />
              ) : (
                <p className="text-muted-foreground italic">
                  No instructions provided
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <RecipeNotesSection
          recipeId={recipe.id}
          notes={currentNotes}
          onNotesChange={handleNotesChange}
        />
      </div>

      {canEdit && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recipe</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{recipe.title}"? This action
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
                onClick={handleDeleteRecipe}
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
      )}
    </>
  );
}
