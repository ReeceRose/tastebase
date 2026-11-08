import { describe, expect, it } from "vitest";
import { PhotoRole } from "@/lib/types";
import type {
  EditorInstruction,
  RecipeImage,
  RecipeInstruction,
} from "@/lib/types/recipe-types";
import {
  photoRoleLabel,
  photosForStep,
  photoTagsForSave,
  photoTagsFromRecipe,
  stepNumbersLabel,
  withPhotoTags,
} from "@/lib/utils/photo-tags";

function image(
  id: string,
  photoRole: PhotoRole | null,
  stepNumbers: number[] = [],
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
    stepNumbers,
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
          image("a", PhotoRole.STEP, [2]),
          image("b", PhotoRole.FINISHED),
          image("c", null),
          image("d", PhotoRole.STEP, [9]),
        ],
        [instruction("s1", 1), instruction("s2", 2)],
      ),
    ).toEqual([
      { photo: "a", role: PhotoRole.STEP, stepKey: "s2" },
      { photo: "b", role: PhotoRole.FINISHED, stepKey: null },
    ]);
  });

  it("gives a photo on several steps one tag per step", () => {
    expect(
      photoTagsFromRecipe(
        [image("a", PhotoRole.STEP, [1, 2, 9])],
        [instruction("s1", 1), instruction("s2", 2)],
      ),
    ).toEqual([
      { photo: "a", role: PhotoRole.STEP, stepKey: "s1" },
      { photo: "a", role: PhotoRole.STEP, stepKey: "s2" },
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
      { photo: "a", role: PhotoRole.STEP, stepNumbers: [1] },
      { photo: "c", role: PhotoRole.INGREDIENTS, stepNumbers: [] },
    ]);
  });

  it("gathers a photo's steps into one entry, in step order", () => {
    expect(
      photoTagsForSave(
        [
          { photo: "a", role: PhotoRole.STEP, stepKey: "third" },
          { photo: "a", role: PhotoRole.STEP, stepKey: "gone" },
          { photo: "a", role: PhotoRole.STEP, stepKey: "first" },
        ],
        [editorStep("first"), editorStep("second"), editorStep("third")],
      ),
    ).toEqual([{ photo: "a", role: PhotoRole.STEP, stepNumbers: [1, 3] }]);
  });
});

describe("withPhotoTags", () => {
  it("replaces a photo's tags or clears them", () => {
    const tags = [{ photo: "a", role: PhotoRole.FINISHED, stepKey: null }];
    const ingredients = {
      photo: "a",
      role: PhotoRole.INGREDIENTS,
      stepKey: null,
    };
    expect(withPhotoTags(tags, "a", [ingredients])).toEqual([ingredients]);
    expect(withPhotoTags(tags, "a", [])).toEqual([]);
  });
});

describe("photosForStep", () => {
  it("finds only that step's photos", () => {
    const images = [
      image("a", PhotoRole.STEP, [1]),
      image("b", PhotoRole.STEP, [2]),
      image("c", PhotoRole.FINISHED),
      image("d", PhotoRole.STEP, [1, 2, 3]),
    ];
    expect(photosForStep(images, 2).map((item) => item.id)).toEqual(["b", "d"]);
  });
});

describe("photoRoleLabel", () => {
  it("names the role, with the step number for step photos", () => {
    expect(photoRoleLabel(image("a", PhotoRole.STEP, [4]))).toBe("Step 4");
    expect(photoRoleLabel(image("b", PhotoRole.INGREDIENTS))).toBe(
      "Ingredients",
    );
    expect(photoRoleLabel(image("c", PhotoRole.FINISHED))).toBe(
      "Finished dish",
    );
    expect(photoRoleLabel(image("d", null))).toBeNull();
  });
});

describe("stepNumbersLabel", () => {
  it("joins neighbouring steps into runs", () => {
    expect(stepNumbersLabel([])).toBeNull();
    expect(stepNumbersLabel([3])).toBe("Step 3");
    expect(stepNumbersLabel([4, 2, 1, 3])).toBe("Steps 1–4");
    expect(stepNumbersLabel([1, 2, 5, 7, 8])).toBe("Steps 1–2, 5, 7–8");
  });
});
