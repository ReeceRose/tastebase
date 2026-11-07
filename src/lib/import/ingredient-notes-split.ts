import {
  MEASURE,
  matchUnit,
  SINGLE_QUANTITY,
} from "@/lib/import/ingredient-vocabulary";

export interface NameParts {
  name: string;
  notes: string[];
  measures: string[];
  adjustment: string | null;
  isOptional: boolean;
}

const ABOUT = "(?:about\\s+|approx\\.?\\s+|approximately\\s+|~\\s*)?";
const MEASURE_LIST = `${ABOUT}${MEASURE}(?:\\s*(?:[;,/]|\\s(?:or|to)\\s)\\s*${ABOUT}${MEASURE})*`;

export const MEASURE_BRACKET = new RegExp(`^${MEASURE_LIST}$`, "i");

const COMMA_ADJUSTMENT = new RegExp(
  `^(?:(minus|plus|less)|\\+)\\s+(${SINGLE_QUANTITY})\\s+(.+)$`,
  "i",
);

// Words that begin a note rather than continue a name, so "chicken, cut into
// strips" splits but "boneless, skinless chicken" doesn't.
const NOTE_STARTERS =
  /^(?:about|additional|approx\S*|as|at|very|best|cold|cooled|cut|divided|each|extra|fresh|freshly|good|hot|if|ideally|in|into|large|like|lukewarm|medium|more|not|on|optional|or|peel|peels|plus|preferably|raw|room|seeds?|skin|small|soft|stems?|such|tepid|thawed|to|warm|with|without|for|from|plain|ripe|store-bought|homemade|whole|see|the)\b/i;
const THING_DONE =
  /^\S+(?:\s+\S+)?\s+(?:removed|trimmed|discarded|reserved|attached|intact|on|off)\b/i;
const NOT_PARTICIPLES =
  /^(?:red|seed|bread|shred|green|chicken|kitchen|garden|golden|oven|even|bed|ten|mixed greens)$/i;
// One describing word at the start means a list of them: "raw, unfiltered vinegar".
const DESCRIBING_HEAD =
  /^(?:raw|fresh|whole|large|medium|small|ripe|cold|warm|hot|dry|dried|boneless|skinless|salted|unsalted|sweet|unsweetened|lean|thick|thin|soft|firm|crisp|crispy|mild|light|dark|smoked|cooked|uncooked|frozen|organic|plain|good)$/i;
const ENDS_DESCRIBING = /^(?:\(|or\b|for\b|to\b|plus\b|if\b|\+)/i;
const OR_OTHER = /^(?:and|or)\b/i;
const PARTICIPLE_OR_ADVERB = /^\S+(?:ed|en|ly)\b/i;

function isNoteLike(segment: string): boolean {
  const firstWord = segment.split(/\s+/)[0] ?? "";
  if (NOTE_STARTERS.test(segment) || THING_DONE.test(segment)) return true;
  return !NOT_PARTICIPLES.test(firstWord) && PARTICIPLE_OR_ADVERB.test(segment);
}

const NAME_TAILS = new RegExp(
  `\\s+(?:or\\s+(?:${SINGLE_QUANTITY}(?!\\s*%)|an?\\s)|(?:plus|\\+)\\s+(?:${SINGLE_QUANTITY}|more|extra|additional)|\\+\\s|to (?:taste|serve)$|as needed$|for (?:serving|garnish|garnishing|dusting|greasing|frying|topping|drizzling|sprinkling)\\b|(?:cut|sliced|torn|broken|chopped|diced)\\s+(?:in|into)\\b)`,
  "i",
);

const OPTIONAL_WORD = /\(?\boptional\b\)?[,;:]?\s*/i;
const IF_WANTED =
  /^(?:only\s+)?if (?:using|desired|you like|you wish|preferred)\b/i;

interface PlainAndBrackets {
  plain: string;
  brackets: string[];
}

// Pulls out the outermost brackets. Null when they don't balance, so text that
// can't be read reliably is left as it is.
function separateBrackets(text: string): PlainAndBrackets | null {
  const brackets: string[] = [];
  let plain = "";
  let current = "";
  let depth = 0;
  for (const character of text) {
    if (character === "(") {
      if (depth > 0) current += character;
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth < 0) return null;
      if (depth === 0) {
        brackets.push(current.trim());
        current = "";
      } else {
        current += character;
      }
    } else if (depth > 0) {
      current += character;
    } else {
      plain += character;
    }
  }
  return depth === 0 ? { plain, brackets } : null;
}

function splitTopLevelCommas(text: string): string[] {
  const segments: string[] = [];
  let current = "";
  let depth = 0;
  for (const character of text) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      segments.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  segments.push(current.trim());
  return segments.filter((segment) => segment.length > 0);
}

// "(18 slices) white bread" wrapped in one more pair of brackets by the site.
function unwrapWholeBracket(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return trimmed;
  let depth = 0;
  for (let index = 0; index < trimmed.length; index++) {
    if (trimmed[index] === "(") depth += 1;
    if (trimmed[index] === ")") depth -= 1;
    if (depth === 0 && index < trimmed.length - 1) return trimmed;
  }
  const inner = trimmed.slice(1, -1).trim();
  return depth === 0 && inner && !MEASURE_BRACKET.test(inner) ? inner : trimmed;
}

const NOTE_EDGES = /^[\s,;:/\-–—]+|[\s,;:/\-–—]+$/g;

function tidyNote(note: string): string {
  return unwrapWholeBracket(note.replace(NOTE_EDGES, ""))
    .replace(NOTE_EDGES, "")
    .replace(/^but\s+/i, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",");
}

// Only a bare amount counts: "plus 2 tbsp", not "plus 1/2 tsp for the pan",
// which the scaler would misread as a unit.
function readAdjustmentSegment(segment: string): string | null {
  const match = segment.match(COMMA_ADJUSTMENT);
  if (!match) return null;
  const unit = matchUnit(`${match[3].trim()} `);
  if (unit?.rest.trim() !== "") return null;
  const word = (match[1] ?? "plus").toLowerCase();
  return `${word} ${match[2].trim()} ${unit.unit}`;
}

// "peanut, rice bran, or other neutral oil" stays a list.
function startsNote(segment: string, nameSegments: string[]): boolean {
  if (segment.startsWith("(")) return true;
  if (nameSegments.length >= 2 && OR_OTHER.test(segment)) return false;
  return isNoteLike(segment);
}

const TRAILING_BRACKET = /\s*\(([^()]+)\)$/;

function addNote(note: string, parts: NameParts): void {
  if (OPTIONAL_WORD.test(note) || IF_WANTED.test(tidyNote(note))) {
    parts.isOptional = true;
  }
  const tidied = tidyNote(note.replace(OPTIONAL_WORD, ""));
  if (tidied) parts.notes.push(tidied);
}

export function splitNameAndNotes(rawText: string): NameParts {
  const text = unwrapWholeBracket(rawText);
  const asWritten: NameParts = {
    name: text,
    notes: [],
    measures: [],
    adjustment: null,
    isOptional: false,
  };
  if (!separateBrackets(text)) return asWritten;

  const segments = splitTopLevelCommas(text);
  const parts: NameParts = { ...asWritten };
  const nameSegments: string[] = [];
  const commaNotes: string[] = [];
  let describing = DESCRIBING_HEAD.test(segments[0] ?? "");
  segments.forEach((segment, index) => {
    if (index > 0 && describing && !ENDS_DESCRIBING.test(segment)) {
      nameSegments.push(segment);
      describing = !/\s/.test(segment);
      return;
    }
    const adjustment = index > 0 ? readAdjustmentSegment(segment) : null;
    if (adjustment && !parts.adjustment) {
      parts.adjustment = adjustment;
    } else if (
      commaNotes.length > 0 ||
      (index > 0 && startsNote(segment, nameSegments))
    ) {
      const measure = segment.match(TRAILING_BRACKET);
      if (measure && MEASURE_BRACKET.test(measure[1].trim())) {
        parts.measures.push(measure[1].trim());
        commaNotes.push(segment.slice(0, measure.index));
      } else {
        commaNotes.push(segment);
      }
    } else {
      nameSegments.push(segment);
    }
  });

  const separated = separateBrackets(nameSegments.join(", "));
  const plain = separated?.plain
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/[\s,;]+$/, "")
    .trim();
  if (!separated || !plain) return asWritten;

  let name = plain;
  const tail = name.match(NAME_TAILS);
  if (tail?.index) {
    commaNotes.unshift(name.slice(tail.index).trim());
    name = name.slice(0, tail.index);
  }
  parts.name = name
    .replace(/[\s,;]+$/, "")
    .replace(/\s+(?:plus|and|or)$/i, "")
    .trim();

  const bracketNotes: string[] = [];
  for (const bracket of separated.brackets) {
    if (MEASURE_BRACKET.test(bracket)) {
      parts.measures.push(bracket);
    } else {
      bracketNotes.push(bracket);
    }
  }
  if (commaNotes.length > 0) addNote(commaNotes.join(", "), parts);
  for (const note of bracketNotes) addNote(note, parts);
  return parts;
}
