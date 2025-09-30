"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Save, Tag, X } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createTemplate,
  updateTemplate,
} from "@/lib/server-actions/template-actions";
import {
  TEMPLATE_CATEGORIES,
  TemplateCategory,
  type TemplateWithMeta,
} from "@/lib/types/template-types";
import {
  type TemplateFormInput,
  templateFormSchema,
} from "@/lib/validations/template-schemas";

interface TemplateFormProps {
  template?: TemplateWithMeta; // If provided, we're editing
  onSuccess?: (template: TemplateWithMeta) => void;
  onCancel?: () => void;
  className?: string;
}

export function TemplateForm({
  template,
  onSuccess,
  onCancel,
  className,
}: TemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const nameId = useId();
  const descriptionId = useId();
  const contentId = useId();

  const isEditing = Boolean(template);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormInput>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      ...(isEditing && { id: template?.id }),
      name: template?.name || "",
      description: template?.description || "",
      category: template?.category || TemplateCategory.GENERAL,
      content: template?.content || "",
      tags: template?.tags || [],
    },
  });

  const watchedTags = watch("tags") || [];
  const watchedCategory = watch("category");

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      const newTags = [...watchedTags, trimmedTag];
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter((tag) => tag !== tagToRemove);
    setValue("tags", newTags);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: TemplateFormInput) => {
    setIsSubmitting(true);

    try {
      const result =
        isEditing && data.id
          ? await updateTemplate({
              id: data.id,
              name: data.name,
              description: data.description,
              category: data.category,
              content: data.content,
              tags: data.tags,
            })
          : await createTemplate({
              name: data.name,
              description: data.description,
              category: data.category,
              content: data.content,
              tags: data.tags,
            });

      if (result.success) {
        toast.success(
          isEditing
            ? "Template updated successfully!"
            : "Template created successfully!",
        );
        onSuccess?.(result.data as TemplateWithMeta);
      } else {
        toast.error(result.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryDescription = (category: string) => {
    const descriptions = {
      general: "General thoughts and observations",
      modifications: "Changes made to the original recipe",
      tips: "Helpful techniques and shortcuts",
      timing: "Time adjustments and scheduling tips",
      rating: "Overall experience and rating",
    };
    return descriptions[category as keyof typeof descriptions];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isEditing ? "Edit Template" : "Create New Template"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your template content and settings"
            : "Create a custom template to quickly start your recipe notes"}
        </CardDescription>
      </CardHeader>

      <CardContent className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor={nameId}>Template Name *</Label>
            <Input
              id={nameId}
              {...register("name")}
              placeholder="e.g., My Cooking Notes"
              className="w-full"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Input
              id={descriptionId}
              {...register("description")}
              placeholder="Brief description of when to use this template"
              className="w-full"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={watchedCategory}
              onValueChange={(value) =>
                setValue("category", value as TemplateCategory)
              }
            >
              <SelectTrigger className="min-h-[3.5rem] py-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    <div className="flex flex-col items-start">
                      <span className="capitalize">{category}</span>
                      <span className="text-xs text-muted-foreground">
                        {getCategoryDescription(category)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor={contentId}>Template Content *</Label>
            <Textarea
              id={contentId}
              {...register("content")}
              placeholder="Enter your template content with placeholders like {{date}}, {{recipeName}}, etc."
              className="min-h-[200px] resize-y font-mono text-sm w-full"
              rows={10}
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Tip: Use placeholders like {`{{date}}`}, {`{{recipeName}}`},{" "}
              {`{{servings}}`} for dynamic content
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Tag className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {watchedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="!rounded-full cursor-pointer text-xs px-2.5 py-1 h-6 transition-all duration-200 hover:scale-105 hover:shadow-sm pr-1.5 group"
                      onClick={() => removeTag(tag)}
                    >
                      <span className="truncate max-w-[120px]">{tag}</span>
                      <button
                        type="button"
                        className="ml-1.5 -mr-1 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-all duration-200 opacity-60 group-hover:opacity-100"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Click on a tag to remove it. Maximum 10 tags.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
