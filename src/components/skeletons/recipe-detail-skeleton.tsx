import { BookOpen, ChefHat, Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeDetailSkeletonProps {
  hasImages?: boolean;
  hasNotes?: boolean;
  className?: string;
}

export function RecipeDetailSkeleton({
  hasImages = true,
  hasNotes = true,
  className,
}: RecipeDetailSkeletonProps) {
  return (
    <div className={`space-y-8 ${className || ""}`}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <ChefHat className="h-6 w-6 text-primary" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>

              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-4" />

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            <Skeleton className="h-9 w-9" />
          </div>
        </CardHeader>
      </Card>

      {hasImages && (
        <Card className="overflow-hidden">
          <div className="aspect-video relative">
            <Skeleton className="w-full h-full" />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`metadata-skeleton-${index + 1}`}
                className="text-center"
              >
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recipe Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton
                key={`tag-skeleton-${index + 1}`}
                className="h-6 w-16 rounded-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ingredients
              <Badge variant="secondary" className="ml-2">
                <Skeleton className="h-3 w-4" />
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={`ingredient-skeleton-${i + 1}`}
                  className="flex items-start gap-3"
                >
                  <Skeleton className="h-4 w-4 mt-0.5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Instructions
              <Badge variant="secondary" className="ml-2">
                <Skeleton className="h-3 w-8" />
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={`instruction-skeleton-${i + 1}`}
                  className="flex gap-3"
                >
                  <Skeleton className="h-6 w-6 rounded-full flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {hasNotes && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-8" />
              </CardTitle>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Array.from({ length: 2 }, (_, i) => (
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
                                  key={`note-star-skeleton-${i}-${starIndex + 1}`}
                                  className="h-4 w-4"
                                />
                              ))}
                            </div>
                            <Skeleton className="h-5 w-10" />
                          </div>

                          <div className="space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                          </div>
                        </div>

                        <Skeleton className="h-8 w-8" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
