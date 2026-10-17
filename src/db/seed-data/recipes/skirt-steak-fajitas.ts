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

export const skirtSteakFajitas: SeedRecipe = {
  slug: "grilled-skirt-steak-fajitas",
  userId: SEED_USER_IDS.julia,
  title: "Grilled Skirt Steak Fajitas",
  description:
    "Skirt steak soaked in a punchy citrus, soy and chipotle marinade, grilled hard over high heat and sliced thin against the grain. Charred peppers and onions get tossed with the reserved marinade.",
  servings: 4,
  prepTimeMinutes: 30,
  cookTimeMinutes: 20,
  difficulty: RecipeDifficulty.MEDIUM,
  cuisine: "Mexican",
  swatch: RecipeSwatch.TOMATO,
  sourceUrl:
    "https://www.seriouseats.com/grilled-skirt-steak-fajitas-food-lab-recipe",
  sourceName: SERIOUS_EATS,
  isPublic: true,
  tagIds: ["tag-mexican", "tag-main-course", "tag-dinner", "tag-grilled"],
  image: {
    altText: "Sliced steak fajitas with peppers, rice, beans and tortillas",
    author: "Michael Rivera",
    license: "CC BY-SA 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Lunch_steak_fajita,_El_Cazador.jpg",
  },
  ingredientGroups: [
    group("For the marinade", [
      ingredient("1/4", "cup", "fresh lime juice", "from 3 to 4 limes"),
      ingredient("1/4", "cup", "fresh orange juice"),
      ingredient("1/4", "cup", "soy sauce"),
      ingredient("1/4", "cup", "vegetable oil"),
      ingredient("1", "tbsp", "fish sauce"),
      ingredient("1", "tbsp", "dark brown sugar"),
      ingredient("2", null, "chipotle chiles in adobo", "plus 2 tbsp sauce"),
      ingredient("4", null, "garlic cloves", "peeled"),
      ingredient("1", "tsp", "ground cumin"),
      ingredient("1", "tsp", "freshly ground black pepper"),
      ingredient("1/2", "cup", "fresh cilantro", "leaves and tender stems"),
    ]),
    group("For the fajitas", [
      ingredient("2", "lb", "skirt steak", "cut into 5- to 6-inch lengths"),
      ingredient("1", null, "red bell pepper", "thinly sliced"),
      ingredient("1", null, "green bell pepper", "thinly sliced"),
      ingredient("1", null, "large red onion", "thinly sliced"),
      ingredient("1", "tbsp", "vegetable oil"),
      ingredient(null, null, "Kosher salt"),
      ingredient("12", null, "flour tortillas", "warmed"),
    ]),
    group("To serve", [
      optional(null, null, "Guacamole"),
      optional(null, null, "Pico de gallo"),
      optional(null, null, "Sour cream"),
      optional(null, null, "Lime wedges"),
    ]),
  ],
  instructions: [
    step(
      "Blend everything for the marinade until smooth. Set aside about a third of it for the vegetables.",
      5,
    ),
    step(
      "Put the steak in a zipper-lock bag with the rest of the marinade, squeeze out the air, and refrigerate for at least 1 hour and up to 10 hours.",
      60,
    ),
    step(
      "Light a chimney full of charcoal and bank the coals to one side, or set every burner on a gas grill to high. Clean and oil the grates.",
      15,
    ),
    step(
      "Lift the steak out of the marinade and pat it dry. Grill over the hottest part of the fire, flipping occasionally, until well charred and 125°F inside for medium-rare, 5 to 8 minutes total. Rest for 5 minutes.",
      8,
      "125°F",
    ),
    step(
      "Meanwhile, heat the oil in a cast iron skillet over high heat. Cook the peppers and onion, stirring now and then, until softened and charred in spots, about 10 minutes. Toss with the reserved marinade and season with salt.",
      10,
      "high heat",
    ),
    step(
      "Slice the steak thinly against the grain. Serve with the vegetables, warm tortillas and toppings.",
    ),
  ],
};
