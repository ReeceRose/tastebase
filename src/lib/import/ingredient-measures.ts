import { MEASURE_BRACKET } from "@/lib/import/ingredient-notes-split";
import {
  CONTAINER_UNIT_PATTERN,
  canonicalUnit,
  MEASURE,
  MEASURE_UNIT_PATTERN,
  matchUnit,
  SINGLE_QUANTITY,
} from "@/lib/import/ingredient-vocabulary";

// What a line has said about itself so far, as the parser reads it.
export interface IngredientDraft {
  notes: string[];
  measures: string[];
  packages: string[];
  adjustment: string | null;
  rangeEnd: string | null;
  isOptional: boolean;
}

export function emptyDraft(): IngredientDraft {
  return {
    notes: [],
    measures: [],
    packages: [],
    adjustment: null,
    rangeEnd: null,
    isOptional: false,
  };
}

export interface AmountMatch {
  quantity: string;
  rest: string;
  fromMultiplier: boolean;
}

export interface SizedAmount {
  unit: string;
  rest: string;
}

const RANGE_JOIN = "(?:-|–|—|to|or)";
const QUANTITY_START = new RegExp(
  `^(${SINGLE_QUANTITY}(?:\\s*${RANGE_JOIN}\\s*${SINGLE_QUANTITY})?)(?=\\s|[a-zA-Z(]|$)\\s*`,
  "i",
);

const NUMBER_WORDS: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
};
const NUMBER_WORD = new RegExp(
  `^(${Object.keys(NUMBER_WORDS).join("|")})\\s+`,
  "i",
);
const HALF = /^(?:half(?:\s+an?)?|a\s+half(?:\s+an?)?)\s+/i;
const ARTICLE = /^an?\s+/i;
// Words that are an amount of one on their own: "pinch of salt".
const BARE_AMOUNT =
  /^(?=(?:pinch|dash|handful|splash|knob|bunch|sprig|drizzle)(?:es|s)?\s)/i;
const MULTIPLIER = /^(\d+)\s*[x×]\s*/i;

const SIZED_CONTAINER = new RegExp(
  `^(${SINGLE_QUANTITY})\\s*-?\\s*(${MEASURE_UNIT_PATTERN})\\.?\\s*(\\([^()]*\\)\\s*)?(${CONTAINER_UNIT_PATTERN})\\b\\.?\\s*(?:of\\s+)?`,
  "i",
);
const HYPHEN_SIZE = new RegExp(
  `^(${SINGLE_QUANTITY})\\s*-\\s*(${MEASURE_UNIT_PATTERN})\\.?\\s+`,
  "i",
);
const PLAIN_SIZE = new RegExp(
  `^(${SINGLE_QUANTITY})\\s*(${MEASURE_UNIT_PATTERN})\\.?\\s+`,
  "i",
);
const HYPHEN_MEASURE = new RegExp(
  `^(${SINGLE_QUANTITY})-(?=(?:${MEASURE_UNIT_PATTERN})\\b)`,
  "i",
);
const LENGTH_PIECE = new RegExp(
  `^(${SINGLE_QUANTITY})\\s*-?\\s*(inch(?:es)?|in\\.|"|”|cm)\\s+(?:(?:piece|knob|chunk|stick)s?\\s+(?:of\\s+)?|(?=(?:fresh\\s+)?(?:ginger|turmeric|galangal|cinnamon|horseradish)\\b))`,
  "i",
);

const SLASH_MEASURE = new RegExp(
  `^[/|=]\\s*((?:${SINGLE_QUANTITY}\\s*[-–]\\s*)?${MEASURE}(?:\\s+${MEASURE})*)\\s*`,
  "i",
);
const SINGLE_MEASURE = new RegExp(`^${MEASURE}$`, "i");
const OR_MEASURE = new RegExp(`^or\\s+(${MEASURE})\\s+`, "i");
const OR_COUNT = new RegExp(
  `^or\\s+(${SINGLE_QUANTITY}(?:\\s*${RANGE_JOIN}\\s*${SINGLE_QUANTITY})?)\\s+((?:small|medium|large)(?:[- ]sized)?\\s+)?`,
  "i",
);
const RANGE_TAIL = new RegExp(
  `^(?:-|–|—|to|or)\\s*(${SINGLE_QUANTITY})\\s*`,
  "i",
);
const CONTAINER_AFTER_MEASURE = new RegExp(
  `^(?:${CONTAINER_UNIT_PATTERN})\\s+(?:of\\s+)?(?=\\S)`,
  "i",
);
const LEADING_BRACKET = /^\(([^()]+)\)\s*/;
const ADJUSTMENT_WORD = /^(minus|plus|less|\+)\s+/i;
const OR_MORE = /^\+\s*(?=[a-zA-Z(])/;
const MAX_AFTER_UNIT_PASSES = 8;

function normalizeQuantity(quantity: string): string {
  return quantity
    .replace(/\s+/g, " ")
    .replace(/\s+(?:or|to)\s+/i, (join) => (/to/i.test(join) ? " to " : "-"))
    .replace(/\s*[-–—]\s*/g, "-")
    .trim();
}

export function readNumber(text: string): AmountMatch | null {
  const match = text.match(QUANTITY_START);
  return match
    ? {
        quantity: normalizeQuantity(match[1]),
        rest: text.slice(match[0].length),
        fromMultiplier: false,
      }
    : null;
}

export function readAmount(text: string): AmountMatch | null {
  const multiplier = text.match(MULTIPLIER);
  if (multiplier) {
    return {
      quantity: multiplier[1],
      rest: text.slice(multiplier[0].length),
      fromMultiplier: true,
    };
  }
  const hyphen = text.match(HYPHEN_MEASURE);
  if (hyphen) {
    return readNumber(text.replace(hyphen[0], `${hyphen[1]} `));
  }
  const number = readNumber(text);
  if (number) return number;

  const half = text.match(HALF);
  if (half) {
    return {
      quantity: "1/2",
      rest: text.slice(half[0].length),
      fromMultiplier: false,
    };
  }

  const word = text.match(NUMBER_WORD);
  if (word) {
    return {
      quantity: NUMBER_WORDS[word[1].toLowerCase()],
      rest: text.slice(word[0].length),
      fromMultiplier: false,
    };
  }

  if (BARE_AMOUNT.test(text) && matchUnit(text)) {
    return { quantity: "1", rest: text, fromMultiplier: false };
  }

  // "a pinch of salt" has an amount, "a selection of nuts" doesn't.
  const article = text.match(ARTICLE);
  if (article) {
    const rest = text.slice(article[0].length);
    if (matchUnit(rest) || SIZED_CONTAINER.test(rest)) {
      return { quantity: "1", rest, fromMultiplier: false };
    }
  }
  return null;
}

// "14 oz can tomatoes": the size belongs to the can.
export function readSizedContainer(
  text: string,
  draft: IngredientDraft,
): SizedAmount | null {
  const match = text.match(SIZED_CONTAINER);
  if (!match || text.length <= match[0].length) return null;
  draft.packages.push(`${match[1].trim()} ${canonicalUnit(match[2])}`);
  const alternative = match[3]?.replace(/[()]/g, "").trim();
  if (alternative) draft.packages.push(alternative);
  return { unit: canonicalUnit(match[4]), rest: text.slice(match[0].length) };
}

// "2-inch piece of ginger".
export function readLengthPiece(
  text: string,
  draft: IngredientDraft,
): SizedAmount | null {
  const match = text.match(LENGTH_PIECE);
  if (!match || text.length <= match[0].length) return null;
  const length = match[2].toLowerCase() === "cm" ? "cm" : "inch";
  draft.notes.push(`${match[1].trim()}-${length}`);
  return { unit: "piece", rest: text.slice(match[0].length) };
}

// The size of each counted thing: "One 1-lb challah", "1 x 1.2kg chicken".
export function readEachSize(
  text: string,
  amount: AmountMatch,
  draft: IngredientDraft,
): string {
  const size =
    text.match(HYPHEN_SIZE) ??
    (amount.fromMultiplier ? text.match(PLAIN_SIZE) : null);
  if (!size || text.length <= size[0].length) return text;
  draft.packages.push(`${size[1].trim()} ${canonicalUnit(size[2])}`);
  const rest = text.slice(size[0].length);
  // The same size in the other system: "2 x 800g / 1.3lb racks of lamb".
  const other = rest.match(SLASH_MEASURE);
  if (!other || rest.length <= other[0].length) return rest;
  if (SINGLE_MEASURE.test(other[1].trim()))
    draft.packages.push(other[1].trim());
  return rest.slice(other[0].length);
}

function readAdjustment(rest: string, draft: IngredientDraft): string | null {
  const word = rest.match(ADJUSTMENT_WORD);
  if (!word || draft.adjustment) return null;
  const quantity = readNumber(rest.slice(word[0].length));
  if (!quantity) return null;
  const unit = matchUnit(quantity.rest);
  if (!unit?.rest) return null;
  const label = word[1] === "+" ? "plus" : word[1].toLowerCase();
  draft.adjustment = `${label} ${quantity.quantity} ${unit.unit}`;
  return unit.rest;
}

// "1/2 cup to 1 cup sauce" is the range 1/2-1.
function readRangeEnd(
  rest: string,
  unit: string,
  draft: IngredientDraft,
): string | null {
  if (draft.rangeEnd) return null;
  const end = rest.match(RANGE_TAIL);
  if (!end) return null;
  const endUnit = matchUnit(rest.slice(end[0].length));
  if (!endUnit || endUnit.unit !== unit || !endUnit.rest) return null;
  draft.rangeEnd = end[1].trim();
  return endUnit.rest;
}

function readBracket(inner: string, draft: IngredientDraft): void {
  const echo = matchUnit(inner);
  if (echo && echo.rest.trim() === "") return;
  if (MEASURE_BRACKET.test(inner)) {
    draft.measures.push(inner);
  } else if (/^optional$/i.test(inner)) {
    draft.isOptional = true;
  } else {
    draft.notes.push(inner);
  }
}

// What can follow the unit, in any order: a range end, a second measure, a
// bracketed note or an adjustment. "1 cup / 240 ml (packed) plus 1 tbsp sugar".
export function readAfterUnit(
  text: string,
  unit: string,
  draft: IngredientDraft,
): string {
  let rest = text.replace(/^,\s*/, "");
  for (let pass = 0; pass < MAX_AFTER_UNIT_PASSES; pass++) {
    const ranged = readRangeEnd(rest, unit, draft);
    if (ranged !== null) {
      rest = ranged;
      continue;
    }
    const slash = rest.match(SLASH_MEASURE) ?? rest.match(OR_MEASURE);
    if (slash && rest.length > slash[0].length) {
      // "1lb 2oz" and "1.2-1.6lb" can't be scaled, so only plain measures stay.
      if (SINGLE_MEASURE.test(slash[1].trim())) {
        draft.measures.push(slash[1].trim());
      }
      rest = rest.slice(slash[0].length);
      if (CONTAINER_AFTER_MEASURE.test(rest)) {
        draft.notes.push("canned or packaged");
        rest = rest.replace(CONTAINER_AFTER_MEASURE, "");
      }
      continue;
    }
    const count = rest.match(OR_COUNT);
    if (count && rest.length > count[0].length) {
      const size = count[2]?.trim() ?? "";
      draft.notes.push(`or ${count[1].trim()} ${size}`.trim());
      rest = rest.slice(count[0].length);
      continue;
    }
    const bracket = rest.match(LEADING_BRACKET);
    if (bracket && rest.length > bracket[0].length) {
      readBracket(bracket[1].trim(), draft);
      rest = rest.slice(bracket[0].length);
      continue;
    }
    const adjusted = readAdjustment(rest, draft);
    if (adjusted !== null) {
      rest = adjusted;
      continue;
    }
    if (OR_MORE.test(rest)) {
      draft.notes.push("or more");
      rest = rest.replace(OR_MORE, "");
    }
    break;
  }
  return rest;
}

export const PACKAGE_BRACKET = LEADING_BRACKET;
