import { Plus } from "lucide-react";
import Link from "next/link";
import { RecipeRowList } from "@/components/lists/recipe-row-list";
import { RecipeTileGrid } from "@/components/lists/recipe-tile-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLibraryPage } from "@/lib/server-actions/library-actions";
import { ButtonVariant, LibraryScope, ViewMode } from "@/lib/types";
import type { LibraryFilters } from "@/lib/types/recipe-types";
import {
  hasActiveFilters,
  libraryParamsToQuery,
} from "@/lib/utils/library-params";

interface RecipeLibraryResultsProps {
  filters: LibraryFilters;
  basePath: string;
  currentUserId: string;
}

function countLabel(total: number, filtered: boolean): string {
  const noun = total === 1 ? "recipe" : "recipes";
  return filtered ? `${total} ${noun} match` : `${total} ${noun}`;
}

export async function RecipeLibraryResults({
  filters,
  basePath,
  currentUserId,
}: RecipeLibraryResultsProps) {
  const result = await getLibraryPage(filters);
  const filtered = hasActiveFilters(filters);

  if (result.recipes.length === 0) {
    if (filtered) {
      return (
        <EmptyState
          title="Nothing matches those filters"
          description="Try a different word, or loosen a filter or two."
          action={
            <Button variant={ButtonVariant.OUTLINE} asChild>
              <Link href={basePath}>Clear filters</Link>
            </Button>
          }
        />
      );
    }

    if (filters.scope === LibraryScope.FAVOURITES) {
      return (
        <EmptyState
          title="No favourites yet"
          description="Tap Save on any recipe and tick Favourites, so the ones you cook again and again are always close."
          action={
            <Button asChild>
              <Link href="/recipes">Browse recipes</Link>
            </Button>
          }
        />
      );
    }

    if (filters.scope === LibraryScope.LIST) {
      return (
        <EmptyState
          title="Nothing in this list yet"
          description="Open any recipe and use Save to put it in this list."
          action={
            <Button asChild>
              <Link href="/recipes">Browse recipes</Link>
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        title="Your collection is empty"
        description="Paste a link, snap a cookbook page, or type one in. Everyone in your house will see the recipes you share."
        action={
          <Button variant={ButtonVariant.ACCENT} size="lg" asChild>
            <Link href="/recipes/new">
              <Plus className="size-5" strokeWidth={2.5} />
              Add a recipe
            </Link>
          </Button>
        }
      />
    );
  }

  const nextPage = libraryParamsToQuery({ ...filters, page: filters.page + 1 });

  return (
    <section aria-label="Recipes" className="space-y-4">
      <p className="text-meta text-muted-foreground" aria-live="polite">
        {countLabel(result.total, filtered)}
      </p>

      {filters.view === ViewMode.LIST ? (
        <div className="rounded-tile bg-card p-3 sm:p-4">
          <RecipeRowList
            recipes={result.recipes}
            currentUserId={currentUserId}
          />
        </div>
      ) : (
        <RecipeTileGrid
          recipes={result.recipes}
          currentUserId={currentUserId}
        />
      )}

      {result.hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant={ButtonVariant.OUTLINE} asChild>
            <Link href={`${basePath}?${nextPage}`} scroll={false}>
              Show more recipes
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
