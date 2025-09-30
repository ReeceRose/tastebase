import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeSearchResultsSkeletonProps {
  view?: ViewMode;
}

export function RecipeSearchResultsSkeleton({
  view = ViewMode.CARDS,
}: RecipeSearchResultsSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div
        className={cn(
          "gap-4",
          view === ViewMode.CARDS &&
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          view === ViewMode.GRID &&
            "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          view === ViewMode.LIST && "flex flex-col space-y-2",
        )}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <Card
            key={`search-result-skeleton-${index + 1}`}
            className="overflow-hidden"
          >
            <div className="aspect-video relative">
              <Skeleton className="w-full h-full" />
            </div>
            <CardContent className="p-4">
              {view === ViewMode.LIST ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
