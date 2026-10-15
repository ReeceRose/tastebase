import {
  extractTemperature,
  extractTimeMinutes,
  normalizeText,
  parseDurationText,
  parseIngredientLine,
  parseServings,
  startsWithQuantity,
  stripListMarker,
} from "@/lib/import/recipe-text-helpers";
import type {
  ParsedIngredient,
  ParsedInstruction,
  RecipeParsingResult,
} from "@/lib/types/import-types";

enum TextSection {
  PREAMBLE = "preamble",
  INGREDIENTS = "ingredients",
  INSTRUCTIONS = "instructions",
  OTHER = "other",
}

export interface TextParseResult {
  recipe: RecipeParsingResult;
  confidence: number;
}

const INGREDIENT_HEADING =
  /^(ingredients?|ingredient list|what you('|’)?ll need|you('|’)?ll need|you will need|shopping list)$/i;
const INSTRUCTION_HEADING =
  /^(instructions?|directions?|method|preparation|prep|steps|procedure|how to make( it| this)?)$/i;
const OTHER_HEADING =
  /^(notes?|tips?|cook('|’)?s notes?|recipe notes|nutrition( facts| information)?|storage|equipment|serving suggestions?|faqs?|video)$/i;

const SERVINGS_LINE = /^(?:serves|servings|yield|yields|makes)\b\s*:?\s*(.+)$/i;
const MAX_METADATA_LINE_LENGTH = 50;
const PREP_LINE = /^prep(?:aration)?(?:\s+time\s*:?|\s*:)\s*(.+)$/i;
const COOK_LINE = /^(?:cook(?:ing)?|bake|baking)(?:\s+time\s*:?|\s*:)\s*(.+)$/i;
const TOTAL_LINE = /^total(?:\s+time\s*:?|\s*:)\s*(.+)$/i;
const STEP_ONLY_LINE = /^(step\s*)?\d+[.):]?$/i;
const NUMBERED_LINE = /^(?:step\s*)?\d+\s*[.):]\s+/i;
const BULLET_LINE = /^[-*•·▪▢☐□◦‣⁃]/;

const MAX_TITLE_LENGTH = 120;
const MAX_INGREDIENT_LINE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 400;

function headingText(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/[:：]\s*$/, "")
    .trim();
}

function detectSection(line: string): TextSection | null {
  const text = headingText(line);
  if (text.length > 40) {
    return null;
  }
  if (INGREDIENT_HEADING.test(text)) {
    return TextSection.INGREDIENTS;
  }
  if (INSTRUCTION_HEADING.test(text)) {
    return TextSection.INSTRUCTIONS;
  }
  if (OTHER_HEADING.test(text)) {
    return TextSection.OTHER;
  }
  return null;
}

interface RecipeMetadata {
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
}

function readMetadataLine(line: string, metadata: RecipeMetadata): boolean {
  const text = stripListMarker(line);
  if (text.length > MAX_METADATA_LINE_LENGTH) {
    return false;
  }
  const servings = text.match(SERVINGS_LINE);
  if (servings) {
    metadata.servings ??= parseServings(servings[1]);
    return true;
  }
  const prep = text.match(PREP_LINE);
  if (prep && /\d/.test(prep[1])) {
    metadata.prepTime ??= parseDurationText(prep[1]);
    return true;
  }
  const cook = text.match(COOK_LINE);
  if (cook && /\d/.test(cook[1])) {
    metadata.cookTime ??= parseDurationText(cook[1]);
    return true;
  }
  const total = text.match(TOTAL_LINE);
  if (total && /\d/.test(total[1])) {
    metadata.totalTime ??= parseDurationText(total[1]);
    return true;
  }
  return false;
}

function isIngredientGroupHeading(line: string): boolean {
  return (
    !startsWithQuantity(line) &&
    (/[:：]$/.test(line) || /^for (the )?[\w\s]+$/i.test(line)) &&
    line.length <= 60
  );
}

function looksLikeIngredient(line: string): boolean {
  if (line.length > MAX_INGREDIENT_LINE_LENGTH) {
    return false;
  }
  if (startsWithQuantity(line)) {
    return !/[.!?]$/.test(line) || line.length < 60;
  }
  return BULLET_LINE.test(line) && line.length < 60 && !/[.!?]$/.test(line);
}

function looksLikeInstruction(line: string): boolean {
  return (
    NUMBERED_LINE.test(line) || (line.length >= 40 && /[.!?)]$/.test(line))
  );
}

// OCR and copied text often wrap a single step across several lines. Join a
// line onto the previous step unless it starts a new numbered or bulleted item
// or the previous step already ended a sentence.
function mergeWrappedSteps(lines: string[]): string[] {
  const steps: string[] = [];
  for (const line of lines) {
    const startsNewItem = NUMBERED_LINE.test(line) || BULLET_LINE.test(line);
    const previous = steps[steps.length - 1];
    if (previous && !startsNewItem && !/[.!?:)]$/.test(previous)) {
      steps[steps.length - 1] = `${previous} ${line}`;
    } else {
      steps.push(line);
    }
  }
  return steps
    .map((step) => stripListMarker(step))
    .filter((step) => step.length > 0);
}

function toInstructions(lines: string[]): ParsedInstruction[] {
  return mergeWrappedSteps(
    lines.filter((line) => !STEP_ONLY_LINE.test(line)),
  ).map((instruction, index) => ({
    step: index + 1,
    instruction,
    timeMinutes: extractTimeMinutes(instruction),
    temperature: extractTemperature(instruction),
  }));
}

function toIngredients(lines: string[]): ParsedIngredient[] {
  return lines
    .filter((line) => !isIngredientGroupHeading(line))
    .flatMap((line) => {
      const parsed = parseIngredientLine(line);
      return parsed ? [parsed] : [];
    });
}

function scoreConfidence(
  recipe: RecipeParsingResult,
  foundHeadings: boolean,
): number {
  const ingredientCount = recipe.ingredients.length;
  const withQuantity = recipe.ingredients.filter(
    (item) => item.quantity,
  ).length;
  const quantityRatio =
    ingredientCount > 0 ? withQuantity / ingredientCount : 0;

  const score =
    (recipe.title ? 0.15 : 0) +
    (Math.min(ingredientCount, 5) / 5) * 0.4 * (0.5 + 0.5 * quantityRatio) +
    (Math.min(recipe.instructions.length, 3) / 3) * 0.35 +
    (foundHeadings ? 0.1 : 0);

  return Math.round(score * 100) / 100;
}

export function parseRecipeText(
  input: string,
  titleHint: string | null,
): TextParseResult {
  const lines = normalizeText(input)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const metadata: RecipeMetadata = {
    servings: null,
    prepTime: null,
    cookTime: null,
    totalTime: null,
  };
  const preamble: string[] = [];
  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];
  let section = TextSection.PREAMBLE;
  let foundHeadings = false;

  for (const line of lines) {
    const heading = detectSection(line);
    if (heading) {
      section = heading;
      foundHeadings = true;
      continue;
    }
    if (
      section !== TextSection.INSTRUCTIONS &&
      readMetadataLine(line, metadata)
    ) {
      continue;
    }
    if (section === TextSection.INGREDIENTS) {
      ingredientLines.push(line);
    } else if (section === TextSection.INSTRUCTIONS) {
      instructionLines.push(line);
    } else if (section === TextSection.PREAMBLE) {
      preamble.push(line);
    }
  }

  let descriptionLines = preamble;
  if (!foundHeadings) {
    descriptionLines = [];
    for (const line of preamble) {
      if (looksLikeIngredient(line)) {
        ingredientLines.push(line);
      } else if (looksLikeInstruction(line)) {
        instructionLines.push(line);
      } else if (
        ingredientLines.length === 0 &&
        instructionLines.length === 0
      ) {
        descriptionLines.push(line);
      }
    }
  }

  const titleLine =
    titleHint?.trim() ||
    descriptionLines.find((line) => line.length <= MAX_TITLE_LENGTH) ||
    null;
  const description = descriptionLines
    .filter((line) => line !== titleLine)
    .slice(0, 2)
    .join(" ");

  const recipe: RecipeParsingResult = {
    title: titleLine ? headingText(titleLine) : null,
    description:
      description.length > 0 &&
      description.length <= MAX_DESCRIPTION_LENGTH &&
      descriptionLines.length <= 4
        ? description
        : null,
    servings: metadata.servings,
    prepTime: metadata.prepTime,
    cookTime:
      metadata.cookTime ??
      (metadata.totalTime !== null && metadata.prepTime === null
        ? metadata.totalTime
        : null),
    ingredients: toIngredients(ingredientLines),
    instructions: toInstructions(instructionLines),
    tags: [],
    difficulty: null,
    cuisine: null,
  };

  return { recipe, confidence: scoreConfidence(recipe, foundHeadings) };
}
