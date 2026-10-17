import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomeGreeting } from "@/components/layout/home-greeting";
import {
  ForgottenRecipesSection,
  HomeFeatureSection,
  HouseActivitySection,
  HouseRecipesSection,
  RecentlyOpenedSection,
} from "@/components/layout/home-sections";
import {
  HomeFeatureSkeleton,
  HomePanelSkeleton,
  RecipeTileGridSkeleton,
} from "@/components/skeletons/home-skeletons";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Home | Tastebase",
  description: "What your house is cooking",
};

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <HomeGreeting name={firstName} />

      <Suspense fallback={<HomeFeatureSkeleton />}>
        <HomeFeatureSection currentUserId={userId} />
      </Suspense>

      <Suspense fallback={<RecipeTileGridSkeleton />}>
        <HouseRecipesSection currentUserId={userId} />
      </Suspense>

      <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<HomePanelSkeleton />}>
          <RecentlyOpenedSection currentUserId={userId} />
        </Suspense>
        <Suspense fallback={<HomePanelSkeleton />}>
          <HouseActivitySection />
        </Suspense>
        <Suspense fallback={null}>
          <ForgottenRecipesSection currentUserId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
