import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeSearchSkeletonProps {
  showAdvanced?: boolean;
  className?: string;
}

export function RecipeSearchSkeleton({
  showAdvanced = false,
  className,
}: RecipeSearchSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Recipes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-10 mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {showAdvanced && (
            <>
              <div className="border-t border-border" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-4 w-24 mb-3" />
                  <div className="space-y-2">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={`difficulty-skeleton-${index + 1}`}
                        className="flex items-center space-x-2"
                      >
                        <Skeleton className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="px-2">
                    <Skeleton className="h-2 w-full my-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>

                <div>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="px-2">
                    <Skeleton className="h-2 w-full my-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>

                <div>
                  <Skeleton className="h-4 w-20 mb-3" />
                  <div className="grid grid-cols-2 gap-2 max-h-32">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={`cuisine-skeleton-${i + 1}`}
                        className="flex items-center space-x-2"
                      >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Skeleton className="h-4 w-12 mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-16" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[0, 1, 2].map((index) => (
                    <Skeleton
                      key={`tag-skeleton-${index + 1}`}
                      className="h-6 w-16 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
