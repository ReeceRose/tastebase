import { nanoid } from "nanoid";
import { PhotoRole } from "@/lib/types";
import type {
  EditorInstruction,
  EditorPhotoTag,
  RecipeEditorValues,
  RecipeImage,
  RecipeInstruction,
  SavedPhotoTag,
} from "@/lib/types/recipe-types";

export function newStepKey(): string {
  return nanoid(10);
}

export function toPhotoRole(value: string | null): PhotoRole | null {
  return Object.values(PhotoRole).find((role) => role === value) ?? null;
}

export function photoTagsFromRecipe(
  images: RecipeImage[],
  instructions: RecipeInstruction[],
): EditorPhotoTag[] {
  const keyByStep = new Map(
    instructions.map((instruction) => [instruction.stepNumber, instruction.id]),
  );
  return images.flatMap((image): EditorPhotoTag[] => {
    const role = toPhotoRole(image.photoRole);
    if (!role) return [];
    if (role !== PhotoRole.STEP) {
      return [{ photo: image.id, role, stepKey: null }];
    }
    const stepKey =
      image.stepNumber === null ? null : keyByStep.get(image.stepNumber);
    return stepKey ? [{ photo: image.id, role, stepKey }] : [];
  });
}

// Turns step keys into step numbers once blank steps are dropped. Tags on
// steps that no longer exist are dropped too.
export function photoTagsForSave(
  tags: EditorPhotoTag[],
  instructions: EditorInstruction[],
): SavedPhotoTag[] {
  const stepByKey = new Map(
    instructions.map((instruction, index) => [instruction.key, index + 1]),
  );
  return tags.flatMap((tag): SavedPhotoTag[] => {
    if (tag.role !== PhotoRole.STEP) {
      return [{ photo: tag.photo, role: tag.role, stepNumber: null }];
    }
    const stepNumber = tag.stepKey ? stepByKey.get(tag.stepKey) : null;
    return stepNumber ? [{ photo: tag.photo, role: tag.role, stepNumber }] : [];
  });
}

export function withPhotoTag(
  tags: EditorPhotoTag[],
  photo: string,
  tag: EditorPhotoTag | null,
): EditorPhotoTag[] {
  const others = tags.filter((item) => item.photo !== photo);
  return tag ? [...others, tag] : others;
}

// Drafts saved before steps had keys need them before tags can point at steps.
export function withEditorKeys(values: RecipeEditorValues): RecipeEditorValues {
  return {
    ...values,
    instructions: values.instructions.map((instruction) =>
      instruction.key ? instruction : { ...instruction, key: newStepKey() },
    ),
    photoTags: values.photoTags ?? [],
  };
}

export function photosForStep(
  images: RecipeImage[],
  stepNumber: number,
): RecipeImage[] {
  return images.filter(
    (image) =>
      image.photoRole === PhotoRole.STEP && image.stepNumber === stepNumber,
  );
}

export function photosWithRole(
  images: RecipeImage[],
  role: PhotoRole,
): RecipeImage[] {
  return images.filter((image) => image.photoRole === role);
}
