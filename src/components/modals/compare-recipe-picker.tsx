"use client";

import { useEffect, useState } from "react";
import { LinkRecipeResultsSkeleton } from "@/components/skeletons/link-recipe-results-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import { searchRecipesToCompare } from "@/lib/server-actions/recipe-compare-actions";
import type {
  CompareCandidate,
  CompareCandidatesResult,
} from "@/lib/types/recipe-compare-types";
import type { LinkedRecipe } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

const SEARCH_DELAY_MS = 200;

interface CompareRecipePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chosen: LinkedRecipe[];
  onSelect: (recipe: CompareCandidate) => void;
}

interface PickerResultsProps {
  chosen: LinkedRecipe[];
  onSelect: (recipe: CompareCandidate) => void;
}

function PickerResults({ chosen, onSelect }: PickerResultsProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CompareCandidatesResult | null>(null);
  const search = useDebouncedValue(query, SEARCH_DELAY_MS);
  const excludeKey = chosen.map((recipe) => recipe.id).join(",");
  const titlesKey = chosen.map((recipe) => recipe.title).join("\n");

  useEffect(() => {
    let current = true;
    searchRecipesToCompare(
      search,
      excludeKey ? excludeKey.split(",") : [],
      titlesKey ? titlesKey.split("\n") : [],
    )
      .catch(
        (): CompareCandidatesResult => ({
          success: false,
          suggested: false,
          recipes: [],
        }),
      )
      .then((found) => {
        if (current) setResult(found);
      });
    return () => {
      current = false;
    };
  }, [search, excludeKey, titlesKey]);

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search recipes"
        placeholder="Search recipes"
        className="h-11"
      />
      {result === null && <LinkRecipeResultsSkeleton />}
      {result && !result.success && (
        <p role="alert" className="text-meta text-destructive">
          The search didn't work. Try again.
        </p>
      )}
      {result?.success && result.recipes.length === 0 && (
        <p className="text-meta text-muted-foreground">
          {query ? "No recipes match that." : "No other recipes yet."}
        </p>
      )}
      {result?.success && result.recipes.length > 0 && (
        <div className="space-y-1.5">
          {result.suggested && (
            <p className="px-1 text-caption font-extrabold tracking-wide text-muted-foreground uppercase">
              Similar names
            </p>
          )}
          <ul className="space-y-1">
            {result.recipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => onSelect(recipe)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-control px-3 py-2 text-left outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-3.5 shrink-0 rounded-full",
                      swatchClasses(recipe.swatch).bg,
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {recipe.title}
                    </span>
                    {recipe.sourceName && (
                      <span className="block truncate text-caption text-muted-foreground">
                        {recipe.sourceName}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CompareRecipePicker({
  open,
  onOpenChange,
  chosen,
  onSelect,
}: CompareRecipePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a recipe to compare</DialogTitle>
          <DialogDescription>
            {chosen.length > 0
              ? "Recipes with names like these come first."
              : "Pick a recipe to start comparing."}
          </DialogDescription>
        </DialogHeader>
        {open && <PickerResults chosen={chosen} onSelect={onSelect} />}
      </DialogContent>
    </Dialog>
  );
}
