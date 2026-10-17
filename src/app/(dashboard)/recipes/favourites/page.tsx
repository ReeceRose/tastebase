import { Heart } from "lucide-react";
import { Suspense } from "react";
import { RecipeFavoritesList } from "@/components/lists/recipe-favorites-list";
import { RecipeCardGridSkeleton } from "@/components/skeletons/recipe-card-skeleton";

export const metadata = {
  title: "Favorite Recipes | Tastebase",
  description: "Your collection of go-to recipes and family favorites",
};

export default function FavoritesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-chart-2" />
            <h1 className="text-2xl font-semibold text-foreground">
              Favorite Recipes
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your collection of go-to recipes and family favorites
          </p>
        </div>
      </div>

      <Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
        <RecipeFavoritesList />
      </Suspense>
    </div>
  );
}
