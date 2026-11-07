/**
 * Grams in one cup of common solid ingredients, for showing cup amounts by
 * weight. Patterns match the end of the ingredient's main phrase, so "rice"
 * finds "long grain white rice" but not "rice vinegar". More specific entries
 * come first. Anything not listed stays a volume.
 */
const GRAMS_PER_CUP: [RegExp, number][] = [
  [/\balmond (?:flour|meal)$|\bground almonds$/, 95],
  [/\bcoconut flour$/, 110],
  [/\brice flour$/, 160],
  [/\bflour$/, 125],

  [/\b(?:icing|powdered|confectioners'?) sugar$/, 120],
  [/\bbrown sugar$/, 215],
  [/\bsugar$/, 200],

  [/\bcauliflower rice$/, 110],
  [/\bwild rice$/, 160],
  [/\b(?:arborio|short[- ]grain|sushi|risotto)(?: \w+)? rice$/, 200],
  [/\brice$/, 185],

  [/\b(?:peanut|almond|cashew|nut) butter$/, 260],
  [/\bbutter$/, 225],

  [/\b(?:rolled |old[- ]fashioned )?oats$/, 90],
  [/\bquinoa$/, 170],
  [/\bcouscous$/, 175],
  [/\blentils$/, 190],
  [/\bpanko(?: breadcrumbs| bread crumbs)?$/, 60],
  [/\bbread ?crumbs$/, 110],
  [/\bcornstarch$|\bcorn ?flour$/, 125],
  [/\bcornmeal$/, 150],
  [/\bcocoa(?: powder)?$/, 85],
  [/\bchocolate chips$/, 170],
  [/\braisins$/, 150],
  [/\b(?:walnuts|pecans)$/, 115],
  [/\balmonds$/, 140],

  [/\bparmesan(?: cheese)?$/, 100],
  [/\b(?:cheddar|mozzarella|gruyere|gruyère)(?: cheese)?$/, 115],

  [/\bparsley(?: leaves)?$/, 60],
  [/\b(?:cilantro|coriander)(?: leaves)?$/, 16],
  [/\bbasil(?: leaves)?$/, 24],
  [/\bmint(?: leaves)?$/, 50],
  [/\bspinach(?: leaves)?$/, 30],

  [/\bonions?$/, 160],
  [/\bcarrots?$/, 130],
  [/\bcelery$/, 100],
  [/\bmushrooms$/, 70],
];

const COOKED = /\bcooked\b/;

function mainPhrase(name: string): string {
  return name.split(/[,(]/)[0].trim().toLowerCase();
}

/**
 * Weight of one cup of the ingredient in grams, or null when it should stay a
 * volume: liquids, anything unlisted, and cooked food, which weighs differently
 * from the raw ingredient the table describes.
 */
export function gramsPerCup(name: string | null): number | null {
  if (!name) return null;
  const phrase = mainPhrase(name);
  if (COOKED.test(name.toLowerCase())) return null;
  const match = GRAMS_PER_CUP.find(([pattern]) => pattern.test(phrase));
  return match ? match[1] : null;
}
