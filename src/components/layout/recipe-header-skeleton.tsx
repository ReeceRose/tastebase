import { Skeleton } from "@/components/ui/skeleton";

interface RecipeHeaderSkeletonProps {
  showSearch?: boolean;
  showViewToggle?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export function RecipeHeaderSkeleton({
  showSearch = false,
  showViewToggle = false,
  showFilters = false,
  showActions = false,
}: RecipeHeaderSkeletonProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <Skeleton className="h-6 w-48 sm:h-8" />
              <Skeleton className="h-5 w-16 rounded-full w-fit" />
            </div>
            <Skeleton className="h-3 w-64 sm:h-4" />
          </div>

          {showActions && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-8 sm:hidden" />
              <Skeleton className="h-8 w-8" />
            </div>
          )}
        </div>

        {(showSearch || showViewToggle || showFilters) && (
          <div className="space-y-4">
            {showSearch && <Skeleton className="h-9 w-full" />}

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-9 w-[140px]" />
                  <Skeleton className="h-9 w-[120px]" />
                  <Skeleton className="h-8 w-24 hidden sm:block" />
                  <Skeleton className="h-8 w-8 sm:hidden" />
                </div>
              )}

              {showViewToggle && (
                <div className="flex items-center border rounded-lg p-1 self-start sm:self-auto">
                  {[0, 1, 2].map((index) => (
                    <Skeleton
                      key={`view-toggle-${index + 1}`}
                      className="h-8 w-11 m-0.5"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
