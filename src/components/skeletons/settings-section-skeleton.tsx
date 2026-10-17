import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSectionSkeleton() {
  return (
    <div className="space-y-3 rounded-tile bg-card p-6" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <div
          key={`settings-row-skeleton-${index}`}
          className="flex items-center gap-4"
        >
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-1/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
