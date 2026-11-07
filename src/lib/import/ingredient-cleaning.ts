import {
  normalizeText,
  stripListMarker,
} from "@/lib/import/recipe-text-helpers";

const NOTE_REFERENCE =
  "(?:see\\s+)?(?:(?:the|recipe|below)\\s+)?notes?(?:\\s*(?:\\d+|below))?(?:\\s+for\\s+[^()]*)?";
const NOTE_REFERENCE_BRACKET = new RegExp(
  `\\s*(?:\\(\\(\\s*${NOTE_REFERENCE}\\s*\\)\\)|\\(\\s*,?\\s*${NOTE_REFERENCE}\\s*\\))`,
  "gi",
);
const LINK = /\[([^\]|]+?)\s*(?:\|\s*https?:[^\]]*\]|\]\(https?:[^)]*\))/g;
const PRICE_BRACKET = /\s*\(\s*\$\s*\d[\d.,]*[^()]*\)/g;
const PRICE = /,?\s*\$\s*\d+(?:[.,]\d+)?/g;
const FOOTNOTE_MARK = /(?<=[\p{L}\p{N})])[*†‡]+(?=[\s,.;)]|$)/gu;
const TRADEMARK = /[®™©]/g;
const INVISIBLE = /[­​-‍﻿]/g;

const BRACKETED_TEXT = "((?:[^()]|\\([^()]*\\))+)";
const WRAPPED_COMMA_NOTE = new RegExp(`\\s*\\(\\s*,\\s*${BRACKETED_TEXT}\\)`);
const DOUBLE_BRACKET_NOTE = new RegExp(`\\(\\s*\\(${BRACKETED_TEXT}\\)\\s*\\)`);
const UNICODE_FRACTION = "[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞]";

// Written the way the amount reader and the scaler expect: "1 1/2", not
// "1 and 1/2" or "1-1/2". The lookbehinds keep "1/4-1/2" a range.
function normalizeAmounts(line: string): string {
  return line
    .replace(/(\d)­(\d)/g, "$1 $2")
    .replace(INVISIBLE, "")
    .replace(/(?<![\d/.])(\d+)\s*(?:and|&|\+)\s*(\d+\/\d+)/gi, "$1 $2")
    .replace(/(?<![\d/.])(\d+)-(\d+\/\d+)(?![\d/])/g, "$1 $2")
    .replace(
      new RegExp(
        `(?<![\\d/.])(\\d+)\\s*(?:and|&|\\+|-)\\s*(${UNICODE_FRACTION})`,
        "gi",
      ),
      "$1$2",
    )
    .replace(/(^|\s)\.(\d)/g, "$10.$2");
}

// WP Recipe Maker joins "name (notes)" in its JSON-LD, even when the notes
// already start with a comma or a bracket: "garlic (, minced)", "oil ((or butter))".
// Footnote references go too, because footnotes aren't imported.
function tidyLine(line: string): string {
  return line
    .replace(LINK, "$1")
    .replace(TRADEMARK, "")
    .replace(NOTE_REFERENCE_BRACKET, "")
    .replace(PRICE_BRACKET, "")
    .replace(PRICE, "")
    .replace(FOOTNOTE_MARK, "")
    .replace(WRAPPED_COMMA_NOTE, " ($1)")
    .replace(DOUBLE_BRACKET_NOTE, "($1)")
    .replace(/\s+/g, " ")
    .replace(/\s*[.;]$/, "")
    .trim();
}

export function cleanIngredientLine(rawLine: string): string {
  return tidyLine(normalizeAmounts(stripListMarker(normalizeText(rawLine))));
}
