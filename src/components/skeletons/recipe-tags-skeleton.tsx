import { Skeleton } from "@/components/ui/skeleton";

export function RecipeTagsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
      aria-busy="true"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <Skeleton
          key={`tag-tile-skeleton-${index}`}
          className="min-h-[170px] rounded-tile"
        />
      ))}
    </div>
  );
}
