"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { JournalPhotoPicker } from "@/components/forms/journal-photo-picker";
import { JournalRecipeField } from "@/components/forms/journal-recipe-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InteractiveRating } from "@/components/ui/rating-display";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveJournalEntry } from "@/lib/server-actions/journal-actions";
import { ButtonVariant, ComponentSize, JournalEntryKind } from "@/lib/types";
import type {
  JournalEntry,
  JournalEntryRecipe,
  JournalPhotoUpload,
} from "@/lib/types/journal-types";
import type { LinkedRecipe } from "@/lib/types/recipe-types";
import {
  JOURNAL_CONTENT_MAX,
  JOURNAL_TITLE_MAX,
  localDay,
  timestampToDay,
  toJournalEntryKind,
} from "@/lib/utils/journal";

const KIND_OPTIONS = [
  { value: JournalEntryKind.COOKED, label: "I made something" },
  { value: JournalEntryKind.NOTE, label: "A note" },
];

interface JournalEntryFormProps {
  entry: JournalEntry | null;
  presetRecipe: LinkedRecipe | null;
  defaultKind: JournalEntryKind;
  onDone: () => void;
}

export function JournalEntryForm({
  entry,
  presetRecipe,
  defaultKind,
  onDone,
}: JournalEntryFormProps) {
  const router = useRouter();
  const dateId = useId();
  const titleId = useId();
  const contentId = useId();
  const privateId = useId();
  const today = localDay();
  const [kind, setKind] = useState(entry?.kind ?? defaultKind);
  const [recipes, setRecipes] = useState<JournalEntryRecipe[]>(
    entry?.recipes ??
      (presetRecipe
        ? [
            {
              recipeId: presetRecipe.id,
              slug: presetRecipe.slug,
              title: presetRecipe.title,
              swatch: null,
            },
          ]
        : []),
  );
  const [happenedOn, setHappenedOn] = useState(
    entry ? timestampToDay(entry.happenedAt) : today,
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [photos, setPhotos] = useState<JournalPhotoUpload[]>(
    entry?.photos ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [onlyMe, setOnlyMe] = useState(entry?.isPrivate ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const cooked = kind === JournalEntryKind.COOKED;

  const save = () => {
    if (cooked && recipes.length === 0) {
      setError("Pick the recipe you made.");
      return;
    }
    if (!cooked && !title.trim() && !content.trim() && photos.length === 0) {
      setError("Write something or add a photo.");
      return;
    }
    setError(null);
    startSaving(async () => {
      const result = await saveJournalEntry({
        id: entry?.id ?? null,
        kind,
        recipes: recipes.map((recipe) => ({
          recipeId: recipe.recipeId,
          title: recipe.title,
        })),
        title: cooked ? null : title,
        content,
        rating: cooked ? rating : null,
        isPrivate: onlyMe,
        happenedOn,
        photos: photos.map((photo) => ({
          filename: photo.filename,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          fileSize: photo.fileSize,
          width: photo.width,
          height: photo.height,
        })),
      });
      if (!result.success) {
        setError(result.error ?? "That entry didn't save. Try again.");
        return;
      }
      toast.success(entry ? "Entry saved" : "Added to your journal");
      router.refresh();
      onDone();
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <SegmentedControl
        label="Kind of entry"
        options={KIND_OPTIONS}
        value={kind}
        onValueChange={(value) => setKind(toJournalEntryKind(value))}
        className="w-full [&>*]:flex-1"
      />

      <JournalRecipeField
        recipes={recipes}
        optional={!cooked}
        onRecipesChange={setRecipes}
      />

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="space-y-2">
          <Label htmlFor={dateId}>{cooked ? "Made on" : "Date"}</Label>
          <Input
            id={dateId}
            type="date"
            value={happenedOn}
            max={today}
            required
            onChange={(event) => setHappenedOn(event.target.value)}
            className="h-11 w-44"
          />
        </div>
        {cooked && (
          <div className="space-y-2 pb-2.5">
            <span className="block text-sm font-semibold">How was it?</span>
            <InteractiveRating
              rating={rating ?? undefined}
              onRatingChange={(value) => setRating(value ?? null)}
              size={ComponentSize.MD}
            />
          </div>
        )}
      </div>

      {!cooked && (
        <div className="space-y-2">
          <Label htmlFor={titleId}>Title</Label>
          <Input
            id={titleId}
            value={title}
            maxLength={JOURNAL_TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional"
            className="h-11"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={contentId}>{cooked ? "Notes" : "Note"}</Label>
        <Textarea
          id={contentId}
          value={content}
          maxLength={JOURNAL_CONTENT_MAX}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            cooked
              ? "Who you made it for, what you changed, how it went"
              : "Anything you want to remember"
          }
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold">Photos</span>
        <JournalPhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          onUploadingChange={setUploading}
        />
      </div>

      <label
        htmlFor={privateId}
        className="flex items-center justify-between gap-3 text-sm font-semibold"
      >
        Only visible to me
        <Switch id={privateId} checked={onlyMe} onCheckedChange={setOnlyMe} />
      </label>

      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant={ButtonVariant.GHOST}
          onClick={onDone}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || uploading}>
          {isSaving
            ? "Saving…"
            : uploading
              ? "Uploading…"
              : entry
                ? "Save entry"
                : "Add to journal"}
        </Button>
      </div>
    </form>
  );
}
