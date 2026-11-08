import { describe, expect, it } from "vitest";
import type { PhotoSuggestion } from "@/lib/types/import-types";
import { batchPhotoSuggestions } from "@/lib/utils/photo-suggestions";

function photo(name: string, capturedBytes: number | null): PhotoSuggestion {
  return {
    url: `https://example.com/${name}.jpg`,
    image:
      capturedBytes === null
        ? null
        : { data: "a".repeat(capturedBytes), mimeType: "image/jpeg" },
    stepNumber: null,
  };
}

const names = (batches: PhotoSuggestion[][]) =>
  batches.map((batch) => batch.map((item) => item.url.split("/").pop()));

describe("batchPhotoSuggestions", () => {
  it("groups photos up to the per-batch count", () => {
    const photos = ["a", "b", "c", "d", "e"].map((name) => photo(name, null));
    expect(names(batchPhotoSuggestions(photos, 2, 100))).toEqual([
      ["a.jpg", "b.jpg"],
      ["c.jpg", "d.jpg"],
      ["e.jpg"],
    ]);
  });

  it("starts a new batch before captured data passes the byte limit", () => {
    const photos = [photo("a", 60), photo("b", 30), photo("c", 30)];
    expect(names(batchPhotoSuggestions(photos, 4, 100))).toEqual([
      ["a.jpg", "b.jpg"],
      ["c.jpg"],
    ]);
  });

  it("sends an oversized photo on its own", () => {
    const photos = [photo("a", 10), photo("b", 500), photo("c", 10)];
    expect(names(batchPhotoSuggestions(photos, 4, 100))).toEqual([
      ["a.jpg"],
      ["b.jpg"],
      ["c.jpg"],
    ]);
  });
});
