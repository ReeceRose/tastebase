import { saveRecipeVideo } from "@/lib/file-storage/videos";
import { fetchRecipeVideo } from "@/lib/import/fetch-page";
import type { ImportedVideo } from "@/lib/types/import-types";
import type { PendingVideo } from "@/lib/types/recipe-types";

function originalNameFor(url: string): string {
  const base = new URL(url).pathname.split("/").pop() ?? "";
  return base.slice(0, 120) || "imported-video";
}

// Downloads a video from the recipe page and keeps it with the other
// uploads. Returns null when the download isn't a video a browser can play.
export async function saveSuggestedVideo(
  video: ImportedVideo,
): Promise<PendingVideo | null> {
  const saved = await saveRecipeVideo(await fetchRecipeVideo(video.url));
  if (!saved) return null;
  return {
    filename: saved.filename,
    originalName: originalNameFor(video.url),
    fileSize: saved.fileSize,
    durationSeconds: video.durationSeconds,
    title: video.name,
    url: `/api/recipes/videos/${saved.filename}`,
  };
}
