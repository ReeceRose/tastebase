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

export const chocolateChipCookies: SeedRecipe = {
  slug: "food-lab-chocolate-chip-cookies",
  userId: SEED_USER_IDS.sarah,
  title: "The Food Lab's Chocolate Chip Cookies",
  description:
    "Brown butter, hand-chopped chocolate and a long rest in the fridge give these cookies crisp edges, chewy centres and a deep toffee flavour.",
  servings: 24,
  prepTimeMinutes: 30,
  cookTimeMinutes: 16,
  difficulty: RecipeDifficulty.MEDIUM,
  cuisine: "American",
  swatch: RecipeSwatch.TURMERIC,
  sourceUrl:
    "https://www.seriouseats.com/the-food-lab-best-chocolate-chip-cookie-recipe",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: ["tag-american", "tag-dessert", "tag-baked", "tag-make-ahead"],
  image: {
    altText: "Chocolate chip cookies with chopped chocolate on a cutting board",
    author: "Mshuang2",
    license: "CC0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Chocolate_chip_cookies_on_cutting_board.jpg",
  },
  ingredientGroups: [
    group(null, [
      ingredient("8", "oz", "unsalted butter", "2 sticks"),
      ingredient("1", null, "ice cube", "about 2 tbsp frozen water"),
      ingredient("10", "oz", "all-purpose flour", "about 2 cups"),
      ingredient("3/4", "tsp", "baking soda"),
      ingredient("2", "tsp", "kosher salt"),
      ingredient("5", "oz", "granulated sugar", "about 3/4 cup"),
      ingredient("2", null, "large eggs"),
      ingredient("1", "tsp", "vanilla extract"),
      ingredient("3", "oz", "dark brown sugar", "about 1/2 packed cup"),
      ingredient("8", "oz", "semisweet chocolate", "chopped with a knife"),
      optional(null, null, "Flaky sea salt", "for sprinkling"),
    ]),
  ],
  instructions: [
    step(
      "Melt the butter in a light-coloured saucepan over medium-high heat, swirling, until the milk solids turn a deep golden brown and smell nutty, about 5 minutes.",
      5,
      "medium-high heat",
    ),
    step(
      "Scrape the butter into a bowl, stir in the ice cube until melted, then chill until cool to the touch, about 20 minutes.",
      20,
    ),
    step("Whisk the flour, baking soda and salt together in a bowl.", 2),
    step(
      "In a stand mixer, whip the granulated sugar, eggs and vanilla on medium-high until pale and thick, about 5 minutes.",
      5,
    ),
    step(
      "On low speed, add the brown sugar and cooled butter and mix until combined. Add the flour mixture and mix just until no dry pockets remain, then fold in the chocolate.",
    ),
    step(
      "Cover and refrigerate the dough for at least overnight and up to 3 days. The longer rest builds flavour and colour.",
    ),
    step(
      "Heat the oven to 325°F. Scoop 3-tablespoon balls onto parchment-lined baking sheets, leaving room to spread, and sprinkle with flaky salt.",
      15,
      "325°F",
    ),
    step(
      "Bake, rotating halfway, until golden around the edges but still soft in the middle, 13 to 16 minutes. Cool on the sheet for 2 minutes, then move to a rack.",
      16,
      "325°F",
    ),
  ],
};
