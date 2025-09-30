"use client";

import { Edit, Image as ImageIcon, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/recipe-images/image-upload";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AIGeneratedBadge,
  RecipeImageGenerator,
} from "@/components/ui/recipe-image-generator";
import type { RecipeImage } from "@/db/schema.recipes";
import type { ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";
import {
  deleteRecipeImage,
  reorderRecipeImages,
  setHeroImage,
  updateRecipeImage,
} from "@/lib/server-actions/recipe-image-actions";

interface RecipeImageManagerProps {
  recipeId: string;
  images: RecipeImage[];
  onImagesChange?: () => void;
  className?: string;
  recipeData?: ImageGenerationPromptData;
}

interface ImageEditData {
  altText: string;
  isHero: boolean;
}

export function RecipeImageManager({
  recipeId,
  images,
  onImagesChange,
  className,
  recipeData,
}: RecipeImageManagerProps) {
  const altTextId = useId();
  const isHeroId = useId();
  const [showUpload, setShowUpload] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<RecipeImage | null>(null);
  const [editData, setEditData] = useState<ImageEditData>({
    altText: "",
    isHero: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleImageUploadComplete = () => {
    onImagesChange?.();
    toast.success("Image uploaded successfully!");
  };

  const handleSetHero = async (imageId: string) => {
    setIsLoading(true);
    try {
      const result = await setHeroImage(recipeId, imageId);
      if (result.success) {
        toast.success("Hero image updated!");
        onImagesChange?.();
      } else {
        toast.error(result.error || "Failed to set hero image");
      }
    } catch (error) {
      console.error("Error setting hero image:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImage = (image: RecipeImage) => {
    setSelectedImage(image);
    setEditData({
      altText: image.altText || "",
      isHero: image.isHero,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const result = await updateRecipeImage({
        id: selectedImage.id,
        altText: editData.altText,
        isHero: editData.isHero,
      });

      if (result.success) {
        toast.success("Image updated successfully!");
        setShowEditDialog(false);
        onImagesChange?.();
      } else {
        toast.error(result.error || "Failed to update image");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const result = await deleteRecipeImage(selectedImage.id);
      if (result.success) {
        toast.success("Image deleted successfully!");
        setShowDeleteDialog(false);
        onImagesChange?.();
      } else {
        toast.error(result.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedImages = [...images];
    const draggedImage = reorderedImages[draggedIndex];

    // Remove dragged item and insert at new position
    reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    // Create new order array
    const imageIds = reorderedImages.map((img) => img.id);

    try {
      const result = await reorderRecipeImages(recipeId, imageIds);
      if (result.success) {
        toast.success("Images reordered successfully!");
        onImagesChange?.();
      } else {
        toast.error(result.error || "Failed to reorder images");
      }
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("An unexpected error occurred");
    }

    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Recipe Images ({images.length})
            </div>
            <div className="flex items-center gap-2">
              {recipeData && (
                <RecipeImageGenerator
                  recipeId={recipeId}
                  recipeData={recipeData}
                  onImageGenerated={() => {
                    onImagesChange?.();
                    toast.success("AI image generated successfully!");
                  }}
                />
              )}
              <Button onClick={() => setShowUpload(!showUpload)} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUpload && (
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              <ImageUpload
                onUploadComplete={handleImageUploadComplete}
                onUploadError={(error) => toast.error(error)}
                maxFiles={10}
              />
            </div>
          )}

          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images uploaded yet</p>
              <p className="text-sm">Upload some images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images
                .sort((a, b) => {
                  if (a.isHero !== b.isHero) return a.isHero ? -1 : 1;
                  return a.sortOrder - b.sortOrder;
                })
                .map((image, index) => (
                  <Card
                    key={image.id}
                    className={`relative group cursor-move transition-shadow ${
                      draggedIndex === index ? "shadow-lg scale-105" : ""
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <Image
                        src={`/api/recipes/images/${image.filename}`}
                        alt={
                          image.altText || image.originalName || "Recipe image"
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        unoptimized
                      />

                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {image.isHero && (
                          <Badge className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Hero
                          </Badge>
                        )}
                        {image.metadata &&
                        typeof image.metadata === "object" &&
                        "source" in image.metadata &&
                        (image.metadata as { source?: string }).source ===
                          "ai-generated" ? (
                          <AIGeneratedBadge />
                        ) : null}
                      </div>

                      {/* Image overlay with actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditImage(image)}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        {!image.isHero && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetHero(image.id)}
                            disabled={isLoading}
                            className="h-8"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedImage(image);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      <p
                        className="text-xs font-medium truncate"
                        title={image.originalName ?? undefined}
                      >
                        {image.originalName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(image.fileSize)}</span>
                        {image.width && image.height && (
                          <span>
                            {image.width}×{image.height}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}

          {images.length > 1 && (
            <div className="text-xs text-muted-foreground text-center mt-4">
              Drag and drop images to reorder them
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Image Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Update image details and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor={altTextId}>Alt Text (for accessibility)</Label>
              <Input
                id={altTextId}
                placeholder="Describe what's in this image"
                value={editData.altText}
                onChange={(e) =>
                  setEditData({ ...editData, altText: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={isHeroId}
                checked={editData.isHero}
                onChange={(e) =>
                  setEditData({ ...editData, isHero: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor={isHeroId}>
                Set as hero image (main recipe image)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
