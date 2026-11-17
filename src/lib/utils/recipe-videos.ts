import type { RecipeVideo } from "@/lib/types/recipe-types";

export function videosForStep(
  videos: RecipeVideo[],
  stepNumber: number,
): RecipeVideo[] {
  return videos.filter((video) => video.stepNumbers.includes(stepNumber));
}

// Videos not tied to a step cover the whole recipe.
export function recipeWideVideos(videos: RecipeVideo[]): RecipeVideo[] {
  return videos.filter((video) => video.stepNumbers.length === 0);
}

// "0:06", "1:51", "1:02:05".
export function formatVideoDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}
