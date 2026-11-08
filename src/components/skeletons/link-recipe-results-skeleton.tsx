import { Skeleton } from "@/components/ui/skeleton";

export function LinkRecipeResultsSkeleton() {
  return (
    <div className="space-y-1">
      {[0, 1, 2].map((index) => (
        <Skeleton
          key={`link-recipe-result-skeleton-${index}`}
          className="h-11 w-full rounded-control"
        />
      ))}
    </div>
  );
}
