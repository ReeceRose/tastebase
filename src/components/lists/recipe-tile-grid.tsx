import { RecipeTile } from "@/components/cards/recipe-tile";
import type { RecipeSummary } from "@/lib/types";

interface RecipeTileGridProps {
  recipes: RecipeSummary[];
  currentUserId: string;
}

export function RecipeTileGrid({
  recipes,
  currentUserId,
}: RecipeTileGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
      {recipes.map((recipe, index) => (
        <li key={recipe.id} className="grid">
          <RecipeTile
            recipe={recipe}
            currentUserId={currentUserId}
            priority={index < 4}
          />
        </li>
      ))}
    </ul>
  );
}
