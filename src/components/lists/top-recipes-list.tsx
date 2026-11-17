import Image from "next/image";
import Link from "next/link";
import type { RecipeCookCount } from "@/lib/types/journal-lookback-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface TopRecipesListProps {
  recipes: RecipeCookCount[];
}

export function TopRecipesList({ recipes }: TopRecipesListProps) {
  const top = Math.max(1, ...recipes.map((item) => item.count));

  return (
    <ol className="space-y-2">
      {recipes.map(({ recipe, count }, index) => {
        const swatch = swatchClasses(recipe.swatch);
        return (
          <li key={recipe.id}>
            <Link
              href={`/recipes/${recipe.slug}`}
              className="-mx-2 flex items-center gap-3 rounded-control p-2 outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <span className="w-5 shrink-0 text-center text-meta font-extrabold text-muted-foreground tabular">
                {index + 1}
              </span>
              <span
                className={cn(
                  "relative size-12 shrink-0 overflow-hidden rounded-control",
                  swatch.bg,
                )}
              >
                {recipe.heroImage && (
                  <Image
                    src={`/api/recipes/images/${recipe.heroImage.filename}`}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block truncate font-extrabold">
                  {recipe.title}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn("h-1.5 rounded-full", swatch.bg)}
                    style={{ width: `${(count / top) * 100}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-meta text-muted-foreground tabular">
                {count === 1 ? "once" : `${count} times`}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
