import { describe, expect, it } from "vitest";
import {
  detectVideoFormat,
  isVideoFilename,
  videoMimeTypeFor,
} from "@/lib/file-storage/videos";

describe("detectVideoFormat", () => {
  it("recognises MP4 by its ftyp box", () => {
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 0x20]),
      Buffer.from("ftypisom0000", "latin1"),
    ]);
    expect(detectVideoFormat(mp4)?.extension).toBe(".mp4");
  });

  it("recognises WebM by its EBML header", () => {
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00]);
    expect(detectVideoFormat(webm)?.extension).toBe(".webm");
  });

  it("rejects anything else, like an HTML error page", () => {
    expect(detectVideoFormat(Buffer.from("<!doctype html><html>"))).toBe(null);
  });
});

describe("video filenames", () => {
  it("only accepts the names Tastebase gives videos", () => {
    expect(isVideoFilename("0b6c1f3e-1d2a-4b4e-9c1a-1a2b3c4d5e6f.mp4")).toBe(
      true,
    );
    expect(isVideoFilename("../secret.mp4")).toBe(false);
    expect(isVideoFilename("photo.jpg")).toBe(false);
  });

  it("serves each container with its own type", () => {
    expect(videoMimeTypeFor("a.webm")).toBe("video/webm");
    expect(videoMimeTypeFor("a.mp4")).toBe("video/mp4");
  });
});
