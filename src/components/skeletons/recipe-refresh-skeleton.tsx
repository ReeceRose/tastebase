import { Skeleton } from "@/components/ui/skeleton";

export function RecipeRefreshSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div
          key={`recipe-refresh-section-skeleton-${index}`}
          className="space-y-2"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
