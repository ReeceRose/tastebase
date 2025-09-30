import { Book, Heart, Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { getUserFavoriteRecipes } from "@/lib/server-actions/recipe-favorites-actions";
import { formatFavoriteTime } from "@/lib/utils/time-formatting";

export async function RecipeFavoritesList() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const result = await getUserFavoriteRecipes();

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Failed to load favorites
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const favorites = result.data;

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 to-primary/5 rounded-full blur-3xl opacity-50" />
          <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
            <Heart className="h-12 w-12 text-chart-2" />
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">
            No favorite recipes yet
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Start building your personal collection by marking recipes as
            favorites. Look for the heart icon when viewing any recipe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button asChild>
            <Link href="/recipes">
              <Book className="h-4 w-4 mr-2" />
              Browse Recipes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          {favorites.length} {favorites.length === 1 ? "favorite" : "favorites"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <div key={favorite.recipe.id} className="relative group">
            <RecipeCard
              recipe={{
                ...favorite.recipe,
                ingredientCount: 0,
                instructionCount: 0,
                imageCount: 0,
              }}
              className="transition-all duration-200 hover:scale-[1.02]"
              showAuthor={true}
              currentUserId={session?.user?.id}
            />

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-8 w-8 bg-background/80 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-chart-2 fill-current" />
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground text-center">
              <time dateTime={favorite.favoritedAt.toISOString()}>
                {formatFavoriteTime(favorite.favoritedAt)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
