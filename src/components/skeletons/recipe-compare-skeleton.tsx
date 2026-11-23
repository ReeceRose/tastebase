import { Skeleton } from "@/components/ui/skeleton";

export function RecipeCompareSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-5 w-28 rounded-full" />
      <div>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-56 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-48 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-[10rem_repeat(2,minmax(0,1fr))]">
        <span aria-hidden className="hidden lg:block" />
        {[0, 1].map((index) => (
          <Skeleton
            key={`compare-recipe-tile-skeleton-${index}`}
            className="h-28 rounded-tile"
          />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-36 rounded-full" />
        <div className="space-y-4 rounded-tile bg-card p-5">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={`compare-ingredient-row-skeleton-${index}`}
              className="grid grid-cols-2 gap-4 lg:grid-cols-[10rem_repeat(2,minmax(0,1fr))]"
            >
              <Skeleton className="col-span-full h-5 w-28 rounded-full lg:col-span-1" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
