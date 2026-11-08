import { Skeleton } from "@/components/ui/skeleton";

function SectionIntroSkeleton() {
  return (
    <div className="max-w-[60ch] space-y-2">
      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="h-4 w-2/3 rounded-full" />
    </div>
  );
}

export function HouseholdSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <SectionIntroSkeleton />
      <div className="divide-y-2 divide-background overflow-hidden rounded-tile bg-card">
        {[0, 1, 2].map((index) => (
          <div
            key={`household-member-skeleton-${index}`}
            className="flex items-center gap-4 px-5 py-4"
          >
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-3.5 w-24 rounded-full" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3.5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SharingSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <SectionIntroSkeleton />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div
            key={`sharing-option-skeleton-${index}`}
            className="flex items-start gap-3 rounded-control border-2 border-input bg-card p-4"
          >
            <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StorageSectionSkeleton() {
  return (
    <div className="space-y-5 rounded-tile bg-card p-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-12 w-36" />
        </div>
        <Skeleton className="h-9 w-32 rounded-control" />
      </div>
      <div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="mt-2 flex gap-4">
          <Skeleton className="h-3.5 w-32 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`storage-stat-skeleton-${index}`}
            className="space-y-2 rounded-control bg-background px-4 py-3"
          >
            <Skeleton className="h-3.5 w-16 rounded-full" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3.5 w-3/4 rounded-full" />
    </div>
  );
}

export function ShortcutsSectionSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-16 w-full rounded-tile" />
      <div className="divide-y-2 divide-background overflow-hidden rounded-tile bg-card">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div
            key={`shortcut-row-skeleton-${index}`}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-control" />
          </div>
        ))}
      </div>
    </div>
  );
}
