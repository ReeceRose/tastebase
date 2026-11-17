import { Skeleton } from "@/components/ui/skeleton";

export function JournalTimelineSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <div className="ml-1.5 space-y-4 border-l-2 border-border pl-6">
          {[0, 1, 2].map((index) => (
            <div
              key={`journal-entry-skeleton-${index}`}
              className="space-y-3 rounded-tile bg-card p-5"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="aspect-square rounded-control" />
                <Skeleton className="aspect-square rounded-control" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JournalCardSkeleton() {
  return (
    <div className="space-y-3 rounded-tile bg-card p-6" aria-busy="true">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-16 w-full rounded-control" />
    </div>
  );
}

export function JournalYearReviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-11 w-64 rounded-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={`year-stat-skeleton-${index}`}
            className="h-24 rounded-tile"
          />
        ))}
      </div>
      <Skeleton className="h-52 rounded-tile" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-tile" />
        <Skeleton className="h-72 rounded-tile" />
      </div>
    </div>
  );
}

export function JournalPhotoWallSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <Skeleton
            key={`wall-photo-skeleton-${index}`}
            className="aspect-square rounded-control"
          />
        ))}
      </div>
    </div>
  );
}

export function JournalMonthReviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-11 w-56 rounded-full" />
      <Skeleton className="h-6 w-full max-w-md" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={`month-stat-skeleton-${index}`}
            className="h-24 rounded-tile"
          />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-tile" />
    </div>
  );
}
