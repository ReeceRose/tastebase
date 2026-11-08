"use client";

import {
  type Dispatch,
  type SetStateAction,
  useState,
  useTransition,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { EditorSectionCard } from "@/components/forms/recipe-editor/editor-field";
import { EditorPhotoSuggestions } from "@/components/forms/recipe-editor/editor-photo-suggestions";
import { EditorPhotoTagPicker } from "@/components/forms/recipe-editor/editor-photo-tag-picker";
import { EditorPhotoTile } from "@/components/forms/recipe-editor/editor-photo-tile";
import { ImageUpload } from "@/components/recipe-images/image-upload";
import {
  attachImageToRecipe,
  deleteRecipeImage,
  getRecipeImages,
  reorderRecipeImages,
} from "@/lib/server-actions/recipe-image-actions";
import { EditorSection } from "@/lib/types";
import type { PhotoSuggestion } from "@/lib/types/import-types";
import type {
  EditorPhotoTag,
  EditorStepOption,
  PendingImage,
  RecipeEditorValues,
  RecipeImage,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { withPhotoTag } from "@/lib/utils/photo-tags";
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

const STEP_PREVIEW_LENGTH = 48;

interface PhotoTile {
  key: string;
  src: string;
  alt: string;
  move: (to: number) => void;
  remove: () => void;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

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
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const { control, getValues, setValue } = useFormContext<RecipeEditorValues>();
  const instructions = useWatch({ control, name: "instructions" });
  const photoTags = useWatch({ control, name: "photoTags" }) ?? [];

  const steps: EditorStepOption[] = (instructions ?? []).flatMap(
    (instruction, index) => {
      const text = instruction.instruction.trim();
      if (!text || !instruction.key) return [];
      return [
        {
          key: instruction.key,
          number: index + 1,
          preview:
            text.length > STEP_PREVIEW_LENGTH
              ? `${text.slice(0, STEP_PREVIEW_LENGTH).trimEnd()}…`
              : text,
          text,
        },
      ];
    },
  );

  const tagFor = (photo: string) =>
    photoTags.find((tag) => tag.photo === photo) ?? null;

  const setTag = (photo: string, tag: EditorPhotoTag | null) =>
    setValue(
      "photoTags",
      withPhotoTag(getValues("photoTags") ?? [], photo, tag),
      { shouldDirty: true },
    );

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
      onPendingChange((current) => [...current, next]);
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

  const moveSaved = (from: number, to: number) => {
    if (!recipeId) return;
    const next = moveItem(images, from, to);
    onImagesChange(next);
    startWork(async () => {
      const result = await reorderRecipeImages(
        recipeId,
        next.map((image) => image.id),
      );
      if (!result.success) {
        toast.error(result.error || "Couldn't reorder the photos");
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

  const tiles: PhotoTile[] = recipeId
    ? images.map((image, index) => ({
        key: image.id,
        src: `/api/recipes/images/${image.filename}`,
        alt: image.altText || "",
        move: (to: number) => moveSaved(index, to),
        remove: () => removeSaved(image.id),
      }))
    : pending.map((image, index) => ({
        key: image.filename,
        src: image.url,
        alt: "",
        move: (to: number) =>
          onPendingChange((current) => moveItem(current, index, to)),
        remove: () =>
          onPendingChange((current) =>
            current.filter((item) => item.filename !== image.filename),
          ),
      }));

  const endDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <EditorSectionCard
      id={EditorSection.PHOTOS}
      title="Photos"
      description="Drag photos or use the arrows to change their order. The first is the main photo, shown on the recipe tile and at the top of the recipe. Without one, the recipe uses its colour. Tag a photo with a step, the ingredients or the finished dish and cook mode shows it when you get there."
    >
      {tiles.length > 0 && (
        <ul
          className={cn(
            "mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
            isWorking && "opacity-60",
          )}
          aria-busy={isWorking}
        >
          {tiles.map((tile, index) => (
            <EditorPhotoTile
              key={tile.key}
              src={tile.src}
              alt={tile.alt}
              index={index}
              count={tiles.length}
              isDragging={dragFrom === index}
              isDropTarget={
                dragFrom !== null && dragFrom !== index && dragOver === index
              }
              onMove={tile.move}
              onRemove={tile.remove}
              onDragStart={() => setDragFrom(index)}
              onDragEnter={() => setDragOver(index)}
              onDragEnd={endDrag}
              footer={
                <EditorPhotoTagPicker
                  photo={tile.key}
                  tag={tagFor(tile.key)}
                  steps={steps}
                  photoNumber={index + 1}
                  onChange={(tag) => setTag(tile.key, tag)}
                />
              }
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== index) {
                  tiles[dragFrom].move(index);
                }
                endDrag();
              }}
            />
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
