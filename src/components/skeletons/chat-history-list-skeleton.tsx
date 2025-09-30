import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatHistoryListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search bar skeleton */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Compact chat cards skeleton */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={`chat-skeleton-${index}`} className="p-4">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              </div>

              {/* Message preview */}
              <div className="pl-11">
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
