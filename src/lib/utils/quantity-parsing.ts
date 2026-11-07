const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅐": 1 / 7,
  "⅚": 5 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const UNICODE_CLASS = Object.keys(UNICODE_FRACTIONS).join("");

export const QUANTITY_PATTERN = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[${UNICODE_CLASS}]|[${UNICODE_CLASS}]|\\d+(?:[.,]\\d+)?)`;

const EXACT_RANGE = new RegExp(
  `^(${QUANTITY_PATTERN})\\s*(?:-|–|to)\\s*(${QUANTITY_PATTERN})$`,
  "i",
);

export function parseQuantity(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (!value) return null;

  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (denominator === 0) return null;
    return Number(mixed[1]) + Number(mixed[2]) / denominator;
  }

  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : Number(fraction[1]) / denominator;
  }

  const unicode = value.match(new RegExp(`^(\\d*)\\s*([${UNICODE_CLASS}])$`));
  if (unicode) {
    const whole = unicode[1] ? Number(unicode[1]) : 0;
    return whole + UNICODE_FRACTIONS[unicode[2]];
  }

  const decimal = Number(value);
  return Number.isFinite(decimal) ? decimal : null;
}

export interface QuantityRange {
  low: number;
  high: number;
}

export function parseRange(raw: string): QuantityRange | null {
  const match = raw.trim().match(EXACT_RANGE);
  if (!match) return null;
  const low = parseQuantity(match[1]);
  const high = parseQuantity(match[2]);
  return low === null || high === null ? null : { low, high };
}
