import { Skeleton } from "@/components/ui/skeleton";

export function AISettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-3">
        {[0, 1].map((index) => (
          <div
            key={`ai-provider-row-skeleton-${index}`}
            className="flex items-center justify-between rounded-control bg-background p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-36" />
    </div>
  );
}
