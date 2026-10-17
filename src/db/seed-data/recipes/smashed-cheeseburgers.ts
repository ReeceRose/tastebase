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

export const smashedCheeseburgers: SeedRecipe = {
  slug: "ultra-smashed-cheeseburgers",
  userId: SEED_USER_IDS.julia,
  title: "Ultra-Smashed Cheeseburgers",
  description:
    "Thin double patties smashed hard into a ripping-hot skillet so every edge turns lacy and crisp, stacked with melty American cheese on soft potato buns.",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 10,
  difficulty: RecipeDifficulty.EASY,
  cuisine: "American",
  swatch: RecipeSwatch.BEET,
  sourceUrl:
    "https://www.seriouseats.com/ultra-smashed-cheeseburger-recipe-food-lab",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: ["tag-american", "tag-main-course", "tag-quick", "tag-comfort-food"],
  image: {
    altText: "Double smash burger with melted cheese and fries",
    author: "JIP",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Sriracha_Double_Smash_Burger.jpg",
  },
  ingredientGroups: [
    group(null, [
      ingredient(
        "1",
        "lb",
        "freshly ground beef chuck",
        "about 20% fat, divided into 8 loose balls",
      ),
      ingredient("4", null, "soft potato buns", "split"),
      ingredient("1", "tbsp", "butter", "softened, for the buns"),
      ingredient("8", null, "slices American cheese"),
      ingredient(null, null, "Kosher salt and freshly ground black pepper"),
    ]),
    group("Toppings", [
      optional(null, null, "Burger sauce or mayonnaise and ketchup"),
      optional(null, null, "Shredded iceberg lettuce"),
      optional(null, null, "Thinly sliced onion"),
      optional(null, null, "Dill pickle chips"),
    ]),
  ],
  instructions: [
    step(
      "Butter the cut sides of the buns and toast them in a large cast iron or carbon steel skillet over medium heat until golden. Set aside with the sauce and toppings ready to go.",
      3,
      "medium heat",
    ),
    step(
      "Wipe out the skillet and heat it over high heat until smoking, about 2 minutes.",
      2,
      "high heat",
    ),
    step(
      "Add two balls of beef and smash each one as flat as possible with a stiff metal spatula, pressing down on the spatula with a second one for leverage. Season with salt and pepper.",
    ),
    step(
      "Cook without moving until the edges are deep brown and crisp, about 45 seconds. Scrape firmly under each patty to keep the crust, flip, and top one patty with two slices of cheese.",
      1,
    ),
    step(
      "Stack the plain patty on the cheesy one and move the stack to a bun. Repeat with the remaining beef, then add toppings and serve right away.",
    ),
  ],
};
