"use client";

import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importSuggestedPhotoAction } from "@/lib/server-actions/recipe-import-actions";
import { ButtonVariant } from "@/lib/types";
import type { PhotoSuggestion } from "@/lib/types/import-types";
import type { PendingImage } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";

interface EditorPhotoSuggestionsProps {
  suggestions: PhotoSuggestion[];
  pending: PendingImage[];
  onPendingChange: Dispatch<SetStateAction<PendingImage[]>>;
}

function previewSource(photo: PhotoSuggestion): string {
  return photo.image
    ? `data:${photo.image.mimeType};base64,${photo.image.data}`
    : photo.url;
}

export function EditorPhotoSuggestions({
  suggestions,
  pending,
  onPendingChange,
}: EditorPhotoSuggestionsProps) {
  const [addedByUrl, setAddedByUrl] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<Set<string>>(() => new Set());
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const pendingFilenames = new Set(pending.map((image) => image.filename));
  const isAdded = (url: string) =>
    Boolean(addedByUrl[url] && pendingFilenames.has(addedByUrl[url]));
  const visible = suggestions.filter(
    (photo) => !hidden.has(photo.url) && !isAdded(photo.url),
  );
  const remaining = visible.filter((photo) => !adding.has(photo.url));

  const hide = (url: string) =>
    setHidden((current) => new Set(current).add(url));

  const add = async (photo: PhotoSuggestion) => {
    setAdding((current) => new Set(current).add(photo.url));
    const result = await importSuggestedPhotoAction(photo).catch(() => null);
    setAdding((current) => {
      const next = new Set(current);
      next.delete(photo.url);
      return next;
    });
    if (!result?.success) {
      if (result) toast.error(result.error);
      hide(photo.url);
      return;
    }
    setAddedByUrl((current) => ({
      ...current,
      [photo.url]: result.data.filename,
    }));
    onPendingChange((current) => [...current, result.data]);
  };

  const addAll = async () => {
    for (const photo of remaining) {
      await add(photo);
    }
  };

  if (visible.length === 0) return null;

  return (
    <div className="mb-6 space-y-3 border-t border-border pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">More from the recipe page</h3>
          <p className="text-meta text-muted-foreground">
            Add any you want to keep with this recipe.
          </p>
        </div>
        {remaining.length > 1 && (
          <Button
            type="button"
            size="sm"
            variant={ButtonVariant.OUTLINE}
            onClick={addAll}
            disabled={adding.size > 0}
          >
            <Plus />
            Add all {remaining.length}
          </Button>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((photo) => {
          const busy = adding.has(photo.url);
          return (
            <li key={photo.url}>
              <button
                type="button"
                aria-label="Add this photo"
                aria-busy={busy}
                disabled={busy}
                onClick={() => add(photo)}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-control bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <Image
                  src={previewSource(photo)}
                  alt=""
                  fill
                  sizes="240px"
                  className={cn(
                    "object-cover transition-opacity",
                    busy ? "opacity-50" : "opacity-70 group-hover:opacity-100",
                  )}
                  onError={() => hide(photo.url)}
                  unoptimized
                />
                <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-ink-fixed">
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {busy ? "Adding" : "Add"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
