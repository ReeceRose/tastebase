import { Suspense } from "react";
import { RecipeTagsList } from "@/components/lists/recipe-tags-list";
import { RecipeTagsSkeleton } from "@/components/skeletons/recipe-tags-skeleton";

export const metadata = {
  title: "Tags | Tastebase",
  description: "Browse the house's recipes by tag",
};

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
          Tags
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pick a tag to see every recipe filed under it.
        </p>
      </div>
      <Suspense fallback={<RecipeTagsSkeleton />}>
        <RecipeTagsList />
      </Suspense>
    </div>
  );
}
