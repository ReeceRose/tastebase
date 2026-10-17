import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeImportProgressProps {
  label: string;
}

export function RecipeImportProgress({ label }: RecipeImportProgressProps) {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true">
      <div>
        <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
          Bringing in your recipe
        </h1>
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-lead text-muted-foreground"
        >
          <Loader2 aria-hidden className="size-5 animate-spin" />
          {label}
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-tile bg-card p-5 sm:flex-row sm:p-6">
        <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-control sm:w-56" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-5 w-3/5 rounded-full" />
          <div className="flex gap-2 pt-2">
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={`import-fact-skeleton-${index}`}
                className="h-8 w-24 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-tile bg-card p-5 sm:p-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton
            key={`import-ingredient-skeleton-${index}`}
            className="h-5 w-full rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
