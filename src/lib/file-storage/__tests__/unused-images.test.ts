import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { findUnusedImages } from "@/lib/file-storage/unused-images";

const NOW = Date.UTC(2026, 9, 17);
const DAY = 24 * 60 * 60 * 1000;

describe("findUnusedImages", () => {
  it("only picks old originals that no recipe uses", () => {
    const files = [
      { filename: "used.jpg", modifiedAt: NOW - 3 * DAY },
      { filename: "abandoned.jpg", modifiedAt: NOW - 3 * DAY },
      { filename: "abandoned_thumbnail.jpg", modifiedAt: NOW - 3 * DAY },
      { filename: "still-editing.jpg", modifiedAt: NOW - 60 * 1000 },
    ];

    expect(findUnusedImages(files, new Set(["used.jpg"]), NOW)).toEqual([
      "abandoned.jpg",
    ]);
  });
});
