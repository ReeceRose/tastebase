import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { uploadsDir } = await vi.hoisted(async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const nodePath = await import("node:path");
  return {
    uploadsDir: fs.mkdtempSync(nodePath.join(os.tmpdir(), "tastebase-videos-")),
  };
});

vi.mock("@/lib/file-storage", () => ({
  STORAGE_CONFIG: { uploadsDir },
}));

vi.mock("@/lib/config/video-limits", () => ({
  MAX_VIDEO_BYTES: 64,
  MAX_VIDEO_LABEL: "64 bytes",
}));

import {
  RECIPE_VIDEOS_DIR,
  saveRecipeVideo,
  VideoTooLargeError,
} from "@/lib/file-storage/videos";

const MP4_HEADER = Buffer.concat([
  Buffer.from([0, 0, 0, 0x20]),
  Buffer.from("ftypisom", "latin1"),
]);

function streamOf(...chunks: Buffer[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
      controller.close();
    },
  });
}

function storedFiles(): string[] {
  return readdirSync(RECIPE_VIDEOS_DIR);
}

beforeEach(() => {
  rmSync(RECIPE_VIDEOS_DIR, { recursive: true, force: true });
});

afterAll(() => {
  rmSync(uploadsDir, { recursive: true, force: true });
});

describe("saveRecipeVideo", () => {
  it("writes a video that arrives in small chunks", async () => {
    const body = Buffer.concat([MP4_HEADER, Buffer.alloc(20, 7)]);
    const saved = await saveRecipeVideo(
      streamOf(body.subarray(0, 3), body.subarray(3, 10), body.subarray(10)),
    );

    expect(saved?.filename).toMatch(/\.mp4$/);
    expect(saved?.fileSize).toBe(body.length);
    expect(storedFiles()).toEqual([saved?.filename]);
    expect(
      readFileSync(path.join(RECIPE_VIDEOS_DIR, saved?.filename ?? "")),
    ).toEqual(body);
  });

  it("rejects a video past the limit and leaves nothing behind", async () => {
    await expect(
      saveRecipeVideo(streamOf(MP4_HEADER, Buffer.alloc(60))),
    ).rejects.toBeInstanceOf(VideoTooLargeError);
    expect(storedFiles()).toEqual([]);
  });

  it("returns null for a file that isn't a video", async () => {
    const saved = await saveRecipeVideo(
      streamOf(Buffer.from("<!doctype html><html>")),
    );
    expect(saved).toBe(null);
    expect(storedFiles()).toEqual([]);
  });
});
