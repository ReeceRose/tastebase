import {
  group,
  ingredient,
  optional,
  SERIOUS_EATS,
  step,
} from "@/db/seed-data/builders";
import { SEED_USER_IDS } from "@/db/seed-data/users";
import { RecipeDifficulty, RecipeSwatch } from "@/lib/types";
import type { SeedRecipe } from "@/lib/types/seed-types";

export const bolognese: SeedRecipe = {
  slug: "slow-cooked-bolognese-sauce",
  userId: SEED_USER_IDS.marco,
  title: "Slow-Cooked Bolognese Sauce",
  description:
    "A big Sunday project: three meats, pancetta, wine, milk and tomatoes cooked low in the oven for hours until rich and velvety. Makes enough to freeze.",
  servings: 12,
  prepTimeMinutes: 45,
  cookTimeMinutes: 360,
  difficulty: RecipeDifficulty.HARD,
  cuisine: "Italian",
  swatch: RecipeSwatch.AUBERGINE,
  sourceUrl:
    "https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: [
    "tag-italian",
    "tag-main-course",
    "tag-make-ahead",
    "tag-comfort-food",
  ],
  image: {
    altText: "Tagliatelle with bolognese and grated Parmesan",
    author: "https://www.flickr.com/photos/wordridden",
    license: "CC BY 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Tagliatelle_ragù_bolognese_01.jpg",
  },
  ingredientGroups: [
    group(null, [
      ingredient("1", "cup", "low-sodium chicken stock"),
      ingredient("2", null, "packets unflavoured gelatin", "about 1/2 oz"),
      ingredient("2", "tbsp", "unsalted butter"),
      ingredient("4", "oz", "pancetta", "finely chopped"),
      ingredient("1", null, "large onion", "finely chopped"),
      ingredient("2", null, "carrots", "finely chopped"),
      ingredient("2", null, "celery ribs", "finely chopped"),
      ingredient("4", null, "garlic cloves", "minced"),
      ingredient("1", "lb", "ground beef chuck"),
      ingredient("1", "lb", "ground pork"),
      ingredient("1", "lb", "ground lamb or veal"),
      ingredient("4", "oz", "chicken livers", "finely minced"),
      ingredient("2", "tbsp", "fresh sage", "minced"),
      ingredient("2", "tbsp", "fresh parsley", "minced"),
      ingredient("1 1/2", "cups", "whole milk"),
      ingredient("1 1/2", "cups", "dry white wine"),
      ingredient(
        "2",
        null,
        "28-oz cans whole peeled tomatoes",
        "crushed by hand",
      ),
      ingredient("2", null, "bay leaves"),
      ingredient("1", "cup", "heavy cream"),
      ingredient("3", "oz", "Parmigiano-Reggiano", "finely grated"),
      ingredient(null, null, "Kosher salt and freshly ground black pepper"),
      optional("1", "tbsp", "fish sauce"),
      optional(null, null, "Fresh pasta or tagliatelle", "to serve"),
    ]),
  ],
  instructions: [
    step(
      "Pour the stock into a small bowl and sprinkle the gelatin over it to soften. Heat the oven to 300°F.",
      5,
      "300°F",
    ),
    step(
      "Melt the butter in a large Dutch oven over medium-high heat. Cook the pancetta until the fat renders, about 5 minutes, then add the onion, carrots, celery and garlic and cook until soft, about 8 minutes.",
      13,
      "medium-high heat",
    ),
    step(
      "Add the beef, pork, lamb and chicken livers and cook, breaking up the meat, until no longer pink, about 10 minutes. Stir in the sage and half the parsley.",
      10,
    ),
    step(
      "Add the milk, wine, tomatoes, bay leaves and softened gelatin. Bring to a simmer and season lightly with salt and pepper.",
      5,
    ),
    step(
      "Move the pot to the oven with the lid slightly ajar. Cook, stirring every hour or so, until the sauce is thick and rich and the fat has risen to the top, 6 to 8 hours.",
      360,
      "300°F",
    ),
    step(
      "Back on the stove, whisk in the cream, Parmesan, fish sauce and remaining parsley. Simmer for a few minutes, season, and discard the bay leaves.",
      5,
    ),
    step(
      "Toss with hot pasta and a splash of pasta water. The rest keeps for a week in the fridge or months in the freezer.",
    ),
  ],
};
