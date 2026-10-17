import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipePage } from "@/components/layout/recipe-page";
import { RecipeDetailSkeleton } from "@/components/skeletons/recipe-detail-skeleton";
import { auth } from "@/lib/auth/auth";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import { getRecipeCookSummary } from "@/lib/server-actions/recipe-cook-actions";
import { getRecipeFavoriteStatus } from "@/lib/server-actions/recipe-favorites-actions";
import { getRecipeListOptions } from "@/lib/server-actions/recipe-list-actions";
import { trackRecipeView } from "@/lib/server-actions/recipe-tracking-actions";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface RecipeDetailContentProps {
  recipeSlug: string;
  currentUserId: string;
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

async function RecipeDetailContent({
  recipeSlug,
  currentUserId,
  measurementSystem,
  temperatureUnit,
}: RecipeDetailContentProps) {
  const result = await getRecipeBySlug(recipeSlug);

  if (!result.success || !result.data) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    throw new Error(result.error || "Failed to load recipe");
  }

  const [favoriteStatus, cooks, lists] = await Promise.all([
    getRecipeFavoriteStatus(result.data.id).catch(() => undefined),
    getRecipeCookSummary(result.data.id).catch(() => undefined),
    getRecipeListOptions(result.data.id).catch(() => undefined),
    trackRecipeView(result.data.id).catch(() => undefined),
  ]);

  return (
    <RecipePage
      recipe={result.data}
      currentUserId={currentUserId}
      isFavourite={favoriteStatus?.data?.isFavorited ?? false}
      lists={lists ?? []}
      cooks={cooks ?? { count: 0, lastCookedAt: null, lastCookedBy: null }}
      measurementSystem={measurementSystem}
      temperatureUnit={temperatureUnit}
    />
  );
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
  const measurementSystem =
    session.user.preferredWeightUnit === MeasurementUnit.METRIC
      ? MeasurementUnit.METRIC
      : MeasurementUnit.IMPERIAL;
  const temperatureUnit =
    session.user.preferredTemperatureUnit === TemperatureUnit.CELSIUS
      ? TemperatureUnit.CELSIUS
      : TemperatureUnit.FAHRENHEIT;

  return (
    <Suspense fallback={<RecipeDetailSkeleton />}>
      <RecipeDetailContent
        recipeSlug={slug}
        currentUserId={session.user.id}
        measurementSystem={measurementSystem}
        temperatureUnit={temperatureUnit}
      />
    </Suspense>
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
