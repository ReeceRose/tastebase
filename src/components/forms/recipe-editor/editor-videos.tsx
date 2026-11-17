"use client";

import { Play, Trash2 } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useTransition,
} from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { EditorPhotoTagPicker } from "@/components/forms/recipe-editor/editor-photo-tag-picker";
import { EditorVideoSuggestions } from "@/components/forms/recipe-editor/editor-video-suggestions";
import { EditorVideoUpload } from "@/components/forms/recipe-editor/editor-video-upload";
import {
  type VideoPreview,
  VideoPreviewDialog,
} from "@/components/modals/video-preview-dialog";
import {
  attachVideosToRecipe,
  deleteRecipeVideoAction,
} from "@/lib/server-actions/recipe-video-actions";
import { PhotoRole } from "@/lib/types";
import type { ImportedVideo } from "@/lib/types/import-types";
import type {
  EditorPhotoTag,
  EditorStepOption,
  PendingVideo,
  RecipeEditorValues,
  RecipeVideo,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { withPhotoTags } from "@/lib/utils/photo-tags";
import { formatVideoDuration } from "@/lib/utils/recipe-videos";

interface EditorVideosProps {
  recipeId: string | null;
  videos: RecipeVideo[];
  onVideosChange: (videos: RecipeVideo[]) => void;
  pending: PendingVideo[];
  onPendingChange: Dispatch<SetStateAction<PendingVideo[]>>;
  suggestions: ImportedVideo[];
  steps: EditorStepOption[];
  tagsFor: (key: string) => EditorPhotoTag[];
  onTagsChange: (key: string, tags: EditorPhotoTag[]) => void;
}

interface VideoTile {
  key: string;
  src: string;
  name: string;
  duration: string | null;
  remove: () => void;
}

const tileButton =
  "grid size-9 place-items-center rounded-full bg-white/90 text-ink-fixed outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring";

export function EditorVideos({
  recipeId,
  videos,
  onVideosChange,
  pending,
  onPendingChange,
  suggestions,
  steps,
  tagsFor,
  onTagsChange,
}: EditorVideosProps) {
  const [isWorking, startWork] = useTransition();
  const [addedByUrl, setAddedByUrl] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const { getValues, setValue } = useFormContext<RecipeEditorValues>();
  const [importedStepKeys] = useState(() =>
    (getValues("instructions") ?? []).map((instruction) => instruction.key),
  );

  const pendingFilenames = new Set(pending.map((video) => video.filename));
  const addedUrls = new Set(
    Object.entries(addedByUrl)
      .filter(([, filename]) => pendingFilenames.has(filename))
      .map(([url]) => url),
  );

  const handleAdded = (suggestion: ImportedVideo, video: PendingVideo) => {
    setAddedByUrl((current) => ({
      ...current,
      [suggestion.url]: video.filename,
    }));
    onPendingChange((current) => [...current, video]);
    const stepKey = suggestion.stepNumber
      ? importedStepKeys[suggestion.stepNumber - 1]
      : null;
    if (!stepKey) return;
    setValue(
      "photoTags",
      withPhotoTags(getValues("photoTags") ?? [], video.filename, [
        { photo: video.filename, role: PhotoRole.STEP, stepKey },
      ]),
      { shouldDirty: true },
    );
  };

  const handleUploaded = async (video: PendingVideo) => {
    if (!recipeId) {
      onPendingChange((current) => [...current, video]);
      return;
    }
    const result = await attachVideosToRecipe({
      recipeId,
      videos: [
        {
          filename: video.filename,
          originalName: video.originalName,
          fileSize: video.fileSize,
          durationSeconds: video.durationSeconds,
          title: video.title,
          stepNumbers: [],
        },
      ],
    }).catch(() => null);
    if (!result?.success) {
      toast.error(result?.error ?? "That video didn't attach. Try again.");
      return;
    }
    onVideosChange([...videos, ...result.data]);
  };

  const removeSaved = (videoId: string) =>
    startWork(async () => {
      const result = await deleteRecipeVideoAction(videoId).catch(() => null);
      if (!result?.success) {
        toast.error(result?.error ?? "That video didn't delete. Try again.");
        return;
      }
      onVideosChange(videos.filter((video) => video.id !== videoId));
    });

  const tiles: VideoTile[] = recipeId
    ? videos.map((video) => ({
        key: video.id,
        src: `/api/recipes/videos/${video.filename}`,
        name: video.title ?? video.originalName ?? "Video",
        duration: formatVideoDuration(video.durationSeconds),
        remove: () => removeSaved(video.id),
      }))
    : pending.map((video) => ({
        key: video.filename,
        src: video.url,
        name: video.title ?? video.originalName,
        duration: formatVideoDuration(video.durationSeconds),
        remove: () =>
          onPendingChange((current) =>
            current.filter((item) => item.filename !== video.filename),
          ),
      }));

  const showSuggestions = !recipeId && suggestions.length > 0;

  return (
    <div className="mb-6 space-y-5 border-t border-border pt-5">
      <div>
        <h3 className="font-semibold">Videos</h3>
        <p className="text-meta text-muted-foreground">
          Step videos play on mute beside their step and in cook mode. Use the
          speaker button to hear them. Videos without a step go in the
          recipe&apos;s Video panel. Press play on any video to watch it here.
        </p>
      </div>
      {tiles.length > 0 && (
        <ul
          className={cn(
            "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
            isWorking && "opacity-60",
          )}
          aria-busy={isWorking}
        >
          {tiles.map((tile, index) => (
            <li key={tile.key} className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-control bg-muted">
                <video
                  src={`${tile.src}#t=0.1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                />
                {tile.duration && (
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-caption text-ink-fixed tabular">
                    {tile.duration}
                  </span>
                )}
                <div className="absolute right-2 bottom-2 flex gap-1.5">
                  <button
                    type="button"
                    className={tileButton}
                    onClick={() =>
                      setPreview({
                        src: tile.src,
                        title: tile.name,
                        description: tile.duration,
                      })
                    }
                    aria-label={`Watch video ${index + 1}`}
                  >
                    <Play className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={tileButton}
                    onClick={tile.remove}
                    aria-label={`Delete video ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <EditorPhotoTagPicker
                photo={tile.key}
                tags={tagsFor(tile.key)}
                steps={steps}
                photoNumber={index + 1}
                onChange={(tags) => onTagsChange(tile.key, tags)}
                forVideo
              />
            </li>
          ))}
        </ul>
      )}
      <EditorVideoUpload onUploaded={handleUploaded} />
      {showSuggestions && (
        <EditorVideoSuggestions
          suggestions={suggestions}
          addedUrls={addedUrls}
          onAdded={handleAdded}
          onPreview={setPreview}
        />
      )}
      <VideoPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
