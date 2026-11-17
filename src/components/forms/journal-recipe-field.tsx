"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { useState } from "react";
import { LinkRecipeSearch } from "@/components/modals/link-recipe-dialog";
import { Button } from "@/components/ui/button";
import { ButtonVariant } from "@/lib/types";
import type { JournalEntryRecipe } from "@/lib/types/journal-types";
import { JOURNAL_RECIPE_MAX } from "@/lib/utils/journal";

interface JournalRecipeFieldProps {
  recipes: JournalEntryRecipe[];
  optional: boolean;
  onRecipesChange: (recipes: JournalEntryRecipe[]) => void;
}

function recipeKey(recipe: JournalEntryRecipe): string {
  return recipe.recipeId ?? `gone-${recipe.title}`;
}

export function JournalRecipeField({
  recipes,
  optional,
  onRecipesChange,
}: JournalRecipeFieldProps) {
  const [choosing, setChoosing] = useState(false);
  const full = recipes.length >= JOURNAL_RECIPE_MAX;

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold">
        {recipes.length > 1 ? "Recipes" : "Recipe"}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </span>

      {recipes.length > 0 && (
        <ul className="space-y-1.5">
          {recipes.map((recipe) => (
            <li
              key={recipeKey(recipe)}
              className="flex min-h-11 items-center gap-2 rounded-control bg-muted py-1 pr-1 pl-3"
            >
              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {recipe.title}
                {!recipe.slug && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (no longer available)
                  </span>
                )}
              </span>
              <button
                type="button"
                aria-label={`Remove ${recipe.title}`}
                onClick={() =>
                  onRecipesChange(
                    recipes.filter(
                      (item) => recipeKey(item) !== recipeKey(recipe),
                    ),
                  )
                }
                className="grid size-9 shrink-0 place-items-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {choosing ? (
        <div className="space-y-2 rounded-tile bg-muted/50 p-3">
          <LinkRecipeSearch
            initialQuery=""
            excludeRecipeId={null}
            onSelect={(selected) => {
              if (!recipes.some((item) => item.recipeId === selected.id)) {
                onRecipesChange([
                  ...recipes,
                  {
                    recipeId: selected.id,
                    slug: selected.slug,
                    title: selected.title,
                    swatch: null,
                  },
                ]);
              }
              setChoosing(false);
            }}
          />
          <Button
            type="button"
            variant={ButtonVariant.GHOST}
            size="sm"
            onClick={() => setChoosing(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        !full && (
          <Button
            type="button"
            variant={ButtonVariant.OUTLINE}
            onClick={() => setChoosing(true)}
          >
            {recipes.length > 0 ? <Plus /> : <BookOpen />}
            {recipes.length > 0
              ? "Add another recipe"
              : optional
                ? "Link a recipe"
                : "Pick a recipe"}
          </Button>
        )
      )}
    </div>
  );
}
