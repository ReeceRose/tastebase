import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTER_CHIPS = [
  { key: "library-filter-chip-skeleton-1", width: "w-28" },
  { key: "library-filter-chip-skeleton-2", width: "w-32" },
  { key: "library-filter-chip-skeleton-3", width: "w-32" },
  { key: "library-filter-chip-skeleton-4", width: "w-36" },
  { key: "library-filter-chip-skeleton-5", width: "w-44" },
];

export function RecipeLibraryToolbarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Skeleton className="h-12 flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-12 min-w-44 flex-1" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>
      <div className="-mx-5 flex items-center gap-2 overflow-hidden px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        {FILTER_CHIPS.map((chip) => (
          <Skeleton
            key={chip.key}
            className={cn("h-9 shrink-0 rounded-full", chip.width)}
          />
        ))}
      </div>
    </div>
  );
}

interface RecipeRowsSkeletonProps {
  count?: number;
}

export function RecipeRowsSkeleton({ count = 5 }: RecipeRowsSkeletonProps) {
  const rowKeys = Array.from(
    { length: count },
    (_, i) => `recipe-row-skeleton-${i + 1}`,
  );

  return (
    <div className="-mx-3 divide-y-2 divide-background">
      {rowKeys.map((rowKey) => (
        <div
          key={rowKey}
          className="flex min-h-14 items-center gap-3.5 px-3 py-2.5"
        >
          <Skeleton className="size-3.5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
          <Skeleton className="hidden size-6 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

interface RecipeLibraryResultsSkeletonProps {
  view: ViewMode;
  showCount?: boolean;
}

export function RecipeLibraryResultsSkeleton({
  view,
  showCount = true,
}: RecipeLibraryResultsSkeletonProps) {
  return (
    <div className="space-y-4">
      {showCount && <Skeleton className="h-4 w-24 rounded-full" />}
      {view === ViewMode.LIST ? (
        <div className="rounded-tile bg-card p-3 sm:p-4">
          <RecipeRowsSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <Skeleton
              key={`library-tile-skeleton-${index}`}
              className="min-h-[200px] rounded-tile"
            />
          ))}
        </div>
      )}
    </div>
  );
}
