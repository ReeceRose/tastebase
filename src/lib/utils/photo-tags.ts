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

function sortedSteps(stepNumbers: number[]): number[] {
  return [...new Set(stepNumbers)].sort((a, b) => a - b);
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
    return image.stepNumbers.flatMap((stepNumber): EditorPhotoTag[] => {
      const stepKey = keyByStep.get(stepNumber);
      return stepKey ? [{ photo: image.id, role, stepKey }] : [];
    });
  });
}

// Turns step keys into step numbers once blank steps are dropped, with one
// entry per photo. Tags on steps that no longer exist are dropped too.
export function photoTagsForSave(
  tags: EditorPhotoTag[],
  instructions: EditorInstruction[],
): SavedPhotoTag[] {
  const stepByKey = new Map(
    instructions.map((instruction, index) => [instruction.key, index + 1]),
  );
  const saved = new Map<string, SavedPhotoTag>();
  for (const tag of tags) {
    if (tag.role !== PhotoRole.STEP) {
      saved.set(tag.photo, {
        photo: tag.photo,
        role: tag.role,
        stepNumbers: [],
      });
      continue;
    }
    const stepNumber = tag.stepKey ? stepByKey.get(tag.stepKey) : null;
    if (!stepNumber) continue;
    const stepNumbers = saved.get(tag.photo)?.stepNumbers ?? [];
    saved.set(tag.photo, {
      photo: tag.photo,
      role: tag.role,
      stepNumbers: sortedSteps([...stepNumbers, stepNumber]),
    });
  }
  return [...saved.values()];
}

// A photo has one tag, or one step tag for each step it shows.
export function withPhotoTags(
  tags: EditorPhotoTag[],
  photo: string,
  photoTags: EditorPhotoTag[],
): EditorPhotoTag[] {
  return [...tags.filter((item) => item.photo !== photo), ...photoTags];
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
      image.photoRole === PhotoRole.STEP &&
      image.stepNumbers.includes(stepNumber),
  );
}

export function photosWithRole(
  images: RecipeImage[],
  role: PhotoRole,
): RecipeImage[] {
  return images.filter((image) => image.photoRole === role);
}

export function photoRoleLabel(image: RecipeImage): string | null {
  const role = toPhotoRole(image.photoRole);
  if (role === PhotoRole.INGREDIENTS) return "Ingredients";
  if (role === PhotoRole.FINISHED) return "Finished dish";
  if (role === PhotoRole.STEP) return stepNumbersLabel(image.stepNumbers);
  return null;
}

// "Step 4", or runs of steps like "Steps 1–4, 7".
export function stepNumbersLabel(stepNumbers: number[]): string | null {
  const sorted = sortedSteps(stepNumbers);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return `Step ${sorted[0]}`;
  const runs: number[][] = [];
  for (const stepNumber of sorted) {
    const run = runs.at(-1);
    if (run?.at(-1) === stepNumber - 1) run.push(stepNumber);
    else runs.push([stepNumber]);
  }
  const parts = runs.map((run) =>
    run.length === 1 ? `${run[0]}` : `${run[0]}–${run[run.length - 1]}`,
  );
  return `Steps ${parts.join(", ")}`;
}
