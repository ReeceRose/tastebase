import { Skeleton } from "@/components/ui/skeleton";

export function RecipeDetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-5 w-28 rounded-full" />

      <div className="rounded-hero bg-muted p-6 sm:p-8 lg:p-10">
        <Skeleton className="h-4 w-56 rounded-full bg-background/60" />
        <Skeleton className="mt-5 h-14 w-4/5 max-w-xl bg-background/60" />
        <Skeleton className="mt-3 h-14 w-3/5 max-w-md bg-background/60" />
        <div className="mt-6 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton
              key={`recipe-fact-skeleton-${index}`}
              className="h-14 w-24 rounded-2xl bg-background/60"
            />
          ))}
        </div>
        <div className="mt-7 flex gap-2.5">
          <Skeleton className="h-13 w-40 bg-background/60" />
          <Skeleton className="h-13 w-28 bg-background/60" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(300px,360px)_1fr] xl:grid-cols-[340px_1fr_280px]">
        <div className="space-y-3 rounded-tile bg-card p-6">
          <Skeleton className="h-7 w-36" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton
              key={`recipe-ingredient-skeleton-${index}`}
              className="h-5 w-full rounded-full"
            />
          ))}
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-28" />
          {[0, 1, 2, 3].map((index) => (
            <Skeleton
              key={`recipe-step-skeleton-${index}`}
              className="h-24 w-full rounded-tile"
            />
          ))}
        </div>
        <div className="space-y-3 lg:col-span-2 xl:col-span-1">
          <Skeleton className="h-6 w-36" />
          {[0, 1].map((index) => (
            <Skeleton
              key={`recipe-note-skeleton-${index}`}
              className="h-24 w-full rounded-tile"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
