import { Skeleton } from "@/components/ui/skeleton";

export function RecipeSearchHeaderSkeleton() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 sm:h-8" />
            <Skeleton className="h-3 w-64 sm:h-4" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-16 hidden sm:block" />
              <Skeleton className="h-8 w-20 sm:hidden" />
            </div>

            <div className="flex items-center border rounded-lg p-1 self-start sm:self-auto">
              {[0, 1, 2].map((index) => (
                <Skeleton
                  key={`view-toggle-${index + 1}`}
                  className="h-8 w-11 m-0.5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
