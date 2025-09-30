import { Tags } from "lucide-react";
import { Suspense } from "react";
import { RecipeTagsList } from "@/components/lists/recipe-tags-list";
import { RecipeTagsSkeleton } from "@/components/skeletons/recipe-tags-skeleton";

export const metadata = {
  title: "Recipe Tags | Tastebase",
  description: "Browse and explore recipes by tags and categories",
};

export default function TagsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Tags className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Recipe Tags
            </h1>
          </div>
          <p className="text-muted-foreground">
            Browse and explore recipes by tags and categories
          </p>
        </div>
      </div>

      <Suspense fallback={<RecipeTagsSkeleton />}>
        <RecipeTagsList />
      </Suspense>
    </div>
  );
}
