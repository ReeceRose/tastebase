"use client";

import { Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { type Dispatch, type SetStateAction, useTransition } from "react";
import { toast } from "sonner";
import { EditorSectionCard } from "@/components/forms/recipe-editor/editor-field";
import { EditorPhotoSuggestions } from "@/components/forms/recipe-editor/editor-photo-suggestions";
import { ImageUpload } from "@/components/recipe-images/image-upload";
import {
  attachImageToRecipe,
  deleteRecipeImage,
  getRecipeImages,
  setHeroImage,
} from "@/lib/server-actions/recipe-image-actions";
import { EditorSection } from "@/lib/types";
import type { PhotoSuggestion } from "@/lib/types/import-types";
import type { PendingImage, RecipeImage } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { mimeTypeFor } from "@/lib/utils/recipe-editor-values";

interface EditorPhotosProps {
  recipeId: string | null;
  title: string;
  images: RecipeImage[];
  onImagesChange: (images: RecipeImage[]) => void;
  pending: PendingImage[];
  onPendingChange: Dispatch<SetStateAction<PendingImage[]>>;
  suggestions: PhotoSuggestion[];
}

interface UploadedFile {
  filename: string;
  originalName: string;
  url: string;
  fileSize: number;
  width?: number;
  height?: number;
}

const tileButton =
  "grid size-9 place-items-center rounded-full bg-white/90 text-ink-fixed outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring";

export function EditorPhotos({
  recipeId,
  title,
  images,
  onImagesChange,
  pending,
  onPendingChange,
  suggestions,
}: EditorPhotosProps) {
  const [isWorking, startWork] = useTransition();

  const refresh = async (id: string) => {
    const result = await getRecipeImages(id);
    if (result.success && result.data) onImagesChange(result.data);
  };

  const handleUpload = (file: UploadedFile) => {
    const next: PendingImage = {
      filename: file.filename,
      originalName: file.originalName,
      fileSize: file.fileSize,
      width: file.width ?? null,
      height: file.height ?? null,
      url: file.url,
    };
    if (!recipeId) {
      onPendingChange([...pending, next]);
      return;
    }
    startWork(async () => {
      const result = await attachImageToRecipe({
        recipeId,
        filename: next.filename,
        originalName: next.originalName,
        mimeType: mimeTypeFor(next.filename),
        fileSize: next.fileSize,
        width: next.width ?? undefined,
        height: next.height ?? undefined,
        altText: title || undefined,
        isHero: images.length === 0,
      });
      if (!result.success) {
        toast.error(result.error || "That photo didn't attach. Try again.");
        return;
      }
      await refresh(recipeId);
    });
  };

  const makeMain = (imageId: string) => {
    if (!recipeId) return;
    startWork(async () => {
      const result = await setHeroImage(recipeId, imageId);
      if (!result.success) {
        toast.error(result.error || "Couldn't change the main photo");
        return;
      }
      await refresh(recipeId);
    });
  };

  const removeSaved = (imageId: string) => {
    if (!recipeId) return;
    startWork(async () => {
      const result = await deleteRecipeImage(imageId);
      if (!result.success) {
        toast.error(result.error || "That photo didn't delete. Try again.");
        return;
      }
      await refresh(recipeId);
    });
  };

  const hasPhotos = images.length > 0 || pending.length > 0;

  return (
    <EditorSectionCard
      id={EditorSection.PHOTOS}
      title="Photos"
      description="The main photo shows on the recipe tile and at the top of the recipe. Without one, the recipe uses its colour."
    >
      {hasPhotos && (
        <ul
          className={cn(
            "mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
            isWorking && "opacity-60",
          )}
          aria-busy={isWorking}
        >
          {images.map((image) => (
            <li
              key={image.id}
              className="relative aspect-[4/3] overflow-hidden rounded-control bg-muted"
            >
              <Image
                src={`/api/recipes/images/${image.filename}`}
                alt={image.altText || ""}
                fill
                sizes="240px"
                className="object-cover"
                unoptimized
              />
              {image.isHero && (
                <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-caption text-accent-foreground">
                  Main photo
                </span>
              )}
              <div className="absolute right-2 bottom-2 flex gap-1.5">
                {!image.isHero && (
                  <button
                    type="button"
                    className={tileButton}
                    onClick={() => makeMain(image.id)}
                    aria-label="Make this the main photo"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  className={tileButton}
                  onClick={() => removeSaved(image.id)}
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {pending.map((image, index) => (
            <li
              key={image.filename}
              className="relative aspect-[4/3] overflow-hidden rounded-control bg-muted"
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="240px"
                className="object-cover"
                unoptimized
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-caption text-accent-foreground">
                  Main photo
                </span>
              )}
              <div className="absolute right-2 bottom-2 flex gap-1.5">
                {index > 0 && (
                  <button
                    type="button"
                    className={tileButton}
                    onClick={() =>
                      onPendingChange([
                        image,
                        ...pending.filter(
                          (item) => item.filename !== image.filename,
                        ),
                      ])
                    }
                    aria-label="Make this the main photo"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  className={tileButton}
                  onClick={() =>
                    onPendingChange(
                      pending.filter(
                        (item) => item.filename !== image.filename,
                      ),
                    )
                  }
                  aria-label="Remove photo"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!recipeId && (
        <EditorPhotoSuggestions
          suggestions={suggestions}
          pending={pending}
          onPendingChange={onPendingChange}
        />
      )}

      <ImageUpload
        onUploadComplete={handleUpload}
        onUploadError={(error) => toast.error(error)}
        maxFiles={8}
      />
    </EditorSectionCard>
  );
}
