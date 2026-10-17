import { describe, expect, it } from "vitest";
import { findPagePhotos } from "@/lib/import/page-photos";

const PAGE_URL = "https://blog.example.com/soup/";

function page(body: string): string {
  return `<html><body><header><img src="/logo.png" width="200"></header><article>${body}</article><aside><img src="/sidebar-photo.jpg"></aside></body></html>`;
}

describe("findPagePhotos", () => {
  it("finds content photos in page order, using the largest srcset size", () => {
    const photos = findPagePhotos(
      page(`
        <img src="/soup-300.jpg" srcset="/soup-300.jpg 300w, /soup-1200.jpg 1200w">
        <img data-src="https://cdn.example.com/step-1.jpg">
      `),
      PAGE_URL,
      [],
    );
    expect(photos).toEqual([
      "https://blog.example.com/soup-1200.jpg",
      "https://cdn.example.com/step-1.jpg",
    ]);
  });

  it("skips small, decorative, product and duplicate images", () => {
    const photos = findPagePhotos(
      page(`
        <img src="/tiny.jpg" width="120">
        <img src="/author-headshot.jpg">
        <img src="/divider.svg">
        <a href="https://www.amazon.com/dp/123"><img src="/stand-mixer.jpg"></a>
        <img src="https://m.media-amazon.com/images/I/pan.jpg">
        <img src="/strip.jpg?resize=1200%2C300">
        <a href="https://www.pinterest.com/pin/create"><img src="/soup-bowl.jpg"></a>
        <img src="/soup-bowl-1024x683.jpg">
      `),
      PAGE_URL,
      [],
    );
    expect(photos).toEqual(["https://blog.example.com/soup-bowl.jpg"]);
  });

  it("puts step photos from the recipe data first", () => {
    const photos = findPagePhotos(page(`<img src="/finished.jpg">`), PAGE_URL, [
      "https://blog.example.com/step-2.jpg",
    ]);
    expect(photos).toEqual([
      "https://blog.example.com/step-2.jpg",
      "https://blog.example.com/finished.jpg",
    ]);
  });
});
