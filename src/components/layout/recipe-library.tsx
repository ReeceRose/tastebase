import { Suspense } from "react";
import { RecipeLibraryToolbar } from "@/components/forms/recipe-library-toolbar";
import { RecipeLibraryResults } from "@/components/lists/recipe-library-results";
import {
  RecipeLibraryResultsSkeleton,
  RecipeLibraryToolbarSkeleton,
} from "@/components/skeletons/recipe-library-skeletons";
import { getLibraryFacets } from "@/lib/server-actions/library-actions";
import type { LibraryFilters } from "@/lib/types/recipe-types";
import { libraryParamsToQuery } from "@/lib/utils/library-params";

interface LibrarySectionProps {
  filters: LibraryFilters;
  basePath: string;
  currentUserId: string;
}

interface RecipeLibraryProps extends LibrarySectionProps {
  title: string;
}

async function LibraryToolbarLoader({
  filters,
  basePath,
  currentUserId,
}: LibrarySectionProps) {
  const facets = await getLibraryFacets();
  return (
    <RecipeLibraryToolbar
      filters={filters}
      facets={facets}
      basePath={basePath}
      currentUserId={currentUserId}
    />
  );
}

export function RecipeLibrary({
  title,
  filters,
  basePath,
  currentUserId,
}: RecipeLibraryProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        {title}
      </h1>

      <Suspense fallback={<RecipeLibraryToolbarSkeleton />}>
        <LibraryToolbarLoader
          filters={filters}
          basePath={basePath}
          currentUserId={currentUserId}
        />
      </Suspense>

      <Suspense
        key={libraryParamsToQuery({ ...filters, page: 1 })}
        fallback={<RecipeLibraryResultsSkeleton view={filters.view} />}
      >
        <RecipeLibraryResults
          filters={filters}
          basePath={basePath}
          currentUserId={currentUserId}
        />
      </Suspense>
    </div>
  );
}
