import { ArrowDown, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Chip } from "@/components/ui/chip";
import { ChipVariant, EditorSection } from "@/lib/types";
import {
  RECIPE_IMPORT_SOURCE_LABELS,
  type RecipeImportResult,
} from "@/lib/types/import-types";

interface ImportSummaryCardProps {
  result: RecipeImportResult;
  morePhotos: number;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ImportSummaryCard({
  result,
  morePhotos,
}: ImportSummaryCardProps) {
  const { recipe, image } = result;
  const totalMinutes = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const foundNothing =
    recipe.ingredients.length === 0 && recipe.instructions.length === 0;

  return (
    <section className="flex flex-col gap-5 rounded-tile bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      {image && (
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-control bg-muted sm:w-56">
          <Image
            src={image.url}
            alt=""
            fill
            sizes="(min-width: 640px) 224px, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {result.sourceName && (
          <p className="text-meta text-muted-foreground">
            Imported from{" "}
            {result.sourceUrl ? (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-foreground underline-offset-2 hover:underline"
              >
                {result.sourceName}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            ) : (
              <span className="font-semibold text-foreground">
                {result.sourceName}
              </span>
            )}
          </p>
        )}
        <h2 className="mt-1 text-heading break-words">
          {recipe.title || "Untitled recipe"}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {foundNothing
            ? "We couldn't find ingredients or steps, so fill them in below."
            : `${RECIPE_IMPORT_SOURCE_LABELS[result.source]}. Check it over, then save.`}
        </p>
        {!foundNothing && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip variant={ChipVariant.FACT}>
              {countLabel(
                recipe.ingredients.length,
                "ingredient",
                "ingredients",
              )}
            </Chip>
            <Chip variant={ChipVariant.FACT}>
              {countLabel(recipe.instructions.length, "step", "steps")}
            </Chip>
            {totalMinutes > 0 && (
              <Chip variant={ChipVariant.FACT}>{totalMinutes} min</Chip>
            )}
            {recipe.servings && (
              <Chip variant={ChipVariant.FACT}>Serves {recipe.servings}</Chip>
            )}
          </div>
        )}
        {morePhotos > 0 && (
          <a
            href={`#${EditorSection.PHOTOS}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {countLabel(morePhotos, "more photo", "more photos")} from the page
            to pick from
            <ArrowDown aria-hidden className="size-4" />
          </a>
        )}
      </div>
    </section>
  );
}
