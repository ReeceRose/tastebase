import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { ChipVariant } from "@/lib/types";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface RecipeDetailsPanelProps {
  recipe: RecipeWithRelations;
}

function sourceLabel(recipe: RecipeWithRelations): string | null {
  if (recipe.sourceName) return recipe.sourceName;
  if (!recipe.sourceUrl) return null;
  try {
    return new URL(recipe.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return recipe.sourceUrl;
  }
}

export function RecipeDetailsPanel({ recipe }: RecipeDetailsPanelProps) {
  const source = sourceLabel(recipe);
  const rows = [
    { label: "Cuisine", value: recipe.cuisine },
    { label: "Added", value: formatRelativeDay(recipe.createdAt) },
    recipe.updatedAt.getTime() - recipe.createdAt.getTime() > 60_000
      ? { label: "Changed", value: formatRelativeDay(recipe.updatedAt) }
      : null,
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row?.value),
  );

  return (
    <section
      aria-label="Details"
      className="space-y-4 rounded-tile bg-card p-5"
    >
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-semibold">{row.value}</dd>
          </div>
        ))}
        {source && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Source</dt>
            <dd className="min-w-0 truncate text-right font-semibold">
              {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  {source}
                </a>
              ) : (
                source
              )}
            </dd>
          </div>
        )}
      </dl>
      {recipe.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {recipe.tags.map((tag) => (
            <li key={tag.id}>
              <Chip variant={ChipVariant.TAG} asChild>
                <Link href={`/recipes?tag=${encodeURIComponent(tag.name)}`}>
                  {tag.name}
                </Link>
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
