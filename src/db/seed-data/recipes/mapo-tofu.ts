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

export const mapoTofu: SeedRecipe = {
  slug: "real-deal-mapo-tofu",
  userId: SEED_USER_IDS.marco,
  title: "Real-Deal Mapo Tofu",
  description:
    "Silky tofu and a little beef in a glossy, fiery sauce of chili bean paste and fermented black beans, finished with plenty of tingly toasted Sichuan peppercorn.",
  servings: 4,
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  difficulty: RecipeDifficulty.MEDIUM,
  cuisine: "Sichuan",
  swatch: RecipeSwatch.HERB,
  sourceUrl:
    "https://www.seriouseats.com/real-deal-mapo-dofu-tofu-chinese-sichuan-recipe",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: ["tag-asian", "tag-main-course", "tag-dinner", "tag-one-pot"],
  image: {
    altText: "Mapo tofu in a bowl",
    author: "pelican from Tokyo, Japan",
    license: "CC BY-SA 2.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Mapo_Tofu_(8840681150).jpg",
  },
  ingredientGroups: [
    group(null, [
      ingredient("2", "tsp", "Sichuan peppercorns"),
      ingredient("4", null, "small hot dried chiles", "stems removed"),
      ingredient(
        "1 1/2",
        "lb",
        "soft or silken tofu",
        "cut into 1/2-inch cubes",
      ),
      ingredient("1/4", "cup", "vegetable oil"),
      ingredient("4", "oz", "ground beef"),
      ingredient("3", null, "garlic cloves", "minced"),
      ingredient("1", "tbsp", "fresh ginger", "minced"),
      ingredient("3", "tbsp", "doubanjiang", "Sichuan chili bean paste"),
      ingredient("1", "tbsp", "fermented black beans", "roughly chopped"),
      ingredient("1", "tbsp", "Shaoxing wine"),
      ingredient("1/2", "cup", "chicken stock"),
      ingredient("2", "tsp", "soy sauce"),
      ingredient("1", "tsp", "sugar"),
      ingredient("1", "tbsp", "cornstarch", "mixed with 2 tbsp water"),
      ingredient("2", "tbsp", "chili oil"),
      ingredient("3", null, "scallions", "thinly sliced"),
      optional(null, null, "Steamed white rice", "to serve"),
    ]),
  ],
  instructions: [
    step(
      "Toast the Sichuan peppercorns and dried chiles in a dry wok over medium heat, tossing, until fragrant, about 2 minutes. Grind to a coarse powder.",
      2,
      "medium heat",
    ),
    step(
      "Bring a pot of salted water to a bare simmer, add the tofu and let it sit for 3 minutes to firm up. Drain gently.",
      3,
    ),
    step(
      "Heat the oil in the wok over high heat. Add the beef and cook, breaking it up, until browned and crisp in spots, about 3 minutes.",
      3,
      "high heat",
    ),
    step(
      "Add the garlic, ginger, doubanjiang, black beans and half the spice powder. Stir-fry until the oil turns red and fragrant, about 1 minute.",
      1,
    ),
    step(
      "Add the wine, stock, soy sauce and sugar, then slide in the tofu. Simmer gently, nudging rather than stirring so the tofu stays whole, for 3 minutes.",
      3,
    ),
    step(
      "Stir the cornstarch slurry, drizzle it in and simmer until the sauce is glossy and clings to the tofu. Stir in the chili oil.",
      1,
    ),
    step(
      "Top with the scallions and the remaining spice powder and serve with rice.",
    ),
  ],
};
