import { Book, Clock, Search } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { getRecentlyViewedRecipes } from "@/lib/server-actions/recipe-tracking-actions";
import { formatRecentTime, isVeryRecent } from "@/lib/utils/time-formatting";

export async function RecentRecipesList() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const result = await getRecentlyViewedRecipes(20);

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Failed to load recent recipes
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const recentRecipes = result.data;

  if (recentRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-muted/20 rounded-full blur-3xl opacity-50" />
          <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
            <Clock className="h-12 w-12 text-chart-3" />
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">
            No recent activity
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Your recently viewed recipes will appear here as you browse your
            collection. Start exploring to build your viewing history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button asChild>
            <Link href="/recipes">
              <Book className="h-4 w-4 mr-2" />
              Explore Recipes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">
              <Search className="h-4 w-4 mr-2" />
              Search Recipes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          {recentRecipes.length} recent{recentRecipes.length !== 1 ? "" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentRecipes.map((recent) => (
          <div key={recent.recipe.id} className="relative group">
            <RecipeCard
              recipe={{
                ...recent.recipe,
                ingredientCount: 0,
                instructionCount: 0,
                imageCount: 0,
              }}
              className="transition-all duration-200 hover:scale-[1.02]"
              showAuthor={true}
              currentUserId={session?.user?.id}
            />

            {isVeryRecent(recent.viewedAt) && (
              <div className="absolute top-2 left-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-chart-3/20 text-chart-3"
                >
                  Recently viewed
                </Badge>
              </div>
            )}

            <div className="mt-2 flex items-center justify-center text-xs">
              <time
                dateTime={recent.viewedAt.toISOString()}
                className="text-muted-foreground"
              >
                Viewed {formatRecentTime(recent.viewedAt)}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
