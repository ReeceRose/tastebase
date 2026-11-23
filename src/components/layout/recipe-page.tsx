import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { IngredientPanel } from "@/components/cards/ingredient-panel";
import { RecipeDetailsPanel } from "@/components/cards/recipe-details-panel";
import { RecipeExtraNotesPanel } from "@/components/cards/recipe-extra-notes-panel";
import { RecipeHero } from "@/components/cards/recipe-hero";
import { RecipeHouseNotes } from "@/components/cards/recipe-house-notes";
import { RecipeJournalPanel } from "@/components/cards/recipe-journal-panel";
import { RecipeNutritionPanel } from "@/components/cards/recipe-nutrition-panel";
import { RecipeUsedInPanel } from "@/components/cards/recipe-used-in-panel";
import { RecipeVideoPanel } from "@/components/cards/recipe-video-panel";
import { InstructionSteps } from "@/components/recipes/instruction-steps";
import { PhotoStrip } from "@/components/recipes/photo-strip";
import {
  type MeasurementUnit,
  PhotoRole,
  type TemperatureUnit,
} from "@/lib/types";
import type { RecipeHistory } from "@/lib/types/journal-lookback-types";
import type { JournalEntry } from "@/lib/types/journal-types";
import type {
  LinkedRecipe,
  RecipeCookSummary,
  RecipeListOption,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import { photosWithRole } from "@/lib/utils/photo-tags";
import { averageRating } from "@/lib/utils/recipe-utils";
import { recipeWideVideos } from "@/lib/utils/recipe-videos";
import { resolveSwatch } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";

interface RecipePageProps {
  recipe: RecipeWithRelations;
  currentUserId: string;
  isFavourite: boolean;
  lists: RecipeListOption[];
  usedIn: LinkedRecipe[];
  cooks: RecipeCookSummary;
  journal: JournalEntry[];
  history: RecipeHistory;
  openJournalComposer: boolean;
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

export function RecipePage({
  recipe,
  currentUserId,
  isFavourite,
  lists,
  usedIn,
  cooks,
  journal,
  history,
  openJournalComposer,
  measurementSystem,
  temperatureUnit,
}: RecipePageProps) {
  const swatch = resolveSwatch(recipe.id, recipe.swatch);
  const stepCount = recipe.instructions.length;
  const ingredientPhotos = photosWithRole(recipe.images, PhotoRole.INGREDIENTS);
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
        lists={lists}
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
          {ingredientPhotos.length > 0 && (
            <div className="mt-3">
              <PhotoStrip
                images={ingredientPhotos}
                title={`${recipe.title}, ingredients`}
                minimum={1}
                label="Ingredient photos"
              />
            </div>
          )}
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
            images={recipe.images}
            videos={recipe.videos}
            title={recipe.title}
            swatch={swatch}
            temperatureUnit={temperatureUnit}
          />
          <RecipeExtraNotesPanel notes={recipe.extraNotes} />
          <RecipeVideoPanel
            title={recipe.title}
            videoUrl={recipe.videoUrl}
            videos={recipeWideVideos(recipe.videos)}
          />
          <RecipeJournalPanel
            recipe={{ id: recipe.id, slug: recipe.slug, title: recipe.title }}
            entries={journal}
            history={history}
            currentUserId={currentUserId}
            openComposer={openJournalComposer}
          />
        </section>

        <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
          <RecipeHouseNotes
            recipeId={recipe.id}
            notes={recipe.notes}
            currentUserId={currentUserId}
          />
          <RecipeUsedInPanel recipes={usedIn} />
          <RecipeDetailsPanel recipe={recipe} />
          <RecipeNutritionPanel nutrition={recipe.nutrition} />
        </aside>
      </div>
    </div>
  );
}
