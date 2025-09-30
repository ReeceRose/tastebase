import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AIOnboardingSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-80 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`ai-benefit-skeleton-${index}`}
              className="flex space-x-3"
            >
              <div className="flex-shrink-0">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-48 mx-auto" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <div
                key={`provider-option-skeleton-${index}`}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>

        <div className="text-center">
          <Skeleton className="h-3 w-80 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}
