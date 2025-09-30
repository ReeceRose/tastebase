"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChefHat, Clock, Plus, Save, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeImageManager } from "@/components/ui/recipe-image-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeImage } from "@/db/schema.recipes";
import { updateRecipe } from "@/lib/server-actions/recipe-actions";
import { getRecipeImages } from "@/lib/server-actions/recipe-image-actions";
import { BadgeVariant, ButtonVariant, RecipeDifficulty } from "@/lib/types";
import type {
  RecipeFormData,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";

import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";
import {
  transformFormDataToUpdateData,
  validateRecipeFormData,
} from "@/lib/utils/recipe-utils";
import { createRecipeSchema } from "@/lib/validations/recipe-schemas";

interface RecipeEditFormProps {
  recipe: RecipeWithRelations;
  onSuccess?: () => void;
}

export function RecipeEditForm({ recipe, onSuccess }: RecipeEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<RecipeImage[]>(recipe.images || []);

  // Generate unique IDs for form elements
  const titleId = useId();
  const descriptionId = useId();
  const servingsId = useId();
  const prepTimeId = useId();
  const cookTimeId = useId();
  const cuisineId = useId();
  const isPublicId = useId();
  const sourceUrlId = useId();
  const sourceNameId = useId();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      title: recipe.title,
      description: recipe.description || "",
      servings:
        recipe.servings || RECIPE_CONSTANTS.SERVING_LIMITS.DEFAULT_SERVINGS,
      prepTimeMinutes: recipe.prepTimeMinutes || 0,
      cookTimeMinutes: recipe.cookTimeMinutes || 0,
      difficulty: recipe.difficulty || RecipeDifficulty.MEDIUM,
      cuisine: recipe.cuisine || "",
      sourceUrl: recipe.sourceUrl || "",
      sourceName: recipe.sourceName || "",
      isPublic: recipe.isPublic || false,
      ingredients: recipe.ingredients?.map((ing) => ({
        name: ing.name,
        amount: ing.amount || undefined,
        unit: ing.unit || "",
        notes: ing.notes || "",
        groupName: ing.groupName || "",
        isOptional: ing.isOptional || false,
      })) || [
        {
          name: "",
          amount: undefined,
          unit: "",
          notes: "",
          groupName: "",
          isOptional: false,
        },
      ],
      instructions: recipe.instructions?.map((inst) => ({
        instruction: inst.instruction,
        timeMinutes: inst.timeMinutes || undefined,
        temperature: inst.temperature || "",
        notes: inst.notes || "",
        groupName: inst.groupName || "",
      })) || [
        {
          instruction: "",
          timeMinutes: undefined,
          temperature: "",
          notes: "",
          groupName: "",
        },
      ],
      tags: recipe.tags?.map((tag) => tag.name) || [],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: "ingredients",
  });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control,
    name: "instructions",
  });

  const watchedTags = watch("tags");
  const watchedIsPublic = watch("isPublic");

  // Refresh images from server when component mounts or recipe ID changes
  const refreshImages = async () => {
    try {
      const result = await getRecipeImages(recipe.id);
      if (result.success && result.data) {
        setImages(result.data);
      }
    } catch (error) {
      console.error("Failed to refresh images:", error);
    }
  };

  // Initialize images and set up refresh on recipe change
  useEffect(() => {
    setImages(recipe.images || []);
  }, [recipe.images]);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    const currentTags = watchedTags ?? [];
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      setValue("tags", [...currentTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watchedTags ?? [];
    setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
    );
  };

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true);

    try {
      const validation = validateRecipeFormData(data);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          toast.error(error);
        });
        return;
      }

      const updateData = transformFormDataToUpdateData(data, recipe.id);
      const result = await updateRecipe(updateData);

      if (result.success && result.data) {
        toast.success("Recipe updated successfully!");
        onSuccess?.();
        router.push(`/recipes/${result.data.slug}`);
      } else {
        toast.error(result.error || "Failed to update recipe");
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={titleId}>Recipe Title *</Label>
            <Input
              id={titleId}
              {...register("title")}
              placeholder="Enter recipe title"
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              {...register("description")}
              placeholder="Describe your recipe"
              className="mt-1"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={servingsId} className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Servings
              </Label>
              <Input
                id={servingsId}
                type="number"
                {...register("servings", { valueAsNumber: true })}
                min={RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS}
                max={RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS}
                className="mt-1"
              />
              {errors.servings && (
                <p className="text-sm text-destructive mt-1">
                  {errors.servings.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={prepTimeId} className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Prep Time (min)
              </Label>
              <Input
                id={prepTimeId}
                type="number"
                {...register("prepTimeMinutes", { valueAsNumber: true })}
                min={RECIPE_CONSTANTS.TIME_LIMITS.MIN_PREP_TIME}
                max={RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME}
                className="mt-1"
              />
              {errors.prepTimeMinutes && (
                <p className="text-sm text-destructive mt-1">
                  {errors.prepTimeMinutes.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={cookTimeId} className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Cook Time (min)
              </Label>
              <Input
                id={cookTimeId}
                type="number"
                {...register("cookTimeMinutes", { valueAsNumber: true })}
                min={RECIPE_CONSTANTS.TIME_LIMITS.MIN_COOK_TIME}
                max={RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME}
                className="mt-1"
              />
              {errors.cookTimeMinutes && (
                <p className="text-sm text-destructive mt-1">
                  {errors.cookTimeMinutes.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={watch("difficulty") || ""}
                onValueChange={(value: string) =>
                  setValue("difficulty", value as RecipeDifficulty)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_CONSTANTS.DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-sm text-destructive mt-1">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={cuisineId}>Cuisine</Label>
              <Input
                id={cuisineId}
                {...register("cuisine")}
                placeholder="e.g., Italian, Mexican"
                className="mt-1"
              />
              {errors.cuisine && (
                <p className="text-sm text-destructive mt-1">
                  {errors.cuisine.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={isPublicId}
              checked={watchedIsPublic}
              onCheckedChange={(checked) => setValue("isPublic", !!checked)}
            />
            <Label htmlFor={isPublicId} className="text-sm">
              Make this recipe public (visible to other users)
            </Label>
          </div>
        </CardContent>
      </Card>

      <RecipeImageManager
        recipeId={recipe.id}
        images={images}
        recipeData={{
          title: watch("title") || recipe.title,
          description: watch("description") || recipe.description || undefined,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          cuisineType: watch("cuisine") || recipe.cuisine || undefined,
          tags: watch("tags") || recipe.tags?.map((tag) => tag.name) || [],
          servings: watch("servings") || recipe.servings || undefined,
          prepTime: recipe.prepTimeMinutes || undefined,
          cookTime: recipe.cookTimeMinutes || undefined,
        }}
        onImagesChange={refreshImages}
        className="mb-8"
      />

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1">
                <div className="md:col-span-4">
                  <Input
                    {...register(`ingredients.${index}.name`)}
                    placeholder="Ingredient name"
                  />
                  {errors.ingredients?.[index]?.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.ingredients[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input
                    {...register(`ingredients.${index}.amount`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="any"
                    placeholder="Amount"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    {...register(`ingredients.${index}.unit`)}
                    placeholder="Unit"
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    {...register(`ingredients.${index}.notes`)}
                    placeholder="Notes (optional)"
                  />
                </div>
                <div className="md:col-span-1 flex items-center">
                  <Checkbox
                    {...register(`ingredients.${index}.isOptional`)}
                    aria-label="Optional ingredient"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant={ButtonVariant.OUTLINE}
                size="sm"
                onClick={() => removeIngredient(index)}
                disabled={ingredientFields.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant={ButtonVariant.OUTLINE}
            onClick={() =>
              appendIngredient({
                name: "",
                amount: undefined,
                unit: "",
                notes: "",
                groupName: "",
                isOptional: false,
              })
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {instructionFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={BadgeVariant.SECONDARY} className="min-w-fit">
                    Step {index + 1}
                  </Badge>
                </div>
                <Textarea
                  {...register(`instructions.${index}.instruction`)}
                  placeholder="Describe the step"
                  rows={2}
                />
                {errors.instructions?.[index]?.instruction && (
                  <p className="text-sm text-destructive">
                    {errors.instructions[index]?.instruction?.message}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...register(`instructions.${index}.timeMinutes`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="Time (min)"
                  />
                  <Input
                    {...register(`instructions.${index}.temperature`)}
                    placeholder="Temperature"
                  />
                </div>
                <Input
                  {...register(`instructions.${index}.notes`)}
                  placeholder="Additional notes (optional)"
                />
              </div>
              <Button
                type="button"
                variant={ButtonVariant.OUTLINE}
                size="sm"
                onClick={() => removeInstruction(index)}
                disabled={instructionFields.length === 1}
                className="mt-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant={ButtonVariant.OUTLINE}
            onClick={() =>
              appendInstruction({
                instruction: "",
                timeMinutes: undefined,
                temperature: "",
                notes: "",
                groupName: "",
              })
            }
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Instruction
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags & Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addTag}
                variant={ButtonVariant.OUTLINE}
              >
                Add
              </Button>
            </div>

            {(watchedTags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(watchedTags ?? []).map((tag) => (
                  <Badge
                    key={tag}
                    variant={BadgeVariant.OUTLINE}
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={sourceUrlId}>Source URL</Label>
              <Input
                id={sourceUrlId}
                {...register("sourceUrl")}
                placeholder="https://example.com/recipe"
                className="mt-1"
              />
              {errors.sourceUrl && (
                <p className="text-sm text-destructive mt-1">
                  {errors.sourceUrl.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={sourceNameId}>Source Name</Label>
              <Input
                id={sourceNameId}
                {...register("sourceName")}
                placeholder="e.g., Food Network, Grandma's Recipe"
                className="mt-1"
              />
              {errors.sourceName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.sourceName.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant={ButtonVariant.OUTLINE}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            "Updating..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Recipe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
