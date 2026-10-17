import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "@/lib/types";

export function RecipeLibraryToolbarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Skeleton className="h-12 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-44" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={`library-filter-chip-skeleton-${index}`}
            className="h-9 w-28 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

interface RecipeLibraryResultsSkeletonProps {
  view: ViewMode;
}

export function RecipeLibraryResultsSkeleton({
  view,
}: RecipeLibraryResultsSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24 rounded-full" />
      {view === ViewMode.LIST ? (
        <div className="space-y-4 rounded-tile bg-card p-5">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={`library-row-skeleton-${index}`}
              className="flex items-center gap-3.5"
            >
              <Skeleton className="size-3.5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-3 w-1/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <Skeleton
              key={`library-tile-skeleton-${index}`}
              className="min-h-[150px] rounded-tile sm:min-h-[200px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
