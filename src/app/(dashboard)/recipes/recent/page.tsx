import { Clock } from "lucide-react";
import { Suspense } from "react";
import { RecentRecipesList } from "@/components/lists/recipe-recent-list";
import { RecipeCardGridSkeleton } from "@/components/skeletons/recipe-card-skeleton";

export const metadata = {
  title: "Recently Viewed | Tastebase",
  description: "Recipes you've looked at recently, ordered by last viewed",
};

export default function RecentPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-chart-3" />
            <h1 className="text-2xl font-semibold text-foreground">
              Recently Viewed
            </h1>
          </div>
          <p className="text-muted-foreground">
            Recipes you've looked at recently, ordered by last viewed
          </p>
        </div>
      </div>

      <Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
        <RecentRecipesList />
      </Suspense>
    </div>
  );
}
