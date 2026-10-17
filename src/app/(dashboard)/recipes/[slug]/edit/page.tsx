import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeEditor } from "@/components/forms/recipe-editor/recipe-editor";
import { RecipeFormSkeleton } from "@/components/skeletons/recipe-form-skeleton";
import { auth } from "@/lib/auth/auth";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import { RecipeEditorMode } from "@/lib/types";
import { editorValuesFromRecipe } from "@/lib/utils/recipe-editor-values";

interface RecipeEditPageProps {
  params: Promise<{ slug: string }>;
}

interface RecipeEditContentProps {
  recipeSlug: string;
  userId: string;
}

async function RecipeEditContent({
  recipeSlug,
  userId,
}: RecipeEditContentProps) {
  const result = await getRecipeBySlug(recipeSlug);

  if (!result.success || !result.data) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    throw new Error(result.error || "Failed to load recipe");
  }

  if (result.data.userId !== userId) {
    redirect(`/recipes/${result.data.slug}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        Edit recipe
      </h1>
      <RecipeEditor
        mode={RecipeEditorMode.EDIT}
        userId={userId}
        recipe={result.data}
        initialValues={editorValuesFromRecipe(result.data)}
        notice={null}
      />
    </div>
  );
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
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeEditContent recipeSlug={slug} userId={session.user.id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: RecipeEditPageProps) {
  const { slug } = await params;
  const result = await getRecipeBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Recipe not found | Tastebase",
      description: "The recipe you're trying to edit could not be found.",
    };
  }

  const recipe = result.data;

  return {
    title: `Edit ${recipe.title} | Tastebase`,
    description: `Edit your ${recipe.title} recipe. Update ingredients, instructions, and more.`,
  };
}
