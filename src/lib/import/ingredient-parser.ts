import { cleanIngredientLine } from "@/lib/import/ingredient-cleaning";
import {
  emptyDraft,
  type IngredientDraft,
  PACKAGE_BRACKET,
  readAfterUnit,
  readAmount,
  readEachSize,
  readLengthPiece,
  readSizedContainer,
} from "@/lib/import/ingredient-measures";
import { splitNameAndNotes } from "@/lib/import/ingredient-notes-split";
import { matchUnit } from "@/lib/import/ingredient-vocabulary";
import {
  normalizeText,
  stripListMarker,
} from "@/lib/import/recipe-text-helpers";
import type { ParsedIngredient } from "@/lib/types/import-types";

const LEADING_QUALIFIER =
  /^(about|approx\.?|approximately|around|roughly|nearly|almost|scant|heaping|heaped|generous|rounded|level|~)\s*(?=[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])/i;
const PLACEHOLDER_UNIT = /^units?\s+(?=\S)/i;
const VAGUE_QUALIFIER = /^(?:about|approx|around|roughly|nearly|almost|~)/i;
const UNIT_QUALIFIER =
  /^(heaping|heaped|scant|rounded|level|generous|good|small|medium|large|big|extra[- ]large)\s+/i;
// "Optional:", "(optional)" and "optional after baking:" all lead a line.
const OPTIONAL_PREFIX =
  /^(?:optional\b([^:()]{0,30})[:\-–]\s*|\(optional\)\s*)/i;

function finish(
  text: string,
  quantity: string | null,
  unit: string | null,
  draft: IngredientDraft,
): ParsedIngredient {
  const parts = splitNameAndNotes(text);
  const sizes = [...draft.measures, ...parts.measures, ...draft.packages];
  const sized =
    sizes.length > 0 ? `${parts.name} (${sizes.join("; ")})` : parts.name;
  const adjustment = draft.adjustment ?? parts.adjustment;
  return {
    name: adjustment ? `${sized}, ${adjustment}` : sized,
    quantity:
      quantity && draft.rangeEnd ? `${quantity}-${draft.rangeEnd}` : quantity,
    unit,
    notes: [...draft.notes, ...parts.notes].join("; ") || null,
    groupName: null,
    isOptional: draft.isOptional || parts.isOptional,
  };
}

function readLeadingWords(text: string, draft: IngredientDraft): string {
  let rest = text;
  const optional = rest.match(OPTIONAL_PREFIX);
  if (optional) {
    draft.isOptional = true;
    const when = optional[1]?.trim();
    if (when) draft.notes.push(when);
    rest = rest.slice(optional[0].length);
  }
  const qualifier = rest.match(LEADING_QUALIFIER);
  if (qualifier) {
    if (!VAGUE_QUALIFIER.test(qualifier[1])) {
      draft.notes.push(qualifier[1].toLowerCase());
    }
    rest = rest.slice(qualifier[0].length);
  }
  return rest;
}

// Reads one line in stages: leading words, the amount, any size, the unit,
// whatever follows the unit, then the name and its notes.
export function parseIngredientLine(rawLine: string): ParsedIngredient | null {
  const line = cleanIngredientLine(rawLine);
  if (line.length === 0) return null;

  const draft = emptyDraft();
  const text = readLeadingWords(line, draft);

  const sizedFirst = readSizedContainer(text, draft);
  if (sizedFirst) {
    const rest = readAfterUnit(sizedFirst.rest, sizedFirst.unit, draft);
    return finish(rest, "1", sizedFirst.unit, draft);
  }
  const pieceFirst = readLengthPiece(text, draft);
  if (pieceFirst) return finish(pieceFirst.rest, "1", pieceFirst.unit, draft);

  const amount = readAmount(text);
  if (!amount) return finish(text, null, null, draft);
  const { quantity } = amount;
  // Meal-kit sites write "1 unit lettuce", where "unit" means nothing.
  let rest = amount.rest.trim().replace(PLACEHOLDER_UNIT, "");

  const sized = readSizedContainer(rest, draft);
  if (sized) {
    return finish(
      readAfterUnit(sized.rest, sized.unit, draft),
      quantity,
      sized.unit,
      draft,
    );
  }
  const piece = readLengthPiece(rest, draft);
  if (piece) return finish(piece.rest, quantity, piece.unit, draft);

  rest = readEachSize(rest, amount, draft);
  const packageBracket = rest.match(PACKAGE_BRACKET);
  if (packageBracket && rest.length > packageBracket[0].length) {
    draft.packages.push(packageBracket[1].trim());
    rest = rest.slice(packageBracket[0].length);
  }

  const unitQualifier = rest.match(UNIT_QUALIFIER);
  if (unitQualifier) {
    const afterQualifier = rest.slice(unitQualifier[0].length);
    if (matchUnit(afterQualifier)) {
      draft.notes.push(unitQualifier[1].toLowerCase());
      rest = afterQualifier;
    }
  }

  const unit = matchUnit(rest);
  if (unit && unit.rest.length > 0) {
    return finish(
      readAfterUnit(unit.rest, unit.unit, draft),
      quantity,
      unit.unit,
      draft,
    );
  }

  const parsed = finish(rest, quantity, null, draft);
  return parsed.name
    ? parsed
    : { ...parsed, name: line, quantity: null, unit: null };
}

export function hasLetters(text: string): boolean {
  return /\p{L}{2}/u.test(text);
}

const SECOND_INGREDIENT_JOIN = /\s+(?:plus|\+)\s+/gi;
// "2 cups flour plus 2 tbsp for dusting" is still one ingredient.
const SAME_INGREDIENT = /^(?:more|extra|additional|for|to|as|if|optional)\b/i;

function isInsideBrackets(text: string): boolean {
  return text.split("(").length !== text.split(")").length;
}

// Some recipes put two ingredients on one line: "1 tbsp lemon zest plus 3/4 cup
// lemon juice". Both sides need their own amount, unit and name to be split.
export function parseIngredientLines(rawLine: string): ParsedIngredient[] {
  const line = stripListMarker(normalizeText(rawLine));
  for (const join of line.matchAll(SECOND_INGREDIENT_JOIN)) {
    const index = join.index ?? 0;
    const before = line.slice(0, index);
    const after = line.slice(index + join[0].length);
    if (isInsideBrackets(before)) continue;
    const first = parseIngredientLine(before);
    const second = parseIngredientLine(after);
    if (
      first?.quantity &&
      first.unit &&
      hasLetters(first.name) &&
      !first.name.startsWith("(") &&
      second?.quantity &&
      second.unit &&
      !SAME_INGREDIENT.test(second.name)
    ) {
      return [first, ...parseIngredientLines(after)];
    }
  }
  const parsed = parseIngredientLine(line);
  return parsed ? [parsed] : [];
}
