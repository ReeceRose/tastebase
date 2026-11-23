import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeCompare } from "@/components/layout/recipe-compare";
import { RecipeCompareSkeleton } from "@/components/skeletons/recipe-compare-skeleton";
import { auth } from "@/lib/auth/auth";
import { getRecipesToCompare } from "@/lib/server-actions/recipe-compare-actions";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { parseCompareSlugs } from "@/lib/utils/recipe-compare";

export const metadata = {
  title: "Compare recipes - Tastebase",
};

interface ComparePageProps {
  searchParams: Promise<{ r?: string | string[] }>;
}

interface CompareContentProps {
  slugs: string[];
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

async function CompareContent({
  slugs,
  measurementSystem,
  temperatureUnit,
}: CompareContentProps) {
  const { recipes, missing } = await getRecipesToCompare(slugs);

  return (
    <RecipeCompare
      items={recipes}
      missing={missing}
      preferredSystem={measurementSystem}
      temperatureUnit={temperatureUnit}
    />
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { r } = await searchParams;
  const slugs = parseCompareSlugs(r ?? null);
  const measurementSystem =
    session.user.preferredWeightUnit === MeasurementUnit.METRIC
      ? MeasurementUnit.METRIC
      : MeasurementUnit.IMPERIAL;
  const temperatureUnit =
    session.user.preferredTemperatureUnit === TemperatureUnit.CELSIUS
      ? TemperatureUnit.CELSIUS
      : TemperatureUnit.FAHRENHEIT;

  return (
    <Suspense fallback={<RecipeCompareSkeleton />}>
      <CompareContent
        slugs={slugs}
        measurementSystem={measurementSystem}
        temperatureUnit={temperatureUnit}
      />
    </Suspense>
  );
}
