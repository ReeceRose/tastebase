import { RecipeSwatch, type SwatchClasses } from "@/lib/types";

export const SWATCH_ORDER: RecipeSwatch[] = [
  RecipeSwatch.TOMATO,
  RecipeSwatch.LEEK,
  RecipeSwatch.TURMERIC,
  RecipeSwatch.AUBERGINE,
  RecipeSwatch.RADISH,
  RecipeSwatch.SKY,
  RecipeSwatch.BEET,
  RecipeSwatch.HERB,
];

export const SWATCH_CLASSES: Record<RecipeSwatch, SwatchClasses> = {
  [RecipeSwatch.TOMATO]: {
    bg: "bg-swatch-tomato",
    fg: "text-swatch-tomato-fg",
    deep: "bg-swatch-tomato-deep",
  },
  [RecipeSwatch.LEEK]: {
    bg: "bg-swatch-leek",
    fg: "text-swatch-leek-fg",
    deep: "bg-swatch-leek-deep",
  },
  [RecipeSwatch.AUBERGINE]: {
    bg: "bg-swatch-aubergine",
    fg: "text-swatch-aubergine-fg",
    deep: "bg-swatch-aubergine-deep",
  },
  [RecipeSwatch.BEET]: {
    bg: "bg-swatch-beet",
    fg: "text-swatch-beet-fg",
    deep: "bg-swatch-beet-deep",
  },
  [RecipeSwatch.TURMERIC]: {
    bg: "bg-swatch-turmeric",
    fg: "text-swatch-turmeric-fg",
    deep: "bg-swatch-turmeric-deep",
  },
  [RecipeSwatch.RADISH]: {
    bg: "bg-swatch-radish",
    fg: "text-swatch-radish-fg",
    deep: "bg-swatch-radish-deep",
  },
  [RecipeSwatch.SKY]: {
    bg: "bg-swatch-sky",
    fg: "text-swatch-sky-fg",
    deep: "bg-swatch-sky-deep",
  },
  [RecipeSwatch.HERB]: {
    bg: "bg-swatch-herb",
    fg: "text-swatch-herb-fg",
    deep: "bg-swatch-herb-deep",
  },
};

export const SWATCH_LABELS: Record<RecipeSwatch, string> = {
  [RecipeSwatch.TOMATO]: "Tomato",
  [RecipeSwatch.LEEK]: "Leek",
  [RecipeSwatch.AUBERGINE]: "Aubergine",
  [RecipeSwatch.BEET]: "Beet",
  [RecipeSwatch.TURMERIC]: "Turmeric",
  [RecipeSwatch.RADISH]: "Radish",
  [RecipeSwatch.SKY]: "Sky",
  [RecipeSwatch.HERB]: "Herb",
};

const DARK_SWATCHES = new Set<RecipeSwatch>([
  RecipeSwatch.TOMATO,
  RecipeSwatch.LEEK,
  RecipeSwatch.AUBERGINE,
  RecipeSwatch.BEET,
]);

const SWATCH_VALUES = new Set<string>(Object.values(RecipeSwatch));

export function isRecipeSwatch(value: string | null): value is RecipeSwatch {
  return value !== null && SWATCH_VALUES.has(value);
}

export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function swatchFor(id: string): RecipeSwatch {
  return SWATCH_ORDER[hashString(id) % SWATCH_ORDER.length];
}

export function resolveSwatch(id: string, stored: string | null): RecipeSwatch {
  return isRecipeSwatch(stored) ? stored : swatchFor(id);
}

export function memberSwatch(userId: string): RecipeSwatch {
  return swatchFor(`member:${userId}`);
}

export function swatchClasses(swatch: RecipeSwatch): SwatchClasses {
  return SWATCH_CLASSES[swatch];
}

export function isDarkSwatch(swatch: RecipeSwatch): boolean {
  return DARK_SWATCHES.has(swatch);
}

export function stepSwatch(base: RecipeSwatch, index: number): RecipeSwatch {
  const start = SWATCH_ORDER.indexOf(base);
  return SWATCH_ORDER[(start + index) % SWATCH_ORDER.length];
}
