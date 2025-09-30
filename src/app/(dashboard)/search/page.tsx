import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeSearchHeader } from "@/components/layout/recipe-search-header";
import { RecipeSearchResults } from "@/components/lists/recipe-search-results";
import { RecipeSearchHeaderSkeleton } from "@/components/skeletons/recipe-search-header-skeleton";
import { RecipeSearchResultsSkeleton } from "@/components/skeletons/recipe-search-results-skeleton";
import { auth } from "@/lib/auth/auth";
import { getSearchHistory } from "@/lib/server-actions/search-history-actions";
import { ViewMode } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search Recipes - Tastebase",
  description: "Search and discover recipes in your personal collection",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    cuisine?: string;
    difficulty?: string;
    tags?: string;
    view?: ViewMode;
    sort?: string;
  }>;
}

export default async function RecipeSearchPage({
  searchParams,
}: SearchPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;
  const searchQuery = params.q || "";
  const view = params.view || ViewMode.CARDS;
  const historyResult = await getSearchHistory(8);
  const initialHistory =
    historyResult.success && historyResult.data
      ? historyResult.data.map((entry) => ({
          query: entry.query,
          resultsCount: entry.resultsCount,
          runCount: entry.runCount,
          lastSearchedAt: entry.lastSearchedAt.toISOString(),
        }))
      : [];

  return (
    <div className="space-y-6">
      <Suspense fallback={<RecipeSearchHeaderSkeleton />}>
        <RecipeSearchHeader
          initialQuery={searchQuery}
          initialView={view}
          initialHistory={initialHistory}
        />
      </Suspense>

      <div className="px-6 pb-6">
        <Suspense fallback={<RecipeSearchResultsSkeleton view={view} />}>
          <RecipeSearchResults searchParams={params} userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
