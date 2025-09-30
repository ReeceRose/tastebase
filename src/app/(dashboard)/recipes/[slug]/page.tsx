import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeDetailView } from "@/components/cards/recipe-detail-view";
import { RecipeDetailSkeleton } from "@/components/skeletons/recipe-detail-skeleton";
import { auth } from "@/lib/auth/auth";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function RecipeDetailContent({
  recipeSlug,
  currentUserId,
}: {
  recipeSlug: string;
  currentUserId: string;
}) {
  const result = await getRecipeBySlug(recipeSlug);

  if (!result.success || !result.data) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    throw new Error(result.error || "Failed to load recipe");
  }

  const canEdit = result.data.userId === currentUserId;

  return <RecipeDetailView recipe={result.data} canEdit={canEdit} />;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { slug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetailContent
          recipeSlug={slug}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  const result = await getRecipeBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Recipe Not Found",
      description: "The requested recipe could not be found.",
    };
  }

  const recipe = result.data;

  return {
    title: `${recipe.title} - Tastebase`,
    description:
      recipe.description ||
      `Discover this delicious ${recipe.title} recipe with ${recipe.ingredients?.length || 0} ingredients and ${recipe.instructions?.length || 0} steps.`,
    openGraph: {
      title: recipe.title,
      description: recipe.description || `A delicious ${recipe.title} recipe`,
      images:
        recipe.images
          ?.filter((img) => img.isHero)
          .map((img) => ({
            url: `/api/recipes/images/${img.filename}`,
            width: img.width || 800,
            height: img.height || 600,
            alt: img.altText || recipe.title,
          })) || [],
    },
  };
}
