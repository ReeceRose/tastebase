import { Skeleton } from "@/components/ui/skeleton";

export function RecipeExportPreviewSkeleton() {
  return (
    <div className="rounded-control bg-card p-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-8 h-5 w-32" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={`export-preview-line-${index}`}
            className="h-4 w-full"
          />
        ))}
      </div>
    </div>
  );
}
