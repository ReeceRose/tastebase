import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeNotesSkeletonProps {
  showForm?: boolean;
  noteCount?: number;
  className?: string;
}

export function RecipeNotesSkeleton({
  showForm = false,
  noteCount = 3,
  className,
}: RecipeNotesSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Reviews
            <Skeleton className="h-4 w-8" />
          </CardTitle>
          <Skeleton className="h-8 w-20" />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {showForm && (
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-32 w-full" />
              </div>

              <div>
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <Skeleton
                      key={`rating-skeleton-${index + 1}`}
                      className="h-6 w-6"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Skeleton className="h-5 w-32 mb-4" />

          <div className="space-y-4">
            {Array.from({ length: noteCount }, (_, i) => (
              <Card
                key={`note-skeleton-${i + 1}`}
                className="transition-colors"
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[0, 1, 2, 3, 4].map((starIndex) => (
                              <Skeleton
                                key={`star-skeleton-${i}-${starIndex + 1}`}
                                className="h-4 w-4"
                              />
                            ))}
                          </div>
                          <Skeleton className="h-5 w-10" />
                        </div>

                        <div className="space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-4 w-3/5" />
                        </div>
                      </div>

                      <Skeleton className="h-8 w-8" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-12" />
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
