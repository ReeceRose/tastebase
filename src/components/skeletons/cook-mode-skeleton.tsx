import { Skeleton } from "@/components/ui/skeleton";

export function CookModeSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      aria-busy="true"
    >
      <div className="bg-muted px-4 pt-4 pb-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full bg-background/60" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-56 max-w-full bg-background/60" />
            <Skeleton className="h-3.5 w-24 rounded-full bg-background/60" />
          </div>
          <Skeleton className="h-11 w-14 rounded-control bg-background/60 sm:w-36" />
        </div>
        <Skeleton className="mt-3 h-1.5 w-full rounded-full bg-background/60" />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-8 sm:px-10 lg:px-20">
        <div className="mx-auto w-full max-w-3xl">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="mt-6 h-9 w-full sm:h-12" />
          <Skeleton className="mt-3 h-9 w-4/5 sm:h-12" />
          <Skeleton className="mt-3 h-9 w-3/5 sm:h-12" />
        </div>
      </div>
      <div className="flex gap-3 border-t-2 border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
        <Skeleton className="h-13 flex-1 rounded-control sm:w-28 sm:flex-none" />
        <Skeleton className="h-13 flex-[2] rounded-control sm:ml-auto sm:w-40 sm:flex-none" />
      </div>
    </div>
  );
}
