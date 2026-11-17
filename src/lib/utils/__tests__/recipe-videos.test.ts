import { describe, expect, it } from "vitest";
import type { RecipeVideo } from "@/lib/types/recipe-types";
import {
  formatVideoDuration,
  recipeWideVideos,
  videosForStep,
} from "@/lib/utils/recipe-videos";

function video(id: string, stepNumbers: number[]): RecipeVideo {
  return {
    id,
    recipeId: "r",
    filename: `${id}.mp4`,
    originalName: null,
    mimeType: "video/mp4",
    fileSize: 1,
    durationSeconds: null,
    title: null,
    stepNumbers,
    sortOrder: 0,
    uploadedAt: new Date(0),
  };
}

describe("recipe videos", () => {
  const videos = [video("a", [1]), video("b", [1, 2]), video("c", [])];

  it("finds the videos on a step", () => {
    expect(videosForStep(videos, 2).map((item) => item.id)).toEqual(["b"]);
  });

  it("treats untagged videos as covering the whole recipe", () => {
    expect(recipeWideVideos(videos).map((item) => item.id)).toEqual(["c"]);
  });

  it("formats durations like a player does", () => {
    expect(formatVideoDuration(6)).toBe("0:06");
    expect(formatVideoDuration(111)).toBe("1:51");
    expect(formatVideoDuration(3725)).toBe("1:02:05");
    expect(formatVideoDuration(null)).toBe(null);
  });
});
