import type {
  ImportedStepPhoto,
  JsonLdStepImage,
  ParsedInstruction,
} from "@/lib/types/import-types";

// Containment only counts when the shorter text is long enough to be a step,
// not a word like "Sauce" that turns up in many steps.
const MIN_CONTAINED_LENGTH = 20;

function comparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function findStep(text: string, steps: string[]): number {
  const exact = steps.indexOf(text);
  if (exact >= 0) return exact;
  return steps.findIndex((step) => {
    const shorter = step.length < text.length ? step : text;
    return (
      shorter.length >= MIN_CONTAINED_LENGTH &&
      (step.includes(text) || text.includes(step))
    );
  });
}

// Matches photos from the recipe's structured data to the imported steps by
// their text, since cleaning can merge, split or drop steps. Photos that
// don't match a step are left untagged rather than guessed at.
export function matchStepPhotos(
  images: JsonLdStepImage[],
  instructions: ParsedInstruction[],
): ImportedStepPhoto[] {
  const steps = instructions.map((step) => comparable(step.instruction));
  const seen = new Set<string>();
  return images.flatMap((image) => {
    const text = comparable(image.text);
    if (!text || seen.has(image.url)) return [];
    const index = findStep(text, steps);
    if (index < 0) return [];
    seen.add(image.url);
    return [{ url: image.url, stepNumber: index + 1 }];
  });
}
