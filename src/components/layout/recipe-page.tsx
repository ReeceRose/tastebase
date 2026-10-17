import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { IngredientPanel } from "@/components/cards/ingredient-panel";
import { RecipeDetailsPanel } from "@/components/cards/recipe-details-panel";
import { RecipeHero } from "@/components/cards/recipe-hero";
import { RecipeHouseNotes } from "@/components/cards/recipe-house-notes";
import { InstructionSteps } from "@/components/recipes/instruction-steps";
import { PhotoStrip } from "@/components/recipes/photo-strip";
import type { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import type {
  RecipeCookSummary,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import { resolveSwatch } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";

interface RecipePageProps {
  recipe: RecipeWithRelations;
  currentUserId: string;
  isFavourite: boolean;
  cooks: RecipeCookSummary;
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

function averageRating(recipe: RecipeWithRelations): number | null {
  const rated = recipe.notes.filter((note) => note.rating !== null);
  if (rated.length === 0) return null;
  return (
    rated.reduce((sum, note) => sum + (note.rating ?? 0), 0) / rated.length
  );
}

export function RecipePage({
  recipe,
  currentUserId,
  isFavourite,
  cooks,
  measurementSystem,
  temperatureUnit,
}: RecipePageProps) {
  const swatch = resolveSwatch(recipe.id, recipe.swatch);
  const stepCount = recipe.instructions.length;
  const total = formatTotalTime(
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0),
  );
  const methodMeta = [
    stepCount > 0 ? `${stepCount} ${stepCount === 1 ? "step" : "steps"}` : null,
    total,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        All recipes
      </Link>

      <RecipeHero
        recipe={recipe}
        swatch={swatch}
        currentUserId={currentUserId}
        isFavourite={isFavourite}
        averageRating={averageRating(recipe)}
        cooks={cooks}
      />

      <PhotoStrip images={recipe.images} title={recipe.title} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(300px,360px)_1fr] xl:grid-cols-[340px_1fr_280px]">
        <div className="lg:sticky lg:top-6">
          <IngredientPanel
            recipeId={recipe.id}
            ingredients={recipe.ingredients}
            servings={recipe.servings}
            preferredSystem={measurementSystem}
          />
        </div>

        <section aria-labelledby="method-title" className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 id="method-title" className="text-heading">
              Method
            </h2>
            {methodMeta && (
              <span className="text-meta text-muted-foreground">
                {methodMeta}
              </span>
            )}
          </div>
          <InstructionSteps
            instructions={recipe.instructions}
            swatch={swatch}
            temperatureUnit={temperatureUnit}
          />
        </section>

        <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
          <RecipeHouseNotes
            recipeId={recipe.id}
            notes={recipe.notes}
            currentUserId={currentUserId}
          />
          <RecipeDetailsPanel recipe={recipe} />
        </aside>
      </div>
    </div>
  );
}
