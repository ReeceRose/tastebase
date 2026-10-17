import { Skeleton } from "@/components/ui/skeleton";

export function CookModeSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      aria-busy="true"
    >
      <div className="bg-muted px-4 pt-4 pb-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full bg-background/60" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-56 bg-background/60" />
            <Skeleton className="h-3.5 w-24 rounded-full bg-background/60" />
          </div>
        </div>
        <Skeleton className="mt-3 h-1.5 w-full rounded-full bg-background/60" />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="mt-6 h-9 w-full" />
        <Skeleton className="mt-3 h-9 w-4/5" />
        <Skeleton className="mt-3 h-9 w-3/5" />
      </div>
      <div className="flex gap-3 bg-card px-4 py-3 sm:px-8">
        <Skeleton className="h-13 w-32" />
        <Skeleton className="ml-auto h-13 w-44" />
      </div>
    </div>
  );
}
