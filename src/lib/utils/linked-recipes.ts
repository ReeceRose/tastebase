import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { recipes } from "@/db/schema.recipes";
import type { LinkedRecipe, RecipeIngredient } from "@/lib/types/recipe-types";

interface LinkableIngredient {
  linkedRecipeId?: string | null;
}

export function recipeIsVisibleTo(userId: string) {
  return and(
    eq(recipes.isArchived, false),
    or(eq(recipes.userId, userId), eq(recipes.isPublic, true)),
  );
}

async function findLinkedRecipes(
  ingredients: LinkableIngredient[],
  userId: string,
): Promise<Map<string, LinkedRecipe>> {
  const ids = [
    ...new Set(
      ingredients.flatMap((row) =>
        row.linkedRecipeId ? [row.linkedRecipeId] : [],
      ),
    ),
  ];
  if (ids.length === 0) return new Map();

  const found = await db
    .select({ id: recipes.id, slug: recipes.slug, title: recipes.title })
    .from(recipes)
    .where(and(inArray(recipes.id, ids), recipeIsVisibleTo(userId)));
  return new Map(found.map((recipe) => [recipe.id, recipe]));
}

// A link to a recipe this person can't see is left out entirely, so its title
// and address never reach them.
export async function withLinkedRecipes(
  ingredients: RecipeIngredient[],
  userId: string,
): Promise<RecipeIngredient[]> {
  const linked = await findLinkedRecipes(ingredients, userId);
  return ingredients.map((ingredient) => {
    const linkedRecipe = ingredient.linkedRecipeId
      ? (linked.get(ingredient.linkedRecipeId) ?? null)
      : null;
    return {
      ...ingredient,
      linkedRecipeId: linkedRecipe?.id ?? null,
      linkedRecipe,
    };
  });
}

export async function keepLinkableIngredients<T extends LinkableIngredient>(
  ingredients: T[],
  userId: string,
  recipeId: string,
): Promise<T[]> {
  const linked = await findLinkedRecipes(ingredients, userId);
  return ingredients.map((ingredient) => {
    const id = ingredient.linkedRecipeId;
    const allowed = Boolean(id) && id !== recipeId && linked.has(id as string);
    return { ...ingredient, linkedRecipeId: allowed ? id : null };
  });
}
