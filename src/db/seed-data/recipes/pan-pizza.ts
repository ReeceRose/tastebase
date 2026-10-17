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

export const panPizza: SeedRecipe = {
  slug: "foolproof-pan-pizza",
  userId: SEED_USER_IDS.marco,
  title: "Foolproof Pan Pizza",
  description:
    "A no-knead dough that rises in oiled cast iron pans, then bakes into a thick, airy pizza with a fried, crackly bottom and caramelized cheese edges.",
  servings: 4,
  prepTimeMinutes: 20,
  cookTimeMinutes: 15,
  difficulty: RecipeDifficulty.EASY,
  cuisine: "Italian-American",
  swatch: RecipeSwatch.RADISH,
  sourceUrl: "https://www.seriouseats.com/foolproof-pan-pizza-recipe",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: ["tag-italian", "tag-american", "tag-baked", "tag-dinner"],
  image: {
    altText: "Pan pizza with toppings in a black pan",
    author: "Midori",
    license: "CC BY 3.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Pizza_Super_Supreme_Personal_Pan_Denpasar_Bali.JPG",
  },
  ingredientGroups: [
    group("For the dough", [
      ingredient("400", "g", "bread flour", "about 2 3/4 cups"),
      ingredient("10", "g", "kosher salt", "about 2 tsp"),
      ingredient("4", "g", "instant yeast", "about 1 tsp"),
      ingredient("275", "g", "water", "about 1 1/4 cups"),
      ingredient("8", "g", "extra-virgin olive oil", "about 2 tsp"),
      ingredient("4", "tbsp", "extra-virgin olive oil", "for the pans"),
    ]),
    group("For the toppings", [
      ingredient("1 1/2", "cups", "pizza sauce"),
      ingredient(
        "12",
        "oz",
        "low-moisture mozzarella",
        "cut into 1/2-inch cubes",
      ),
      optional("4", "oz", "pepperoni", "thinly sliced"),
      optional(null, null, "Grated Parmesan and torn fresh basil"),
    ]),
  ],
  instructions: [
    step(
      "Stir the flour, salt, yeast, water and 2 tsp oil together in a large bowl until no dry flour remains. Cover tightly and leave at room temperature for at least 8 hours and up to 24.",
      5,
    ),
    step(
      "Divide the dough in half and shape each piece into a ball. Pour 2 tbsp oil into each of two 10-inch cast iron skillets, add a ball, turn to coat and press it into a rough circle.",
    ),
    step(
      "Cover and let the dough rise until puffy and spread nearly to the edges, about 2 hours. About 30 minutes before baking, set a rack in the middle of the oven and heat it to 550°F.",
      120,
      "550°F",
    ),
    step(
      "Press the dough gently out to the edges of each pan. Spread with sauce, scatter the cheese and toppings right to the rim, and drizzle with a little more oil.",
    ),
    step(
      "Bake until the cheese is bubbly and browned and the bottom is crisp when lifted with a spatula, 12 to 15 minutes. If the bottom needs more colour, set the skillet over medium heat on the stove for a minute or two.",
      15,
      "550°F",
    ),
    step(
      "Slide the pizzas onto a cutting board, finish with Parmesan and basil, and slice.",
    ),
  ],
};
