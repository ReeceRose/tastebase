import { describe, expect, it } from "vitest";
import { safeVideoLink, videoEmbedUrl } from "@/lib/utils/video-embed";

describe("videoEmbedUrl", () => {
  it.each([
    [
      "https://www.youtube.com/watch?v=B3pVIvNtnI8",
      "https://www.youtube-nocookie.com/embed/B3pVIvNtnI8",
    ],
    [
      "https://youtu.be/B3pVIvNtnI8?si=abc",
      "https://www.youtube-nocookie.com/embed/B3pVIvNtnI8",
    ],
    [
      "https://m.youtube.com/watch?v=B3pVIvNtnI8&t=1m30s",
      "https://www.youtube-nocookie.com/embed/B3pVIvNtnI8?start=90",
    ],
    [
      "https://www.youtube.com/shorts/B3pVIvNtnI8",
      "https://www.youtube-nocookie.com/embed/B3pVIvNtnI8",
    ],
    [
      "https://www.youtube.com/embed/B3pVIvNtnI8?start=42",
      "https://www.youtube-nocookie.com/embed/B3pVIvNtnI8?start=42",
    ],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    [
      "https://player.vimeo.com/video/76979871",
      "https://player.vimeo.com/video/76979871",
    ],
  ])("embeds %s", (input, expected) => {
    expect(videoEmbedUrl(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "not a url",
    "https://www.recipetineats.com/chicken-sharwama-middle-eastern",
    "https://www.youtube.com/c/recipetineats",
    "https://www.youtube.com/watch?v=short",
    "javascript:alert(1)",
  ])("does not embed %s", (input) => {
    expect(videoEmbedUrl(input)).toBeNull();
  });
});

describe("safeVideoLink", () => {
  it("keeps http and https links", () => {
    expect(safeVideoLink("https://www.tiktok.com/@cook/video/1")).toBe(
      "https://www.tiktok.com/@cook/video/1",
    );
  });

  it("drops other schemes", () => {
    expect(safeVideoLink("javascript:alert(1)")).toBeNull();
    expect(safeVideoLink(null)).toBeNull();
  });
});
