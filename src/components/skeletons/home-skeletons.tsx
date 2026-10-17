import { Skeleton } from "@/components/ui/skeleton";

export function HomeFeatureSkeleton() {
  return (
    <div className="rounded-hero bg-muted p-6 sm:p-8 lg:p-9">
      <Skeleton className="h-4 w-48 rounded-full bg-background/60" />
      <Skeleton className="mt-5 h-12 w-3/4 max-w-md bg-background/60" />
      <Skeleton className="mt-3 h-12 w-1/2 max-w-xs bg-background/60" />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={`home-feature-fact-skeleton-${index}`}
            className="h-8 w-20 rounded-full bg-background/60"
          />
        ))}
      </div>
      <div className="mt-6 flex gap-2.5">
        <Skeleton className="h-13 w-36 bg-background/60" />
        <Skeleton className="h-13 w-44 bg-background/60" />
      </div>
    </div>
  );
}

export function RecipeTileGridSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-52" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <Skeleton
            key={`recipe-tile-skeleton-${index}`}
            className="min-h-[150px] rounded-tile sm:min-h-[200px]"
          />
        ))}
      </div>
    </div>
  );
}

export function HomePanelSkeleton() {
  return (
    <div className="rounded-tile bg-card p-6">
      <Skeleton className="h-7 w-56" />
      <div className="mt-5 space-y-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`home-panel-row-skeleton-${index}`}
            className="flex items-center gap-3.5"
          >
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded-full" />
              <Skeleton className="h-3 w-2/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
