import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchRecipeImage: vi.fn(),
  saveRecipeImage: vi.fn(),
}));

vi.mock("@/lib/import/fetch-page", () => ({
  fetchRecipeImage: mocks.fetchRecipeImage,
}));
vi.mock("@/lib/file-storage", () => ({
  saveRecipeImage: mocks.saveRecipeImage,
}));

import { attachImportedPhoto } from "@/lib/import/import-image";
import {
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";

const RESULT: RecipeImportResult = {
  recipe: {
    title: "Soup",
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
  confidence: 0.95,
  sourceUrl: "https://example.com/soup",
  sourceName: "Example",
  rawText: null,
  imageUrl: "https://img.example.com/soup.webp",
  image: null,
  photoUrls: [],
  warnings: [],
};

function photo(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: "#f4b400" },
  })
    .webp()
    .toBuffer();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.saveRecipeImage.mockImplementation(async (file: File) => ({
    filename: "saved.jpg",
    originalName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    width: 800,
    height: 450,
  }));
});

describe("attachImportedPhoto", () => {
  it("uses the photo the browser captured instead of downloading it", async () => {
    const captured = (await photo(800, 450)).toString("base64");

    const result = await attachImportedPhoto(RESULT, {
      data: captured,
      mimeType: "image/webp",
    });

    expect(mocks.fetchRecipeImage).not.toHaveBeenCalled();
    const saved = mocks.saveRecipeImage.mock.calls[0][0] as File;
    expect(saved.type).toBe("image/jpeg");
    expect(saved.name).toBe("soup.jpg");
    expect(result.image?.url).toBe("/api/recipes/images/saved.jpg");
  });

  it("downloads the photo when the browser didn't send one", async () => {
    mocks.fetchRecipeImage.mockResolvedValue(await photo(800, 450));

    const result = await attachImportedPhoto(RESULT, null);

    expect(mocks.fetchRecipeImage).toHaveBeenCalledWith(RESULT.imageUrl);
    expect(result.image).not.toBeNull();
  });

  it("skips images too small to be the recipe photo", async () => {
    mocks.fetchRecipeImage.mockResolvedValue(await photo(120, 120));

    const result = await attachImportedPhoto(RESULT, null);

    expect(mocks.saveRecipeImage).not.toHaveBeenCalled();
    expect(result.image).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  it("keeps the recipe and explains when the photo can't be fetched", async () => {
    mocks.fetchRecipeImage.mockRejectedValue(new Error("HTTP 403"));

    const result = await attachImportedPhoto(RESULT, null);

    expect(result.image).toBeNull();
    expect(result.warnings).toHaveLength(1);
  });
});
