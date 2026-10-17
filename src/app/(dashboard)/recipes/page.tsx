import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RecipeLibrary } from "@/components/layout/recipe-library";
import { auth } from "@/lib/auth/auth";
import { LibraryScope } from "@/lib/types";
import {
  type LibrarySearchParams,
  parseLibraryParams,
} from "@/lib/utils/library-params";

export const metadata: Metadata = {
  title: "Recipes | Tastebase",
  description: "Every recipe in your house's collection",
};

interface RecipesPageProps {
  searchParams: Promise<LibrarySearchParams>;
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const filters = parseLibraryParams(await searchParams, LibraryScope.ALL);

  return (
    <RecipeLibrary
      title="Recipes"
      filters={filters}
      basePath="/recipes"
      currentUserId={session.user.id}
    />
  );
}
