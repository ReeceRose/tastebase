"use client";

import { Clock, Eye, Plus, Star, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { performGlobalSearch } from "@/lib/server-actions/global-search-actions";
import { createRecipe } from "@/lib/server-actions/recipe-actions";
import { RecipeDifficulty } from "@/lib/types";

interface RecipeCardMessageProps {
  content: string;
}

interface ParsedRecipe {
  name: string;
  description?: string;
  time?: string;
  difficulty?: string;
  whyPerfect?: string;
  servings?: string;
}

export function RecipeCardMessage({ content }: RecipeCardMessageProps) {
  const router = useRouter();
  const [creatingRecipeId, setCreatingRecipeId] = useState<string | null>(null);
  const [searchingRecipeId, setSearchingRecipeId] = useState<string | null>(
    null,
  );

  // Parse recipe suggestions from AI response
  const parseRecipes = (text: string): ParsedRecipe[] => {
    const recipes: ParsedRecipe[] = [];
    const recipeBlocks = text.split(/\*\*\[(.*?)\]\*\*/);

    for (let i = 1; i < recipeBlocks.length; i += 2) {
      const name = recipeBlocks[i];
      const details = recipeBlocks[i + 1] || "";

      const recipe: ParsedRecipe = { name };

      // Extract details using regex patterns
      const descMatch = details.match(/\*Description:\s*([^\n]*)/);
      if (descMatch) recipe.description = descMatch[1].trim();

      const timeMatch = details.match(/\*Time:\s*([^\n]*)/);
      if (timeMatch) recipe.time = timeMatch[1].trim();

      const difficultyMatch = details.match(/\*Difficulty:\s*([^\n]*)/);
      if (difficultyMatch) recipe.difficulty = difficultyMatch[1].trim();

      const whyMatch = details.match(/\*Why it's perfect:\s*([^\n]*)/);
      if (whyMatch) recipe.whyPerfect = whyMatch[1].trim();

      const servingsMatch = details.match(/\*Servings:\s*([^\n]*)/);
      if (servingsMatch) recipe.servings = servingsMatch[1].trim();

      recipes.push(recipe);
    }

    return recipes;
  };

  const recipes = parseRecipes(content);
  const hasRecipes = recipes.length > 0;

  // Split content into before recipes, recipes, and after recipes
  const beforeRecipes = content.split(/\*\*\[.*?\]\*\*/)[0].trim();
  const afterRecipesMatch = content.match(
    /\*\*\[.*?\]\*\*[\s\S]*?(\n\n[\s\S]*)/,
  );
  const afterRecipes = afterRecipesMatch ? afterRecipesMatch[1].trim() : "";

  const handleCreateRecipe = async (recipe: ParsedRecipe) => {
    const recipeId = `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`;
    setCreatingRecipeId(recipeId);

    try {
      // Parse difficulty to enum
      let difficulty: RecipeDifficulty | undefined;
      if (recipe.difficulty) {
        const difficultyLower = recipe.difficulty.toLowerCase();
        if (difficultyLower === "easy") difficulty = RecipeDifficulty.EASY;
        else if (difficultyLower === "medium")
          difficulty = RecipeDifficulty.MEDIUM;
        else if (difficultyLower === "hard") difficulty = RecipeDifficulty.HARD;
      }

      // Parse servings
      let servings = 4; // Default
      if (recipe.servings) {
        const servingsMatch = recipe.servings.match(/(\d+)/);
        if (servingsMatch) {
          servings = parseInt(servingsMatch[1], 10);
        }
      }

      // Create recipe with basic structure
      const result = await createRecipe({
        title: recipe.name,
        description: recipe.description || "",
        servings,
        difficulty,
        prepTimeMinutes: undefined,
        cookTimeMinutes: undefined,
        isPublic: true, // Default to public for AI-suggested recipes
        ingredients: [], // Will be filled in later
        instructions: [], // Will be filled in later
        tags: [],
      });

      if (result.success && result.data) {
        toast.success("Recipe Created!", {
          description: `${recipe.name} has been added to your collection.`,
          action: {
            label: "Open Recipe",
            onClick: () => router.push(`/recipes/${result.data.slug}`),
          },
        });
      } else {
        throw new Error(result.error || "Failed to create recipe");
      }
    } catch (error) {
      console.error("Failed to create recipe:", error);
      toast.error("Failed to Create Recipe", {
        description:
          "There was an error creating the recipe. Please try again.",
      });
    } finally {
      setCreatingRecipeId(null);
    }
  };

  const handleViewSimilar = async (recipe: ParsedRecipe) => {
    const recipeId = `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`;
    setSearchingRecipeId(recipeId);

    try {
      // Search for similar recipes using the recipe name and description
      const searchQuery = `${recipe.name} ${recipe.description || ""}`.trim();
      const result = await performGlobalSearch(searchQuery, 6);

      if (result.success && result.recipes.length > 0) {
        // Navigate to search results
        const searchParams = new URLSearchParams({
          q: recipe.name,
          from: "chat",
        });
        router.push(`/search?${searchParams.toString()}`);

        toast.success("Similar Recipes Found", {
          description: `Found ${result.recipes.length} similar recipes.`,
        });
      } else {
        toast.info("No Similar Recipes", {
          description: "No similar recipes found in your collection.",
        });
      }
    } catch (error) {
      console.error("Failed to search for similar recipes:", error);
      toast.error("Search Failed", {
        description: "There was an error searching for similar recipes.",
      });
    } finally {
      setSearchingRecipeId(null);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-secondary text-secondary-foreground";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Content before recipes */}
      {beforeRecipes && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {beforeRecipes}
        </div>
      )}

      {/* Recipe cards */}
      {hasRecipes && (
        <div className="space-y-3">
          {recipes.map((recipe, index) => (
            <Card
              key={`recipe-card-${recipe.name.replace(/\s+/g, "-").toLowerCase()}-${index}`}
              className="border-l-4 border-l-primary bg-muted shadow-md hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start justify-between">
                  <span className="text-primary font-semibold">
                    {recipe.name}
                  </span>
                  <div className="flex gap-1 ml-2">
                    {recipe.difficulty && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}
                      >
                        {recipe.difficulty}
                      </Badge>
                    )}
                  </div>
                </CardTitle>

                {recipe.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Recipe meta info */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {recipe.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{recipe.time}</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{recipe.servings}</span>
                    </div>
                  )}
                </div>

                {/* Why it's perfect */}
                {recipe.whyPerfect && (
                  <div className="bg-secondary border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-secondary-foreground mb-1">
                          Why it's perfect for you:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {recipe.whyPerfect}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCreateRecipe(recipe)}
                    size="sm"
                    className="flex-1"
                    disabled={
                      creatingRecipeId ===
                      `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {creatingRecipeId ===
                    `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`
                      ? "Creating..."
                      : "Create Recipe"}
                  </Button>
                  <Button
                    onClick={() => handleViewSimilar(recipe)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={
                      searchingRecipeId ===
                      `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`
                    }
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {searchingRecipeId ===
                    `${recipe.name.replace(/\s+/g, "-").toLowerCase()}`
                      ? "Searching..."
                      : "Find Similar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content after recipes */}
      {afterRecipes && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {afterRecipes}
        </div>
      )}
    </div>
  );
}
