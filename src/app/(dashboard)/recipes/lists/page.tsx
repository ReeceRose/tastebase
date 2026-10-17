import { Suspense } from "react";
import { RecipeListsGrid } from "@/components/lists/recipe-lists-grid";
import { NewListButton } from "@/components/modals/new-list-button";
import { RecipeListsSkeleton } from "@/components/skeletons/recipe-lists-skeleton";

export const metadata = {
  title: "Lists | Tastebase",
  description: "Your own lists of recipes",
};

export default function ListsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
            Lists
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your own lists of recipes. Only you can see them.
          </p>
        </div>
        <NewListButton />
      </div>
      <Suspense fallback={<RecipeListsSkeleton />}>
        <RecipeListsGrid />
      </Suspense>
    </div>
  );
}
