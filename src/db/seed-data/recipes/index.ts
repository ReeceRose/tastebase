import { bolognese } from "@/db/seed-data/recipes/bolognese";
import { chocolateChipCookies } from "@/db/seed-data/recipes/chocolate-chip-cookies";
import { mapoTofu } from "@/db/seed-data/recipes/mapo-tofu";
import { panPizza } from "@/db/seed-data/recipes/pan-pizza";
import { shakshuka } from "@/db/seed-data/recipes/shakshuka";
import { skirtSteakFajitas } from "@/db/seed-data/recipes/skirt-steak-fajitas";
import { smashedCheeseburgers } from "@/db/seed-data/recipes/smashed-cheeseburgers";
import type { SeedRecipe } from "@/lib/types/seed-types";

// Recipes adapted from Serious Eats; amounts are stored as written
export const seedRecipes: SeedRecipe[] = [
  skirtSteakFajitas,
  chocolateChipCookies,
  smashedCheeseburgers,
  panPizza,
  mapoTofu,
  bolognese,
  shakshuka,
];
