import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeInstructionsListSkeletonProps {
  instructionCount?: number;
  showCheckboxes?: boolean;
}

export function RecipeInstructionsListSkeleton({
  instructionCount = 5,
  showCheckboxes = true,
}: RecipeInstructionsListSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-12" />
          </div>

          {showCheckboxes && instructionCount > 1 && (
            <Skeleton className="h-8 w-24" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          {Array.from({ length: instructionCount }, (_, index) => (
            <div
              key={`instruction-skeleton-${index + 1}`}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 flex flex-col items-center">
                {showCheckboxes ? (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  </div>
                ) : (
                  <Skeleton className="w-8 h-8 rounded-full" />
                )}

                {index < instructionCount - 1 && (
                  <Skeleton className="w-px h-5 mt-2" />
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-12" />

                  <div className="flex items-center gap-2">
                    {index % 3 === 0 && (
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    )}

                    {index % 4 === 0 && (
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  {index % 2 === 0 && <Skeleton className="h-4 w-3/4" />}
                </div>

                {index % 3 === 0 && (
                  <div className="mt-2">
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
