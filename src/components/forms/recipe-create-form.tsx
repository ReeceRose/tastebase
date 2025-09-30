"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Image as ImageIcon,
  Plus,
  Save,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageUpload } from "@/components/recipe-images/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeImageGenerator } from "@/components/ui/recipe-image-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAutoSave } from "@/hooks/use-auto-save";
import { createRecipe } from "@/lib/server-actions/recipe-actions";
import {
  clearRecipeDraft,
  saveRecipeDraft,
} from "@/lib/server-actions/recipe-draft-actions";
import { attachImageToRecipe } from "@/lib/server-actions/recipe-image-actions";
import { RecipeDifficulty } from "@/lib/types";
import type { RecipeFormData } from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";
import {
  transformFormDataToCreateData,
  validateRecipeFormData,
} from "@/lib/utils/recipe-utils";
import { createRecipeSchema } from "@/lib/validations/recipe-schemas";

interface RecipeCreateFormProps {
  onSuccess?: (recipeId: string) => void;
  initialData?: Partial<RecipeFormData>;
}

export function RecipeCreateForm({
  onSuccess,
  initialData,
}: RecipeCreateFormProps) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const servingsId = useId();
  const prepTimeId = useId();
  const cookTimeId = useId();
  const cuisineId = useId();
  const sourceUrlId = useId();
  const sourceNameId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<
    Array<{
      filename: string;
      originalName: string;
      fileSize: number;
      width?: number;
      height?: number;
    }>
  >([]);

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
      title: initialData?.title || "",
      description: initialData?.description || "",
      servings:
        initialData?.servings ||
        RECIPE_CONSTANTS.SERVING_LIMITS.DEFAULT_SERVINGS,
      prepTimeMinutes: initialData?.prepTimeMinutes || 0,
      cookTimeMinutes: initialData?.cookTimeMinutes || 0,
      difficulty: initialData?.difficulty || RecipeDifficulty.MEDIUM,
      cuisine: initialData?.cuisine || "",
      sourceUrl: initialData?.sourceUrl || "",
      sourceName: initialData?.sourceName || "",
      isPublic: initialData?.isPublic || false,
      ingredients: initialData?.ingredients || [
        {
          name: "",
          amount: undefined,
          unit: "",
          notes: "",
          groupName: "",
          isOptional: false,
        },
      ],
      instructions: initialData?.instructions || [
        {
          instruction: "",
          timeMinutes: undefined,
          temperature: "",
          notes: "",
          groupName: "",
        },
      ],
      tags: initialData?.tags || [],
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
  const formData = watch();

  const autoSaveState = useAutoSave(formData, {
    delay: 3000,
    enabled: true,
    onSave: async (data) => {
      try {
        const result = await saveRecipeDraft({
          title: typeof data.title === "string" ? data.title : "",
          description:
            typeof data.description === "string" ? data.description : "",
          servings: typeof data.servings === "number" ? data.servings : 4,
          prepTimeMinutes:
            typeof data.prepTimeMinutes === "number" ? data.prepTimeMinutes : 0,
          cookTimeMinutes:
            typeof data.cookTimeMinutes === "number" ? data.cookTimeMinutes : 0,
          difficulty:
            typeof data.difficulty === "string" &&
            Object.values(RecipeDifficulty).includes(
              data.difficulty as RecipeDifficulty,
            )
              ? (data.difficulty as RecipeDifficulty)
              : RecipeDifficulty.MEDIUM,
          cuisine: typeof data.cuisine === "string" ? data.cuisine : "",
          sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : "",
          sourceName:
            typeof data.sourceName === "string" ? data.sourceName : "",
          ingredients: Array.isArray(data.ingredients)
            ? data.ingredients.map((ing) => ({
                name: ing.name || "",
                amount: ing.amount?.toString() || "",
                unit: ing.unit || "",
                notes: ing.notes || "",
                groupName: ing.groupName || "",
                isOptional: ing.isOptional || false,
              }))
            : [],
          instructions: Array.isArray(data.instructions)
            ? data.instructions.map((inst) => ({
                instruction: inst.instruction || "",
                timeMinutes: inst.timeMinutes || 0,
                temperature: inst.temperature || "",
                notes: inst.notes || "",
                groupName: inst.groupName || "",
              }))
            : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
        return { success: result.success, error: result.error };
      } catch {
        return { success: false, error: "Auto-save failed" };
      }
    },
    onSuccess: () => {
      console.log("Draft auto-saved");
    },
  });

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
    console.log("🚀 Form submission started", { data });
    console.log("🔍 Current form errors:", errors);
    setIsSubmitting(true);

    try {
      console.log("📝 Validating form data...");
      const validation = validateRecipeFormData(data);
      if (!validation.isValid) {
        console.error("❌ Validation failed:", validation.errors);
        validation.errors.forEach((error) => {
          toast.error(error);
        });
        return;
      }
      console.log("✅ Validation passed");

      console.log("🔄 Transforming form data...");
      const createData = transformFormDataToCreateData(data);
      console.log("📤 Transformed data:", createData);

      console.log("🌐 Calling createRecipe server action...");
      const result = await createRecipe(createData);
      console.log("📨 Server response:", result);

      if (result.success && result.data) {
        // Clear the draft after successful creation
        await clearRecipeDraft();

        // Attach uploaded images to the recipe
        if (uploadedImages.length > 0) {
          const imageResults = await Promise.all(
            uploadedImages.map((image, index) =>
              attachImageToRecipe({
                recipeId: result.data.id,
                filename: image.filename,
                originalName: image.originalName,
                mimeType: "image/jpeg", // This should ideally come from the upload
                fileSize: image.fileSize,
                width: image.width,
                height: image.height,
                altText: `${data.title} image ${index + 1}`,
                isHero: index === 0, // Make first image the hero image
              }).catch(() => ({ success: false })),
            ),
          );

          const successfulAttachments = imageResults.filter(
            (r) => r.success,
          ).length;
          if (successfulAttachments > 0) {
            toast.success(
              `Recipe created with ${successfulAttachments} image${successfulAttachments === 1 ? "" : "s"}!`,
            );
          } else if (successfulAttachments === 0 && uploadedImages.length > 0) {
            toast.warning("Recipe created but failed to attach images");
          }
        } else {
          toast.success("Recipe created successfully!");
        }

        onSuccess?.(result.data.id);
        router.push(`/recipes/${result.data.slug}`);
      } else {
        toast.error(result.error || "Failed to create recipe");
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Basic Information
            </div>
            {autoSaveState.isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Saving draft...
              </div>
            )}
            {autoSaveState.lastSaved && !autoSaveState.isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Draft saved{" "}
                {new Date(autoSaveState.lastSaved).toLocaleTimeString()}
              </div>
            )}
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
              <Label>Difficulty</Label>
              <Select
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Recipe Images
            </div>
            <RecipeImageGenerator
              recipeId="draft"
              recipeData={{
                title: formData.title || "Untitled Recipe",
                description: formData.description || undefined,
                ingredients:
                  formData.ingredients
                    ?.filter((ing) => ing.name.trim())
                    .map((ing) => ({
                      id: Math.random().toString(),
                      recipeId: "draft",
                      name: ing.name,
                      amount: ing.amount?.toString() || null,
                      unit: ing.unit || null,
                      notes: ing.notes || null,
                      groupName: ing.groupName || null,
                      sortOrder: 0,
                      isOptional: ing.isOptional || false,
                    })) || [],
                instructions:
                  formData.instructions
                    ?.filter((inst) => inst.instruction.trim())
                    .map((inst, index) => ({
                      id: Math.random().toString(),
                      recipeId: "draft",
                      stepNumber: index + 1,
                      instruction: inst.instruction,
                      timeMinutes: inst.timeMinutes || null,
                      temperature: inst.temperature || null,
                      notes: inst.notes || null,
                      groupName: inst.groupName || null,
                    })) || [],
                cuisineType: formData.cuisine || undefined,
                tags: formData.tags || [],
                servings: formData.servings || undefined,
                prepTime: formData.prepTimeMinutes || undefined,
                cookTime: formData.cookTimeMinutes || undefined,
              }}
              onImageGenerated={(generatedImage) => {
                setUploadedImages((prev) => [
                  ...prev,
                  {
                    filename: generatedImage.filename,
                    originalName: `${formData.title || "Recipe"} - AI Generated`,
                    fileSize: 0, // AI images don't have a file size yet
                  },
                ]);
                toast.success("AI image generated successfully!");
              }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload images of your recipe or generate AI images. You can add
              more images or set a hero image after creating the recipe.
            </p>
            <ImageUpload
              onUploadComplete={(uploadedFile) => {
                setUploadedImages((prev) => [
                  ...prev,
                  {
                    filename: uploadedFile.filename,
                    originalName: uploadedFile.originalName,
                    fileSize: uploadedFile.fileSize,
                    width: uploadedFile.width,
                    height: uploadedFile.height,
                  },
                ]);
                toast.success("Image uploaded successfully!");
              }}
              onUploadError={(error) => {
                toast.error(error);
              }}
              maxFiles={5}
            />
            {uploadedImages.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Uploaded Images ({uploadedImages.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div
                      key={image.filename}
                      className="relative aspect-square"
                    >
                      <Image
                        src={`/api/recipes/images/${image.filename}`}
                        alt={`Recipe image ${index + 1}`}
                        fill
                        className="object-cover rounded-lg border"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          setUploadedImages((prev) =>
                            prev.filter(
                              (img) => img.filename !== image.filename,
                            ),
                          );
                          toast.success("Image removed");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                    {...register(`ingredients.${index}.amount`)}
                    placeholder="Amount"
                  />
                  {errors.ingredients?.[index]?.amount && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.ingredients[index]?.amount?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input
                    {...register(`ingredients.${index}.unit`)}
                    placeholder="Unit"
                  />
                </div>
                <div className="md:col-span-4">
                  <Input
                    {...register(`ingredients.${index}.notes`)}
                    placeholder="Notes (optional)"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeIngredient(index)}
                className="mt-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
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
                  <Badge variant="secondary" className="min-w-fit">
                    Step {index + 1}
                  </Badge>
                </div>
                <Textarea
                  {...register(`instructions.${index}.instruction`)}
                  placeholder="Describe the step"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...register(`instructions.${index}.timeMinutes`, {
                      setValueAs: (value) =>
                        value === "" ? undefined : Number(value) || undefined,
                    })}
                    type="number"
                    placeholder="Time (min)"
                  />
                  <Input
                    {...register(`instructions.${index}.temperature`)}
                    placeholder="Temperature"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeInstruction(index)}
                className="mt-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
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
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>

            {(watchedTags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(watchedTags ?? []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
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
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            "Creating..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Recipe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
