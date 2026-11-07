import { readNumber } from "@/lib/import/ingredient-measures";
import {
  hasLetters,
  parseIngredientLines,
} from "@/lib/import/ingredient-parser";
import {
  normalizeText,
  stripListMarker,
} from "@/lib/import/recipe-text-helpers";
import type { ParsedIngredient } from "@/lib/types/import-types";

const COLON_HEADING = /^(.{2,50}?)\s*[:：]$/;
const FOR_HEADING = /^for (?:the )?[\p{L}\s&'-]{2,40}$/iu;
const CAPS_HEADING = /^[\p{Lu}][\p{Lu}\s&'-]{2,40}$/u;
const INLINE_HEADING =
  /^((?:for (?:the )?)?[\p{L}][\p{L}\s&'-]{1,40})[:：]\s+(?=[\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞])/iu;
const NOT_A_HEADING = /^optional\b|^note\b|^tip\b/i;
const MARKDOWN_HEADING = /^#{1,6}\s+(.+)$/;
const MAX_GROUP_NAME_LENGTH = 50;
const MAX_HEADING_LENGTH = 60;

// Sets the group name as a cook would write it: "FROSTING:" becomes "Frosting".
// A section called just "Ingredients" says nothing, so it's dropped.
export function toGroupName(text: string): string | null {
  const trimmed = text
    .replace(/[*:：\s]+$/, "")
    .replace(/^#+\s*/, "")
    .trim();
  if (!trimmed || /^(?:the\s+)?ingredients?$/i.test(trimmed)) return null;
  const sentence =
    trimmed === trimmed.toUpperCase()
      ? `${trimmed.charAt(0)}${trimmed.slice(1).toLowerCase()}`
      : trimmed;
  return sentence.slice(0, MAX_GROUP_NAME_LENGTH);
}

// The section a heading line starts, "" for a heading with no useful name such
// as "Ingredients:", or null when the line isn't a heading.
export function readIngredientHeading(rawLine: string): string | null {
  const line = stripListMarker(
    normalizeText(rawLine)
      .trim()
      .replace(/^\*\*(.*)\*\*$/, "$1"),
  );
  const markdown = line.match(MARKDOWN_HEADING);
  if (markdown) return toGroupName(markdown[1]) ?? "";
  if (
    readNumber(line) ||
    NOT_A_HEADING.test(line) ||
    line.length > MAX_HEADING_LENGTH
  ) {
    return null;
  }
  const colon = line.match(COLON_HEADING);
  if (colon) return toGroupName(colon[1]) ?? "";
  if (FOR_HEADING.test(line) || CAPS_HEADING.test(line)) {
    return toGroupName(line) ?? "";
  }
  return null;
}

// Turns a list of lines into rows, using heading lines as sections. A heading
// with no useful name ends the section before it. Each line can also carry a
// section from the page's recipe card, which wins.
export function parseIngredientList(
  lines: string[],
  lineGroups: (string | null)[] | null = null,
): ParsedIngredient[] {
  const rows: ParsedIngredient[] = [];
  let group: string | null = null;
  lines.forEach((line, index) => {
    const heading = readIngredientHeading(line);
    if (heading !== null) {
      group = heading || null;
      return;
    }
    let text = stripListMarker(normalizeText(line));
    const inline = text.match(INLINE_HEADING);
    if (inline && !NOT_A_HEADING.test(inline[1])) {
      group = toGroupName(inline[1]);
      text = text.slice(inline[0].length);
    }
    const cardGroup = lineGroups?.[index] ?? null;
    for (const parsed of parseIngredientLines(text)) {
      if (hasLetters(parsed.name)) {
        rows.push({ ...parsed, groupName: cardGroup ?? group });
      }
    }
  });
  return rows;
}
