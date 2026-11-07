import { Skeleton } from "@/components/ui/skeleton";

export function PageTitleSkeleton() {
  return <Skeleton className="h-8 w-56 lg:h-10 lg:w-64" />;
}

export function RecipeEditorSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="flex items-center gap-3 py-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="ml-auto h-13 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <div className="hidden space-y-1 self-start lg:block">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton
              key={`editor-nav-skeleton-${index}`}
              className="h-11 w-full rounded-xl"
            />
          ))}
        </div>
        <div className="min-w-0 space-y-5">
          {[0, 1, 2].map((index) => (
            <div
              key={`editor-section-skeleton-${index}`}
              className="rounded-tile bg-card p-5 sm:p-6"
            >
              <Skeleton className="mb-5 h-7 w-40" />
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecipeFormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <PageTitleSkeleton />
      <RecipeEditorSkeleton />
    </div>
  );
}
