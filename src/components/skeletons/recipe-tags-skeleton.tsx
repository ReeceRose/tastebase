import { Skeleton } from "@/components/ui/skeleton";

export function RecipeTagsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div
            key={`stats-skeleton-${index}`}
            className="space-y-3 p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Tag Categories Skeleton */}
      <div className="space-y-6">
        {[0, 1, 2].map((categoryIndex) => (
          <div
            key={`category-skeleton-${categoryIndex}`}
            className="border rounded-lg"
          >
            {/* Category Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Tags Grid */}
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((tagIndex) => (
                  <div
                    key={`tag-skeleton-${categoryIndex}-${tagIndex}`}
                    className="p-3 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
