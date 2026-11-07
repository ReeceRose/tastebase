import { RecipeRowsSkeleton } from "@/components/skeletons/recipe-library-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeFeatureSkeleton() {
  return (
    <div className="rounded-hero bg-muted p-6 sm:p-8 lg:p-9">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-[30px] rounded-full bg-background/60" />
        <Skeleton className="h-4 w-48 rounded-full bg-background/60" />
      </div>
      <div className="mt-4 space-y-1">
        <Skeleton className="h-8 w-4/5 max-w-md bg-background/60 sm:h-[53px] lg:h-[61px]" />
        <Skeleton className="h-8 w-1/2 max-w-xs bg-background/60 sm:h-[53px] lg:h-[61px]" />
      </div>
      <div className="mt-5 flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={`home-feature-fact-skeleton-${index}`}
            className="h-8 w-20 rounded-full bg-background/60"
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        <Skeleton className="h-13 w-36 bg-background/60" />
        <Skeleton className="h-13 w-48 bg-background/60" />
      </div>
    </div>
  );
}

export function RecipeTileGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <Skeleton
            key={`recipe-tile-skeleton-${index}`}
            className="min-h-[200px] rounded-tile"
          />
        ))}
      </div>
    </div>
  );
}

export function HomeRecentSkeleton() {
  return (
    <div className="rounded-tile bg-card p-6">
      <Skeleton className="mb-3 h-7 w-56" />
      <RecipeRowsSkeleton count={6} />
    </div>
  );
}

export function HomeForgottenSkeleton() {
  return (
    <div className="rounded-tile bg-card p-6">
      <Skeleton className="mb-3 h-7 w-48" />
      <RecipeRowsSkeleton count={5} />
    </div>
  );
}

export function HomeActivitySkeleton() {
  return (
    <div className="rounded-tile bg-card p-6">
      <Skeleton className="mb-4 h-7 w-44" />
      <div className="divide-y-2 divide-background">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`home-activity-row-skeleton-${index}`}
            className="grid grid-cols-[30px_1fr_auto] items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <Skeleton className="size-[30px] rounded-full" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-4/5 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
            </div>
            <Skeleton className="mt-1 h-3 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
