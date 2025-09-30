"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, MessageSquare, Save, X } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { NoteTemplates } from "@/components/forms/note-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InteractiveRating } from "@/components/ui/rating-display";
import { Textarea } from "@/components/ui/textarea";
import {
  addRecipeNote,
  updateRecipeNote,
} from "@/lib/server-actions/recipe-actions";
import { ComponentSize } from "@/lib/types";
import type { RecipeNote } from "@/lib/types/recipe-types";
import {
  type CreateRecipeNoteInput,
  createRecipeNoteSchema,
  type UpdateRecipeNoteInput,
  updateRecipeNoteSchema,
} from "@/lib/validations/recipe-schemas";

interface RecipeNoteFormProps {
  recipeId: string;
  note?: RecipeNote;
  onSuccess?: (newNote?: RecipeNote) => void;
  onCancel?: () => void;
}

export function RecipeNoteForm({
  recipeId,
  note,
  onSuccess,
  onCancel,
}: RecipeNoteFormProps) {
  const contentId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(
    note?.rating || undefined,
  );

  const isEditing = Boolean(note);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecipeNoteInput | UpdateRecipeNoteInput>({
    resolver: zodResolver(
      isEditing ? updateRecipeNoteSchema : createRecipeNoteSchema,
    ),
    defaultValues: {
      ...(isEditing && { id: note?.id }),
      recipeId,
      content: note?.content || "",
      rating: note?.rating || undefined,
      isPrivate: note?.isPrivate ?? true,
    },
  });

  const handleRatingChange = (rating: number | undefined) => {
    setSelectedRating(rating);
    setValue("rating", rating);
  };

  const handleTemplateSelect = (templateContent: string) => {
    const currentContent = watch("content") || "";
    const newContent = currentContent
      ? `${currentContent}\n\n${templateContent}`
      : templateContent;
    setValue("content", newContent);
  };

  const onSubmit = async (
    data: CreateRecipeNoteInput | UpdateRecipeNoteInput,
  ) => {
    setIsSubmitting(true);

    try {
      // For optimistic updates, call onSuccess immediately with the form data
      if (!isEditing) {
        const optimisticNoteData = {
          content: data.content,
          rating: data.rating,
          isPrivate: data.isPrivate,
        };
        onSuccess?.(optimisticNoteData as RecipeNote);
      }

      const result = isEditing
        ? await updateRecipeNote(data as UpdateRecipeNoteInput)
        : await addRecipeNote(data as CreateRecipeNoteInput);

      if (result.success) {
        toast.success(
          isEditing ? "Note updated successfully!" : "Note added successfully!",
        );
        if (isEditing) {
          onSuccess?.(result.data);
        }
      } else {
        toast.error(result.error || "Failed to save note");
        // If creation failed and we optimistically added, we should handle rollback
        // For now, the parent will refetch on error
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {isEditing ? "Edit Recipe Note" : "Add Recipe Note"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={contentId}>Your Notes</Label>
              <NoteTemplates onSelectTemplate={handleTemplateSelect} />
            </div>
            <Textarea
              id={contentId}
              {...register("content")}
              placeholder="Share your thoughts about this recipe..."
              className="mt-1 min-h-[120px] resize-y"
              rows={5}
            />
            {errors.content && (
              <p className="text-sm text-destructive mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4" />
              Rating (Optional)
            </Label>
            <InteractiveRating
              rating={selectedRating}
              onRatingChange={handleRatingChange}
              size={ComponentSize.MD}
              clearable={true}
            />
            {selectedRating && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedRating} star{selectedRating !== 1 ? "s" : ""} out of 5
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Note" : "Add Note"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
