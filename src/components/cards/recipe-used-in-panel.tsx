import Link from "next/link";
import type { LinkedRecipe } from "@/lib/types/recipe-types";

interface RecipeUsedInPanelProps {
  recipes: LinkedRecipe[];
}

export function RecipeUsedInPanel({ recipes }: RecipeUsedInPanelProps) {
  if (recipes.length === 0) return null;

  return (
    <section aria-label="Used in" className="rounded-tile bg-card p-5">
      <h2 className="mb-2 text-heading">Used in</h2>
      <ul className="space-y-2 text-sm font-semibold">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <Link
              href={`/recipes/${recipe.slug}`}
              className="underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {recipe.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
