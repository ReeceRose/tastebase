"use client";

import { Loader2, Play, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { VideoPreview } from "@/components/modals/video-preview-dialog";
import { Button } from "@/components/ui/button";
import { importSuggestedVideoAction } from "@/lib/server-actions/recipe-import-actions";
import { ButtonVariant } from "@/lib/types";
import type { ImportedVideo } from "@/lib/types/import-types";
import type { PendingVideo } from "@/lib/types/recipe-types";
import { formatVideoDuration } from "@/lib/utils/recipe-videos";

interface EditorVideoSuggestionsProps {
  suggestions: ImportedVideo[];
  addedUrls: Set<string>;
  onAdded: (suggestion: ImportedVideo, video: PendingVideo) => void;
  onPreview: (preview: VideoPreview) => void;
}

function suggestionLabel(video: ImportedVideo): string {
  const parts = [
    video.stepNumber ? `Step ${video.stepNumber}` : "Whole recipe",
    formatVideoDuration(video.durationSeconds),
  ];
  return parts.filter(Boolean).join(" · ");
}

export function EditorVideoSuggestions({
  suggestions,
  addedUrls,
  onAdded,
  onPreview,
}: EditorVideoSuggestionsProps) {
  const [adding, setAdding] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<Set<string>>(() => new Set());

  const visible = suggestions.filter(
    (video) => !addedUrls.has(video.url) && !failed.has(video.url),
  );
  const remaining = visible.filter((video) => !adding.has(video.url));

  const setBusy = (urls: string[], busy: boolean) =>
    setAdding((current) => {
      const next = new Set(current);
      for (const url of urls) {
        if (busy) next.add(url);
        else next.delete(url);
      }
      return next;
    });

  const addOne = async (suggestion: ImportedVideo) => {
    setBusy([suggestion.url], true);
    const result = await importSuggestedVideoAction(suggestion).catch(
      () => null,
    );
    setBusy([suggestion.url], false);
    if (!result?.success) {
      toast.error(result?.error ?? "That video couldn't be added");
      return;
    }
    if (!result.data.video) {
      toast.error(result.data.error ?? "That video couldn't be added");
      setFailed((current) => new Set(current).add(suggestion.url));
      return;
    }
    onAdded(suggestion, result.data.video);
  };

  const addAll = async () => {
    const videos = remaining;
    setBusy(
      videos.map((video) => video.url),
      true,
    );
    for (const video of videos) {
      await addOne(video);
    }
  };

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="font-semibold">Videos on the recipe page</h4>
          <p className="text-meta text-muted-foreground">
            Adding one saves a copy here, so it keeps working if the site
            changes.
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
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((video) => {
          const busy = adding.has(video.url);
          return (
            <li key={video.url} className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-control bg-muted">
                <video
                  src={`${video.url}#t=0.1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover opacity-80"
                />
                <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-caption text-ink-fixed">
                  {suggestionLabel(video)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onPreview({
                      src: video.url,
                      title: video.name ?? "Video from the recipe page",
                      description: suggestionLabel(video),
                    })
                  }
                  aria-label={`Watch ${suggestionLabel(video)} video`}
                  className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-white/90 text-ink-fixed outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <Play className="size-4" />
                </button>
              </div>
              <Button
                type="button"
                size="sm"
                variant={ButtonVariant.OUTLINE}
                className="w-full"
                aria-busy={busy}
                disabled={busy}
                onClick={() => addOne(video)}
              >
                {busy ? <Loader2 className="animate-spin" /> : <Plus />}
                {busy ? "Downloading" : "Add video"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
