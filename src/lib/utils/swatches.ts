import { RecipeSwatch, type SwatchClasses } from "@/lib/types";

const AUTO_SWATCHES: RecipeSwatch[] = [
  RecipeSwatch.TOMATO,
  RecipeSwatch.LEEK,
  RecipeSwatch.TURMERIC,
  RecipeSwatch.AUBERGINE,
  RecipeSwatch.RADISH,
  RecipeSwatch.SKY,
  RecipeSwatch.BEET,
  RecipeSwatch.HERB,
];

export const SWATCH_ORDER: RecipeSwatch[] = [
  RecipeSwatch.TOMATO,
  RecipeSwatch.CARROT,
  RecipeSwatch.TURMERIC,
  RecipeSwatch.HERB,
  RecipeSwatch.LEEK,
  RecipeSwatch.KALE,
  RecipeSwatch.SKY,
  RecipeSwatch.BLUEBERRY,
  RecipeSwatch.LAVENDER,
  RecipeSwatch.AUBERGINE,
  RecipeSwatch.BEET,
  RecipeSwatch.RADISH,
  RecipeSwatch.MUSHROOM,
  RecipeSwatch.COCOA,
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
  [RecipeSwatch.CARROT]: {
    bg: "bg-swatch-carrot",
    fg: "text-swatch-carrot-fg",
    deep: "bg-swatch-carrot-deep",
  },
  [RecipeSwatch.KALE]: {
    bg: "bg-swatch-kale",
    fg: "text-swatch-kale-fg",
    deep: "bg-swatch-kale-deep",
  },
  [RecipeSwatch.BLUEBERRY]: {
    bg: "bg-swatch-blueberry",
    fg: "text-swatch-blueberry-fg",
    deep: "bg-swatch-blueberry-deep",
  },
  [RecipeSwatch.LAVENDER]: {
    bg: "bg-swatch-lavender",
    fg: "text-swatch-lavender-fg",
    deep: "bg-swatch-lavender-deep",
  },
  [RecipeSwatch.MUSHROOM]: {
    bg: "bg-swatch-mushroom",
    fg: "text-swatch-mushroom-fg",
    deep: "bg-swatch-mushroom-deep",
  },
  [RecipeSwatch.COCOA]: {
    bg: "bg-swatch-cocoa",
    fg: "text-swatch-cocoa-fg",
    deep: "bg-swatch-cocoa-deep",
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
  [RecipeSwatch.CARROT]: "Carrot",
  [RecipeSwatch.KALE]: "Kale",
  [RecipeSwatch.BLUEBERRY]: "Blueberry",
  [RecipeSwatch.LAVENDER]: "Lavender",
  [RecipeSwatch.MUSHROOM]: "Mushroom",
  [RecipeSwatch.COCOA]: "Cocoa",
};

const DARK_SWATCHES = new Set<RecipeSwatch>([
  RecipeSwatch.TOMATO,
  RecipeSwatch.LEEK,
  RecipeSwatch.AUBERGINE,
  RecipeSwatch.BEET,
  RecipeSwatch.KALE,
  RecipeSwatch.BLUEBERRY,
  RecipeSwatch.COCOA,
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
  return AUTO_SWATCHES[hashString(id) % AUTO_SWATCHES.length];
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
