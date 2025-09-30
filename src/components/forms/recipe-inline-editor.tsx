"use client";

import { ChefHat, Clock, Globe, Users } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  InlineEdit,
  InlineEditType,
  InlineSelect,
} from "@/components/forms/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRecipe } from "@/lib/server-actions/recipe-actions";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

interface RecipeInlineEditorProps {
  recipe: RecipeWithRelations;
  onUpdate?: (recipe: RecipeWithRelations) => void;
  disabled?: boolean;
}

export function RecipeInlineEditor({
  recipe,
  onUpdate,
  disabled = false,
}: RecipeInlineEditorProps) {
  const titleId = useId();
  const descriptionId = useId();
  const servingsId = useId();
  const prepTimeId = useId();
  const cookTimeId = useId();
  const difficultyId = useId();
  const cuisineId = useId();
  const sourceId = useId();
  const sourceUrlId = useId();

  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticRecipe, setOptimisticRecipe] = useState(recipe);

  const handleUpdate = async (
    field: string,
    value: string | number | boolean,
  ) => {
    if (disabled) return;

    const previousValue = optimisticRecipe[field as keyof RecipeWithRelations];

    // Optimistic update
    setOptimisticRecipe((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date(),
    }));

    setIsUpdating(true);

    try {
      const updateData = { id: recipe.id, [field]: value };
      const result = await updateRecipe(updateData);

      if (result.success && result.data) {
        const updatedRecipe = {
          ...optimisticRecipe,
          ...result.data,
        };
        setOptimisticRecipe(updatedRecipe);
        onUpdate?.(updatedRecipe);
        toast.success("Recipe updated successfully");
      } else {
        // Revert optimistic update
        setOptimisticRecipe((prev) => ({
          ...prev,
          [field]: previousValue,
        }));
        toast.error(result.error || "Failed to update recipe");
      }
    } catch (error) {
      // Revert optimistic update
      setOptimisticRecipe((prev) => ({
        ...prev,
        [field]: previousValue,
      }));
      console.error("Error updating recipe:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const validateTitle = (value: string | number): string | null => {
    const str = String(value).trim();
    if (!str) return "Title is required";
    if (str.length > 200) return "Title must be less than 200 characters";
    return null;
  };

  const validateServings = (value: string | number): string | null => {
    const num = Number(value);
    if (num < RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS) {
      return `Servings must be at least ${RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS}`;
    }
    if (num > RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS) {
      return `Servings must not exceed ${RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS}`;
    }
    return null;
  };

  const validateTime = (value: string | number): string | null => {
    const num = Number(value);
    if (num < 0) return "Time cannot be negative";
    if (num > RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME) {
      return `Time must not exceed ${RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME} minutes`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Recipe Details
            {isUpdating && (
              <Badge variant="secondary" className="ml-2">
                Updating...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor={titleId}
              className="text-sm font-medium text-muted-foreground mb-2 block"
            >
              Recipe Title
            </label>
            <InlineEdit
              id={titleId}
              value={optimisticRecipe.title}
              onSave={(value) => handleUpdate("title", value)}
              placeholder="Enter recipe title"
              validation={validateTitle}
              disabled={disabled || isUpdating}
              className="text-xl font-semibold"
              displayClassName="text-xl font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor={descriptionId}
              className="text-sm font-medium text-muted-foreground mb-2 block"
            >
              Description
            </label>
            <InlineEdit
              id={descriptionId}
              value={optimisticRecipe.description || ""}
              onSave={(value) => handleUpdate("description", value)}
              type={InlineEditType.TEXTAREA}
              placeholder="Describe your recipe..."
              disabled={disabled || isUpdating}
              displayClassName="text-muted-foreground"
              maxLength={1000}
            />
          </div>

          {/* Recipe Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Servings */}
            <div className="space-y-2">
              <label
                htmlFor={servingsId}
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Servings
              </label>
              <InlineEdit
                id={servingsId}
                value={
                  optimisticRecipe.servings ||
                  RECIPE_CONSTANTS.SERVING_LIMITS.DEFAULT_SERVINGS
                }
                onSave={(value) => handleUpdate("servings", value)}
                type={InlineEditType.NUMBER}
                validation={validateServings}
                disabled={disabled || isUpdating}
                displayClassName="font-medium"
              />
            </div>

            {/* Prep Time */}
            <div className="space-y-2">
              <label
                htmlFor={prepTimeId}
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Clock className="h-4 w-4" />
                Prep Time
              </label>
              <div className="flex items-center gap-1">
                <InlineEdit
                  id={prepTimeId}
                  value={optimisticRecipe.prepTimeMinutes || 0}
                  onSave={(value) => handleUpdate("prepTimeMinutes", value)}
                  type={InlineEditType.NUMBER}
                  validation={validateTime}
                  disabled={disabled || isUpdating}
                  displayClassName="font-medium"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            {/* Cook Time */}
            <div className="space-y-2">
              <label
                htmlFor={cookTimeId}
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Clock className="h-4 w-4" />
                Cook Time
              </label>
              <div className="flex items-center gap-1">
                <InlineEdit
                  id={cookTimeId}
                  value={optimisticRecipe.cookTimeMinutes || 0}
                  onSave={(value) => handleUpdate("cookTimeMinutes", value)}
                  type={InlineEditType.NUMBER}
                  validation={validateTime}
                  disabled={disabled || isUpdating}
                  displayClassName="font-medium"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label
                htmlFor={difficultyId}
                className="text-sm font-medium text-muted-foreground"
              >
                Difficulty
              </label>
              <InlineSelect
                id={difficultyId}
                value={optimisticRecipe.difficulty || "medium"}
                options={[...RECIPE_CONSTANTS.DIFFICULTY_LEVELS]}
                onSave={(value) => handleUpdate("difficulty", value)}
                disabled={disabled || isUpdating}
                displayClassName="font-medium"
              />
            </div>
          </div>

          {/* Cuisine and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor={cuisineId}
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Globe className="h-4 w-4" />
                Cuisine
              </label>
              <InlineEdit
                id={cuisineId}
                value={optimisticRecipe.cuisine || ""}
                onSave={(value) => handleUpdate("cuisine", value)}
                placeholder="e.g., Italian, Mexican..."
                disabled={disabled || isUpdating}
                displayClassName="font-medium"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor={sourceId}
                className="text-sm font-medium text-muted-foreground"
              >
                Source
              </label>
              <InlineEdit
                id={sourceId}
                value={optimisticRecipe.sourceName || ""}
                onSave={(value) => handleUpdate("sourceName", value)}
                placeholder="Recipe source..."
                disabled={disabled || isUpdating}
                displayClassName="font-medium"
              />
            </div>
          </div>

          {/* Source URL */}
          {(optimisticRecipe.sourceUrl || !disabled) && (
            <div>
              <label
                htmlFor={sourceUrlId}
                className="text-sm font-medium text-muted-foreground mb-2 block"
              >
                Source URL
              </label>
              <InlineEdit
                id={sourceUrlId}
                value={optimisticRecipe.sourceUrl || ""}
                onSave={(value) => handleUpdate("sourceUrl", value)}
                placeholder="https://example.com/recipe"
                disabled={disabled || isUpdating}
                displayClassName="text-blue-600 hover:text-blue-800 break-all"
              />
            </div>
          )}

          {/* Total Time Display */}
          {(optimisticRecipe.prepTimeMinutes || 0) +
            (optimisticRecipe.cookTimeMinutes || 0) >
            0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Total time:{" "}
                  {(optimisticRecipe.prepTimeMinutes || 0) +
                    (optimisticRecipe.cookTimeMinutes || 0)}{" "}
                  minutes
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
