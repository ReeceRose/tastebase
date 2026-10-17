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

export const shakshuka: SeedRecipe = {
  slug: "shakshuka",
  userId: SEED_USER_IDS.sarah,
  title: "Shakshuka",
  description:
    "Eggs gently baked in a smoky, spiced tomato and pepper sauce with crumbled feta. One pan, plenty of crusty bread for mopping.",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  difficulty: RecipeDifficulty.EASY,
  cuisine: "North African",
  swatch: RecipeSwatch.LEEK,
  sourceUrl:
    "https://www.seriouseats.com/shakshuka-north-african-style-poached-eggs-in-spicy-tomato-sauce",
  sourceName: SERIOUS_EATS,
  isPublic: false,
  tagIds: [
    "tag-mediterranean",
    "tag-vegetarian",
    "tag-breakfast",
    "tag-one-pot",
  ],
  image: {
    altText: "Shakshuka with eggs and herbs in a cast iron skillet",
    author: "Calliopejen1",
    license: "CC BY-SA 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Shakshuka_by_Calliopejen1.jpg",
  },
  ingredientGroups: [
    group(null, [
      ingredient("3", "tbsp", "extra-virgin olive oil"),
      ingredient("1", null, "large onion", "thinly sliced"),
      ingredient("1", null, "red bell pepper", "thinly sliced"),
      ingredient("1", null, "jalapeño", "seeded and thinly sliced"),
      ingredient("3", null, "garlic cloves", "thinly sliced"),
      ingredient("1", "tsp", "ground cumin"),
      ingredient("1", "tbsp", "sweet paprika"),
      ingredient(
        "1",
        null,
        "28-oz can whole peeled tomatoes",
        "crushed by hand",
      ),
      ingredient(null, null, "Kosher salt and freshly ground black pepper"),
      ingredient("3", "oz", "feta", "crumbled"),
      ingredient("6", null, "large eggs"),
      ingredient(null, null, "Fresh cilantro or parsley", "chopped"),
      optional(null, null, "Crusty bread", "to serve"),
    ]),
  ],
  instructions: [
    step("Heat the oven to 375°F.", 10, "375°F"),
    step(
      "Heat the oil in a large oven-safe skillet over medium-high heat. Cook the onion, bell pepper and jalapeño, stirring, until softened and lightly browned, about 10 minutes.",
      10,
      "medium-high heat",
    ),
    step(
      "Add the garlic, cumin and paprika and stir until fragrant, about 30 seconds.",
      1,
    ),
    step(
      "Add the tomatoes and their juices and simmer until thickened, about 10 minutes. Season with salt and pepper and stir in half the feta.",
      10,
    ),
    step(
      "Make six wells in the sauce and crack an egg into each. Season the eggs lightly.",
    ),
    step(
      "Bake until the whites are just set and the yolks are still runny, 5 to 8 minutes.",
      8,
      "375°F",
    ),
    step(
      "Scatter the rest of the feta and the herbs over the top and serve with bread.",
    ),
  ],
};
