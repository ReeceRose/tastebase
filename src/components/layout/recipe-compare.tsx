"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CompareAddTile,
  CompareRecipeTile,
} from "@/components/cards/compare-recipe-header";
import { CompareRecipePhotos } from "@/components/cards/compare-recipe-photos";
import { ServingsStepper } from "@/components/forms/servings-stepper";
import { CompareGlanceTable } from "@/components/lists/compare-glance-table";
import { CompareIngredientTable } from "@/components/lists/compare-ingredient-table";
import { CompareMethodColumns } from "@/components/lists/compare-method-columns";
import { CompareRecipePicker } from "@/components/modals/compare-recipe-picker";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useServingsScale } from "@/hooks/use-servings-scale";
import {
  ButtonVariant,
  MeasurementUnit,
  type TemperatureUnit,
} from "@/lib/types";
import type {
  CompareCandidate,
  CompareColumn,
  CompareRecipe,
} from "@/lib/types/recipe-compare-types";
import { cn } from "@/lib/utils";
import { compareGrid } from "@/lib/utils/compare-layout";
import { compareNutritionFacts } from "@/lib/utils/compare-nutrition";
import { servingsFactor } from "@/lib/utils/ingredient-scaling";
import {
  buildCompareRows,
  compareFacts,
  compareHref,
  MAX_COMPARE_RECIPES,
} from "@/lib/utils/recipe-compare";
import { resolveSwatch } from "@/lib/utils/swatches";

interface RecipeCompareProps {
  items: CompareRecipe[];
  missing: number;
  preferredSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

const UNIT_OPTIONS = [
  { value: MeasurementUnit.METRIC, label: "Metric" },
  { value: MeasurementUnit.IMPERIAL, label: "Imperial" },
];

function subtitleFor(count: number, servings: number | null): string {
  if (count === 0) return "Put versions of a dish side by side.";
  if (count === 1) return "Add another version to compare it with.";
  const versions = `${count} recipes`;
  return servings ? `${versions}, scaled to serve ${servings}` : versions;
}

function missingText(missing: number): string {
  return missing === 1
    ? "1 recipe couldn't be found or is private, so it's left out."
    : `${missing} recipes couldn't be found or are private, so they're left out.`;
}

export function RecipeCompare({
  items,
  missing,
  preferredSystem,
  temperatureUnit,
}: RecipeCompareProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [system, setSystem] = useState<MeasurementUnit>(preferredSystem);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const baseServings =
    items.find((item) => (item.recipe.servings ?? 0) > 0)?.recipe.servings ??
    null;
  const scale = useServingsScale(baseServings);

  const slugs = items.map((item) => item.recipe.slug);
  const factors = items.map((item) =>
    scale.canScale ? servingsFactor(item.recipe.servings, scale.servings) : 1,
  );
  const columns: CompareColumn[] = items.map((item) => ({
    id: item.recipe.id,
    title: item.recipe.title,
    swatch: resolveSwatch(item.recipe.id, item.recipe.swatch),
  }));
  const chosen = items.map((item) => ({
    id: item.recipe.id,
    slug: item.recipe.slug,
    title: item.recipe.title,
  }));

  const rows = buildCompareRows(
    items.map((item) => item.recipe),
    factors,
    system,
  );
  const facts = compareFacts(items);
  const nutritionFacts = compareNutritionFacts(
    items.map((item) => item.recipe.nutrition),
  );

  const navigate = (next: string[]) => {
    startTransition(() => {
      router.push(compareHref(next), { scroll: false });
    });
  };

  const add = (recipe: CompareCandidate) => {
    setPickerOpen(false);
    navigate([...slugs, recipe.slug]);
  };

  const remove = (slug: string) => {
    navigate(slugs.filter((other) => other !== slug));
  };

  const canAdd = items.length < MAX_COMPARE_RECIPES;
  const hasPhotos = items.some((item) => item.recipe.images.length > 0);
  const grid = compareGrid(items.length);

  return (
    <div
      className={cn(
        "space-y-6 transition-opacity duration-150",
        pending && "opacity-60",
      )}
      aria-busy={pending}
    >
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        All recipes
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title">Compare recipes</h1>
          <p className="mt-2 text-muted-foreground">
            {subtitleFor(
              items.length,
              scale.canScale && items.length > 1 ? scale.servings : null,
            )}
          </p>
        </div>
        {items.length > 1 && canAdd && (
          <Button
            variant={ButtonVariant.OUTLINE}
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Add a recipe
          </Button>
        )}
      </header>

      {missing > 0 && (
        <p
          role="status"
          className="rounded-control bg-card px-4 py-3 text-meta"
        >
          {missingText(missing)}
        </p>
      )}

      {items.length === 0 && (
        <EmptyState
          title="Nothing to compare yet"
          description="Pick two or more versions of a dish. Ingredients line up row by row, amounts are scaled to the same servings, and the methods sit side by side."
          action={
            <Button onClick={() => setPickerOpen(true)}>Pick a recipe</Button>
          }
        />
      )}

      {items.length === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CompareRecipeTile
            item={items[0]}
            factor={1}
            scaled={false}
            onRemove={() => remove(items[0].recipe.slug)}
          />
          <CompareAddTile
            onAdd={() => setPickerOpen(true)}
            description="Recipes with similar names come first."
          />
        </div>
      )}

      {items.length > 1 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {scale.canScale && (
              <ServingsStepper
                servings={scale.servings}
                onDecrease={scale.decrease}
                onIncrease={scale.increase}
                className="bg-muted"
              />
            )}
            <SegmentedControl
              label="Units"
              options={UNIT_OPTIONS}
              value={system}
              onValueChange={(value) => setSystem(value as MeasurementUnit)}
            />
            <Chip
              aria-pressed={onlyDifferences}
              onClick={() => setOnlyDifferences((value) => !value)}
              className="min-h-11"
            >
              Only differences
            </Chip>
            {scale.isScaled && (
              <button
                type="button"
                onClick={scale.reset}
                className="text-meta underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                Back to {scale.original}
              </button>
            )}
          </div>

          <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="min-w-fit space-y-8 lg:min-w-0">
              <div>
                {hasPhotos && (
                  <div className={cn("grid items-start gap-4", grid)}>
                    <span aria-hidden className="hidden lg:block" />
                    {items.map((item, index) => (
                      <CompareRecipePhotos
                        key={item.recipe.id}
                        images={item.recipe.images}
                        column={columns[index]}
                      />
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    "grid gap-4 pt-3 lg:sticky lg:top-0 lg:z-20 lg:-mx-2 lg:bg-background lg:px-2 lg:py-3",
                    grid,
                  )}
                >
                  <span aria-hidden className="hidden lg:block" />
                  {items.map((item, index) => (
                    <CompareRecipeTile
                      key={item.recipe.id}
                      item={item}
                      factor={factors[index]}
                      scaled={scale.canScale}
                      onRemove={() => remove(item.recipe.slug)}
                    />
                  ))}
                </div>
              </div>
              <CompareGlanceTable
                title="At a glance"
                description={null}
                facts={facts}
                columns={columns}
              />
              <CompareGlanceTable
                title="Nutrition"
                description="Per serving, as each recipe lists it"
                facts={nutritionFacts}
                columns={columns}
              />
              <CompareIngredientTable
                rows={rows}
                columns={columns}
                onlyDifferences={onlyDifferences}
              />
              <CompareMethodColumns
                items={items}
                columns={columns}
                temperatureUnit={temperatureUnit}
              />
            </div>
          </div>
        </>
      )}

      <CompareRecipePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        chosen={chosen}
        onSelect={add}
      />
    </div>
  );
}
