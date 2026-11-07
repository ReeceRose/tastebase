import {
  extractTemperature,
  extractTimeMinutes,
} from "@/lib/import/recipe-text-helpers";
import type { ParsedInstruction } from "@/lib/types/import-types";

export interface StepText {
  text: string;
  groupName: string | null;
}

const STEP_PREFIX = /^(?:step\s*\d+\s*[:.)\-–—]?\s*|\d+\s*[.):]\s+)/i;
const FILLER_STEP =
  /^(?:enjoy|enjoy your meal|serve and enjoy|bon app[eé]tit|happy (?:baking|cooking)|gather (?:all )?(?:the |your )?ingredients|tried this recipe.*|did you make this.*|pin (?:it|this).*)[.!\s]*$/i;
const HEADING_STEP = /^(?:for |to make )?[\p{L}][\p{L}\s&'-]{1,38}[:：]$/iu;
const NUMBERED_BLOCK = /(?:^|\s)(?:step\s*)?\d{1,2}[.):]\s+(?=[A-Z])/gi;
const MIN_NUMBERED_PARTS = 2;

// Some sites put every step in one string: "1. Mix. 2. Bake."
function splitNumberedBlock(text: string): string[] {
  const starts = [...text.matchAll(NUMBERED_BLOCK)].map(
    (match) => match.index ?? 0,
  );
  if (starts.length < MIN_NUMBERED_PARTS || starts[0] !== 0) return [text];
  return starts.map((start, index) =>
    text.slice(start, starts[index + 1]).trim(),
  );
}

export function tidySteps(steps: StepText[]): StepText[] {
  const tidied: StepText[] = [];
  let heading: string | null = null;
  for (const step of steps) {
    for (const part of splitNumberedBlock(step.text.trim())) {
      const text = part.replace(STEP_PREFIX, "").trim();
      if (HEADING_STEP.test(text)) {
        heading = text.replace(/[:：]$/, "").slice(0, 50);
      } else if (text && !FILLER_STEP.test(text)) {
        tidied.push({ text, groupName: step.groupName ?? heading });
      }
    }
  }
  return tidied;
}

export function toParsedInstructions(steps: StepText[]): ParsedInstruction[] {
  return tidySteps(steps).map((step, index) => ({
    step: index + 1,
    instruction: step.text,
    timeMinutes: extractTimeMinutes(step.text),
    temperature: extractTemperature(step.text),
    groupName: step.groupName,
  }));
}
