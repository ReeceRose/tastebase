import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CookMode } from "@/components/layout/cook-mode";
import { CookModeSkeleton } from "@/components/skeletons/cook-mode-skeleton";
import { auth } from "@/lib/auth/auth";
import { getRecipeBySlug } from "@/lib/server-actions/recipe-actions";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { resolveSwatch } from "@/lib/utils/swatches";

interface CookPageProps {
  params: Promise<{ slug: string }>;
}

interface CookContentProps {
  slug: string;
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

async function CookContent({
  slug,
  measurementSystem,
  temperatureUnit,
}: CookContentProps) {
  const result = await getRecipeBySlug(slug);
  if (!result.success || !result.data) {
    if (result.error === "Recipe not found") notFound();
    throw new Error(result.error || "Failed to load recipe");
  }

  return (
    <CookMode
      recipe={result.data}
      swatch={resolveSwatch(result.data.id, result.data.swatch)}
      measurementSystem={measurementSystem}
      temperatureUnit={temperatureUnit}
    />
  );
}

export async function generateMetadata({ params }: CookPageProps) {
  const { slug } = await params;
  const result = await getRecipeBySlug(slug);
  return {
    title: result.data
      ? `Cooking ${result.data.title} | Tastebase`
      : "Cook mode",
  };
}

export default async function CookPage({ params }: CookPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { slug } = await params;

  return (
    <Suspense fallback={<CookModeSkeleton />}>
      <CookContent
        slug={slug}
        measurementSystem={
          session.user.preferredWeightUnit === MeasurementUnit.METRIC
            ? MeasurementUnit.METRIC
            : MeasurementUnit.IMPERIAL
        }
        temperatureUnit={
          session.user.preferredTemperatureUnit === TemperatureUnit.CELSIUS
            ? TemperatureUnit.CELSIUS
            : TemperatureUnit.FAHRENHEIT
        }
      />
    </Suspense>
  );
}
