import { Skeleton } from "@/components/ui/skeleton";

export function RecipeFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton
              key={`editor-nav-skeleton-${index}`}
              className="h-10 w-full rounded-xl"
            />
          ))}
        </div>
        <div className="space-y-5">
          {[0, 1, 2].map((index) => (
            <div
              key={`editor-section-skeleton-${index}`}
              className="space-y-4 rounded-tile bg-card p-6"
            >
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
