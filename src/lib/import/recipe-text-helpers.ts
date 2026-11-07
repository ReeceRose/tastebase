import { SINGLE_QUANTITY } from "@/lib/import/ingredient-vocabulary";

const QUANTITY_AT_START = new RegExp(
  `^${SINGLE_QUANTITY}(?:\\s*(?:-|–|—|to)\\s*${SINGLE_QUANTITY})?(?=\\s|[a-zA-Z(]|$)`,
);

const LEADING_MARKER_PATTERN =
  /^(?:[-*•·▪▢☐□◦‣⁃]+\s*|(?:step\s*)?\d+\s*[.):]\s+|\(\d+\)\s+)/i;

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/⁄/g, "/")
    .replace(/[ \t]+/g, " ");
}

export function stripListMarker(line: string): string {
  return line.replace(LEADING_MARKER_PATTERN, "").trim();
}

export function startsWithQuantity(line: string): boolean {
  return QUANTITY_AT_START.test(stripListMarker(line));
}

export function parseIsoDuration(duration: string): number | null {
  const match = duration
    .trim()
    .match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) {
    return parseDurationText(duration);
  }
  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseFloat(match[4] || "0");
  const total = days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : null;
}

function readNumber(value: string): number {
  return parseFloat(value.replace(",", "."));
}

export function parseDurationText(text: string): number | null {
  const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minutesMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);
  const hours = hoursMatch ? readNumber(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const total = Math.round(hours * 60 + minutes);
  if (total > 0) {
    return total;
  }
  const bare = text.trim().match(/^(\d+)$/);
  return bare ? parseInt(bare[1], 10) : null;
}

const STEP_TIME_PATTERN =
  /(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:[.,]\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/i;

export function extractTimeMinutes(text: string): number | null {
  const match = text.match(STEP_TIME_PATTERN);
  if (!match) {
    return null;
  }
  const low = readNumber(match[1]);
  const high = match[2] ? readNumber(match[2]) : low;
  const value = Math.max(low, high);
  const minutes = /^h/i.test(match[3]) ? value * 60 : value;
  return minutes > 0 ? Math.round(minutes) : null;
}

export function extractTemperature(text: string): string | null {
  const degreeMatch = text.match(
    /(\d{2,3})\s*(?:°|º|degrees?)\s*([CF])\b|(\d{2,3})°/i,
  );
  if (degreeMatch) {
    if (degreeMatch[1] && degreeMatch[2]) {
      return `${degreeMatch[1]}°${degreeMatch[2].toUpperCase()}`;
    }
    return `${degreeMatch[3]}°`;
  }
  const heatMatch = text.match(
    /\b(low|medium[- ]low|medium[- ]high|medium|high)\s+heat\b/i,
  );
  return heatMatch ? `${heatMatch[1].toLowerCase()} heat` : null;
}

export function parseServings(text: string): number | null {
  const match = text.match(/(\d+)/);
  if (!match) {
    return null;
  }
  const servings = parseInt(match[1], 10);
  return servings > 0 && servings <= 100 ? servings : null;
}
