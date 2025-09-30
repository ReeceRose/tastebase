import { Book, ChefHat, Clock, Heart, Plus, Tags } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAllUserTags,
  getTagStats,
} from "@/lib/server-actions/recipe-tags-actions";

// Category icon mapping
const categoryIcons = {
  cuisine: ChefHat,
  diet: Heart,
  course: Clock,
  method: Tags,
  time: Clock,
  occasion: Heart,
  uncategorized: Tags,
};

// Category color mapping using chart colors
const categoryColors = {
  cuisine: "chart-1",
  diet: "chart-2",
  course: "chart-3",
  method: "chart-4",
  time: "chart-5",
  occasion: "chart-1",
  uncategorized: "muted",
};

export async function RecipeTagsList() {
  const [tagsResult, statsResult] = await Promise.all([
    getAllUserTags(),
    getTagStats(),
  ]);

  if (!tagsResult.success || !tagsResult.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Failed to load tags</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const tags = tagsResult.data;
  const stats = statsResult.success ? statsResult.data : null;

  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-chart-1/5 rounded-full blur-3xl opacity-50" />
          <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
            <Tags className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">No tags yet</h3>
          <p className="text-muted-foreground leading-relaxed">
            Start organizing your recipes by adding tags when you create or edit
            recipes. Tags help you categorize and find your recipes easily.
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

  // Group tags by category
  const tagsByCategory = tags.reduce(
    (acc, tag) => {
      const category = tag.category || "uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, typeof tags>,
  );

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
              <p className="text-xs text-muted-foreground">
                Unique tags in your collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tagged Recipes
              </CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRecipesTagged}
              </div>
              <p className="text-xs text-muted-foreground">Recipes with tags</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Tags/Recipe
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTagsPerRecipe}</div>
              <p className="text-xs text-muted-foreground">
                Average tags per recipe
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tags by Category */}
      <div className="space-y-6">
        {Object.entries(tagsByCategory)
          .sort(([a], [b]) => {
            // Sort categories with cuisine and diet first, then alphabetically
            const order = [
              "cuisine",
              "diet",
              "course",
              "method",
              "time",
              "occasion",
              "uncategorized",
            ];
            const aIndex = order.indexOf(a);
            const bIndex = order.indexOf(b);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
          })
          .map(([category, categoryTags]) => {
            const IconComponent =
              categoryIcons[category as keyof typeof categoryIcons] || Tags;
            const colorClass =
              categoryColors[category as keyof typeof categoryColors] ||
              "muted";

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${colorClass}/20`}>
                      <IconComponent className={`h-5 w-5 text-${colorClass}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {category === "uncategorized" ? "Other" : category}
                      </CardTitle>
                      <CardDescription>
                        {categoryTags.length}{" "}
                        {categoryTags.length === 1 ? "tag" : "tags"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {categoryTags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/recipes/tags/${tag.id}`}
                        className="group block"
                      >
                        <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {tag.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tag.recipeCount}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tag.recipeCount === 1
                              ? "1 recipe"
                              : `${tag.recipeCount} recipes`}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
