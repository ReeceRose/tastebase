import { Edit } from "lucide-react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeEditForm } from "@/components/forms/recipe-edit-form";
import { RecipeFormSkeleton } from "@/components/skeletons/recipe-form-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";

interface RecipeEditPageProps {
  params: Promise<{ slug: string }>;
}

async function RecipeEditContent({ recipeSlug }: { recipeSlug: string }) {
  const result = await getRecipeBySlug(recipeSlug);

  if (!result.success || !result.data) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    throw new Error(result.error || "Failed to load recipe");
  }

  return <RecipeEditForm recipe={result.data} />;
}

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { slug } = await params;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Edit Recipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Make changes to your recipe. All fields marked with * are required.
          </p>
        </CardContent>
      </Card>

      <Suspense fallback={<RecipeFormSkeleton />}>
        <RecipeEditContent recipeSlug={slug} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: RecipeEditPageProps) {
  const { slug } = await params;
  const result = await getRecipeBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Edit Recipe - Recipe Not Found",
      description: "The recipe you're trying to edit could not be found.",
    };
  }

  const recipe = result.data;

  return {
    title: `Edit ${recipe.title} - Tastebase`,
    description: `Edit your ${recipe.title} recipe. Update ingredients, instructions, and more.`,
  };
}
