import { describe, expect, it } from "vitest";
import {
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";
import {
  mergePhotoSuggestions,
  photoKey,
  sizeFromUrl,
} from "@/lib/utils/photo-suggestions";

function result(
  imageUrl: string | null,
  photoUrls: string[],
): RecipeImportResult {
  return {
    recipe: {
      title: null,
      description: null,
      servings: null,
      prepTime: null,
      cookTime: null,
      ingredients: [],
      instructions: [],
      tags: [],
      difficulty: null,
      cuisine: null,
    },
    source: RecipeImportSource.JSON_LD,
    confidence: 1,
    sourceUrl: null,
    sourceName: null,
    rawText: null,
    imageUrl,
    image: null,
    photoUrls,
    warnings: [],
  };
}

describe("photoKey", () => {
  it("treats resized copies of a photo as the same photo", () => {
    expect(photoKey("https://a.com/up/soup-1024x683.jpg")).toBe(
      photoKey("https://a.com/up/soup.jpg?resize=500"),
    );
    expect(
      photoKey("https://static01.nyt.com/x/Cookies-threeByTwoLargeAt2X.jpg"),
    ).toBe(
      photoKey(
        "https://static01.nyt.com/x/Cookies-videoSixteenByNineJumbo1600.jpg",
      ),
    );
    expect(photoKey("https://a.com/soup-1.jpg")).not.toBe(
      photoKey("https://a.com/soup-2.jpg"),
    );
  });
});

describe("sizeFromUrl", () => {
  it("reads sizes from file names and resize parameters", () => {
    expect(sizeFromUrl("https://a.com/soup-500x375.jpg")).toEqual({
      width: 500,
      height: 375,
    });
    expect(sizeFromUrl("https://a.com/soup.jpg?resize=1200%2C857")).toEqual({
      width: 1200,
      height: 857,
    });
    expect(sizeFromUrl("https://a.com/soup.jpg")).toBeNull();
  });
});

describe("mergePhotoSuggestions", () => {
  it("keeps captured photos first and drops the main photo and duplicates", () => {
    const captured = [
      { url: "https://a.com/soup.jpg", image: null },
      {
        url: "https://a.com/step-1.jpg",
        image: { data: "x", mimeType: "image/jpeg" },
      },
    ];
    const merged = mergePhotoSuggestions(
      captured,
      result("https://a.com/soup-1200x800.jpg", [
        "https://a.com/step-1-300x200.jpg",
        "https://a.com/step-2.jpg",
      ]),
    );
    expect(merged.map((photo) => photo.url)).toEqual([
      "https://a.com/step-1.jpg",
      "https://a.com/step-2.jpg",
    ]);
    expect(merged[0].image).not.toBeNull();
  });
});
