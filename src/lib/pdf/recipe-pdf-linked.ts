import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { linkedRecipesOf } from "@/lib/utils/recipe-utils";

// Goes through getRecipeBySlug so each recipe gets the reader's access check.
// Only direct links are followed, which keeps loops and long PDFs out.
export async function loadRecipesLinkedFrom(
  recipe: RecipeWithRelations,
): Promise<RecipeWithRelations[]> {
  const results = await Promise.all(
    linkedRecipesOf(recipe.ingredients).map((linked) =>
      getRecipeBySlug(linked.slug).catch(() => undefined),
    ),
  );
  return results.flatMap((result) =>
    result?.success && result.data ? [result.data] : [],
  );
}
