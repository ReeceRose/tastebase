import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecipeDiscoveryChatSkeleton() {
  return (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area Skeleton */}
        <div className="flex-1 p-4">
          <div className="text-center py-8 space-y-4">
            <Skeleton className="w-16 h-16 mx-auto rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-64 mx-auto" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>

            {/* Quick suggestions skeleton */}
            <div className="flex flex-wrap gap-2 justify-center pt-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton
                  key={`suggestion-skeleton-${index}`}
                  className="h-10 w-32"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="flex-shrink-0 border-t bg-muted/30 p-4">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
