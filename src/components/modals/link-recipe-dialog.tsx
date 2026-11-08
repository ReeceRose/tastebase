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
import { searchLinkableRecipes } from "@/lib/server-actions/linked-recipe-actions";
import type { LinkedRecipe } from "@/lib/types/recipe-types";

const SEARCH_DELAY_MS = 200;

interface LinkRecipeSearchProps {
  initialQuery: string;
  excludeRecipeId: string | null;
  onSelect: (recipe: LinkedRecipe) => void;
}

function LinkRecipeSearch({
  initialQuery,
  excludeRecipeId,
  onSelect,
}: LinkRecipeSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LinkedRecipe[] | null>(null);
  const [failed, setFailed] = useState(false);
  const search = useDebouncedValue(query, SEARCH_DELAY_MS);

  useEffect(() => {
    let current = true;
    searchLinkableRecipes(search, excludeRecipeId)
      .catch(() => ({ success: false, recipes: [] }))
      .then((result) => {
        if (!current) return;
        setResults(result.recipes);
        setFailed(!result.success);
      });
    return () => {
      current = false;
    };
  }, [search, excludeRecipeId]);

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={(event) => event.target.select()}
        aria-label="Search recipes"
        placeholder="Search recipes"
        className="h-11"
      />
      {results === null && <LinkRecipeResultsSkeleton />}
      {failed && (
        <p role="alert" className="text-meta text-destructive">
          The search didn't work. Try again.
        </p>
      )}
      {results !== null && !failed && results.length === 0 && (
        <p className="text-meta text-muted-foreground">
          No recipes match that.
        </p>
      )}
      {results !== null && results.length > 0 && (
        <ul className="space-y-1">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <button
                type="button"
                onClick={() => onSelect(recipe)}
                className="block min-h-11 w-full truncate rounded-control px-3 py-2.5 text-left outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {recipe.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface LinkRecipeDialogProps extends LinkRecipeSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkRecipeDialog({
  open,
  onOpenChange,
  initialQuery,
  excludeRecipeId,
  onSelect,
}: LinkRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link a recipe</DialogTitle>
          <DialogDescription>
            The ingredient will open the recipe you pick.
          </DialogDescription>
        </DialogHeader>
        <LinkRecipeSearch
          initialQuery={initialQuery}
          excludeRecipeId={excludeRecipeId}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
