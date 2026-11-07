import { PageTitleSkeleton } from "@/components/skeletons/recipe-form-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function AddRecipeStartSkeleton() {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true">
      <div>
        <PageTitleSkeleton />
        <div className="mt-3 max-w-[56ch] space-y-2">
          <Skeleton className="h-5 w-full rounded-full" />
          <Skeleton className="h-5 w-2/3 rounded-full" />
        </div>
      </div>

      <div className="rounded-tile bg-card p-5 sm:p-6">
        <Skeleton className="mb-2 h-4 w-24 rounded-full" />
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Skeleton className="h-14 flex-1" />
          <Skeleton className="h-14 w-full sm:w-28" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded-full" />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={`add-recipe-option-skeleton-${index}`}
              className="h-[52px] w-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
