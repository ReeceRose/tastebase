import { Skeleton } from "@/components/ui/skeleton";

export function RecipeDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-5 w-28 rounded-full" />

      <div className="relative overflow-hidden rounded-hero bg-muted">
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:p-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-[30px] rounded-full bg-background/60" />
              <Skeleton className="h-4 w-48 rounded-full bg-background/60" />
            </div>
            <Skeleton className="mt-4 h-12 w-4/5 max-w-xl bg-background/60 sm:h-14" />
            <Skeleton className="mt-3 h-12 w-3/5 max-w-md bg-background/60 sm:h-14" />
            <Skeleton className="mt-4 h-6 w-full max-w-[56ch] rounded-full bg-background/60" />
            <div className="mt-6 flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton
                  key={`recipe-fact-skeleton-${index}`}
                  className="h-[60px] w-24 rounded-2xl bg-background/60"
                />
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Skeleton className="h-13 w-44 rounded-control bg-background/60" />
              <Skeleton className="h-13 w-28 rounded-control bg-background/60" />
              <Skeleton className="size-13 rounded-control bg-background/60" />
            </div>
          </div>
          <div aria-hidden className="relative hidden lg:block">
            <Skeleton className="absolute -top-24 -right-24 size-[380px] rounded-full bg-background/40" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(300px,360px)_1fr] xl:grid-cols-[340px_1fr_280px]">
        <div className="space-y-3 rounded-tile bg-card p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-10 w-32 rounded-full sm:h-8" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton
              key={`recipe-ingredient-skeleton-${index}`}
              className="h-5 w-full rounded-full"
            />
          ))}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`recipe-step-skeleton-${index}`}
                className="grid grid-cols-[44px_1fr] gap-4 rounded-tile bg-card p-4 sm:p-5"
              >
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-2 self-center">
                  <Skeleton className="h-5 w-full rounded-full" />
                  <Skeleton className="h-5 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24 rounded-control" />
            </div>
            {[0, 1].map((index) => (
              <Skeleton
                key={`recipe-note-skeleton-${index}`}
                className="h-24 w-full rounded-tile"
              />
            ))}
          </div>
          <div className="space-y-2 rounded-tile bg-card p-5">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`recipe-detail-row-skeleton-${index}`}
                className="flex justify-between gap-3"
              >
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
