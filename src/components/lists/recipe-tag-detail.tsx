import { ArrowLeft, Book, Calendar, Hash } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { getRecipesByTag } from "@/lib/server-actions/recipe-tags-actions";
import { formatRecentTime } from "@/lib/utils/time-formatting";

interface RecipeTagDetailProps {
  tagId: string;
}

export async function RecipeTagDetail({ tagId }: RecipeTagDetailProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const result = await getRecipesByTag(tagId, 20);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recipes/tags">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tags
            </Link>
          </Button>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Tag not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            This tag may have been removed or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const { tag, recipes: taggedRecipes, totalCount } = result.data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Tag Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recipes/tags">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tags
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Hash className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl text-foreground">
                    {tag.name}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {tag.category && (
                    <div className="flex items-center gap-1">
                      <span>Category:</span>
                      <Badge variant="outline" className="capitalize">
                        {tag.category}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatRecentTime(tag.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Book className="h-3 w-3" />
                    <span>
                      {totalCount} {totalCount === 1 ? "recipe" : "recipes"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recipes with this tag */}
      {taggedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background rounded-full blur-3xl opacity-50" />
            <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
              <Hash className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h3 className="text-lg font-semibold text-foreground">
              No recipes with this tag
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              This tag isn't being used by any recipes yet. Start adding it to
              recipes to organize your collection.
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
              <Link href="/recipes/tags">
                <Hash className="h-4 w-4 mr-2" />
                Back to Tags
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Recipes with "{tag.name}" tag
            </h2>
            <Badge variant="secondary">
              {totalCount} {totalCount === 1 ? "recipe" : "recipes"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taggedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  ingredientCount: 0,
                  instructionCount: 0,
                  imageCount: 0,
                  user: recipe.user
                    ? {
                        ...recipe.user,
                        email: recipe.user.email ?? "",
                      }
                    : undefined,
                }}
                className="transition-all duration-200 hover:scale-[1.02]"
                showAuthor={true}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>

          {result.data.hasMore && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {taggedRecipes.length} of {totalCount} recipes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Load more functionality can be added in the future
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
