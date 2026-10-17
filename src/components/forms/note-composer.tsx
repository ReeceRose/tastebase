"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { NoteTemplates } from "@/components/forms/note-templates";
import { Button } from "@/components/ui/button";
import { InteractiveRating } from "@/components/ui/rating-display";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  addRecipeNote,
  updateRecipeNote,
} from "@/lib/server-actions/recipe-actions";
import { ButtonVariant, ComponentSize } from "@/lib/types";
import type { RecipeNote } from "@/lib/types/recipe-types";

interface NoteComposerProps {
  recipeId: string;
  note?: RecipeNote;
  onDone: () => void;
}

export function NoteComposer({ recipeId, note, onDone }: NoteComposerProps) {
  const router = useRouter();
  const contentId = useId();
  const privateId = useId();
  const [content, setContent] = useState(note?.content ?? "");
  const [rating, setRating] = useState<number | undefined>(
    note?.rating ?? undefined,
  );
  const [onlyMe, setOnlyMe] = useState(note?.isPrivate ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const editing = Boolean(note);

  const save = () => {
    if (!content.trim()) {
      setError("Write something before saving.");
      return;
    }
    setError(null);
    startSaving(async () => {
      const payload = {
        recipeId,
        content: content.trim(),
        rating,
        isPrivate: onlyMe,
      };
      const result = note
        ? await updateRecipeNote({ ...payload, id: note.id })
        : await addRecipeNote(payload);

      if (!result.success) {
        setError(result.error || "That note didn't save. Try again.");
        return;
      }
      toast.success(editing ? "Note saved" : "Note added");
      router.refresh();
      onDone();
    });
  };

  return (
    <div className="space-y-3 rounded-tile bg-card p-4">
      <label htmlFor={contentId} className="sr-only">
        Your note
      </label>
      <Textarea
        id={contentId}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What worked, what you changed, what you'd do next time"
        rows={4}
        autoFocus
        aria-invalid={Boolean(error)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InteractiveRating
          rating={rating}
          onRatingChange={setRating}
          size={ComponentSize.SM}
        />
        <NoteTemplates
          onSelectTemplate={(template) =>
            setContent((current) =>
              current ? `${current}\n\n${template}` : template,
            )
          }
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
          variant={ButtonVariant.GHOST}
          size="sm"
          onClick={onDone}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={isSaving}>
          {isSaving ? "Saving…" : editing ? "Save note" : "Add note"}
        </Button>
      </div>
    </div>
  );
}
