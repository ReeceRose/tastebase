const FRACTIONS: Record<string, string> = {
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const FRACTION_PATTERN = /(\d?)([⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/gu;
const EMOJI_PATTERN = /(?![©®™])\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/gu;

// The embedded font has no glyphs for these, so they would print as empty boxes.
export function pdfText(text: string): string {
  return text
    .replace(FRACTION_PATTERN, (_match, whole: string, fraction: string) =>
      whole ? `${whole} ${FRACTIONS[fraction]}` : FRACTIONS[fraction],
    )
    .replace(EMOJI_PATTERN, "")
    .replace(/ {2,}/g, " ")
    .trim();
}
