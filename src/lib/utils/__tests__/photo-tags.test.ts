import { describe, expect, it } from "vitest";
import { PhotoRole } from "@/lib/types";
import type {
  EditorInstruction,
  RecipeImage,
  RecipeInstruction,
} from "@/lib/types/recipe-types";
import {
  photosForStep,
  photoTagsForSave,
  photoTagsFromRecipe,
  withPhotoTag,
} from "@/lib/utils/photo-tags";

function image(
  id: string,
  photoRole: PhotoRole | null,
  stepNumber: number | null,
): RecipeImage {
  return {
    id,
    recipeId: "recipe-1",
    filename: `${id}.jpg`,
    originalName: null,
    mimeType: "image/jpeg",
    fileSize: 1,
    width: null,
    height: null,
    altText: null,
    isHero: false,
    sortOrder: 0,
    photoRole,
    stepNumber,
    metadata: null,
    uploadedAt: new Date(0),
  };
}

function instruction(id: string, stepNumber: number): RecipeInstruction {
  return {
    id,
    recipeId: "recipe-1",
    stepNumber,
    instruction: `Step ${stepNumber}`,
    timeMinutes: null,
    temperature: null,
    notes: null,
    groupName: null,
  };
}

function editorStep(key: string): EditorInstruction {
  return { key, instruction: key };
}

describe("photoTagsFromRecipe", () => {
  it("points step photos at the step's key and keeps other roles", () => {
    expect(
      photoTagsFromRecipe(
        [
          image("a", PhotoRole.STEP, 2),
          image("b", PhotoRole.FINISHED, null),
          image("c", null, null),
          image("d", PhotoRole.STEP, 9),
        ],
        [instruction("s1", 1), instruction("s2", 2)],
      ),
    ).toEqual([
      { photo: "a", role: PhotoRole.STEP, stepKey: "s2" },
      { photo: "b", role: PhotoRole.FINISHED, stepKey: null },
    ]);
  });
});

describe("photoTagsForSave", () => {
  it("follows steps that moved and drops steps that were removed", () => {
    expect(
      photoTagsForSave(
        [
          { photo: "a", role: PhotoRole.STEP, stepKey: "second" },
          { photo: "b", role: PhotoRole.STEP, stepKey: "gone" },
          { photo: "c", role: PhotoRole.INGREDIENTS, stepKey: null },
        ],
        [editorStep("second"), editorStep("first")],
      ),
    ).toEqual([
      { photo: "a", role: PhotoRole.STEP, stepNumber: 1 },
      { photo: "c", role: PhotoRole.INGREDIENTS, stepNumber: null },
    ]);
  });
});

describe("withPhotoTag", () => {
  it("replaces a photo's tag or clears it", () => {
    const tags = [{ photo: "a", role: PhotoRole.FINISHED, stepKey: null }];
    const ingredients = {
      photo: "a",
      role: PhotoRole.INGREDIENTS,
      stepKey: null,
    };
    expect(withPhotoTag(tags, "a", ingredients)).toEqual([ingredients]);
    expect(withPhotoTag(tags, "a", null)).toEqual([]);
  });
});

describe("photosForStep", () => {
  it("finds only that step's photos", () => {
    const images = [
      image("a", PhotoRole.STEP, 1),
      image("b", PhotoRole.STEP, 2),
      image("c", PhotoRole.FINISHED, null),
    ];
    expect(photosForStep(images, 2).map((item) => item.id)).toEqual(["b"]);
  });
});
