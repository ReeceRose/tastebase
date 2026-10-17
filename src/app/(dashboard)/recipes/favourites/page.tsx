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
  title: "Favourites | Tastebase",
  description: "The recipes you come back to",
};

interface FavouritesPageProps {
  searchParams: Promise<LibrarySearchParams>;
}

export default async function FavouritesPage({
  searchParams,
}: FavouritesPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const filters = parseLibraryParams(
    await searchParams,
    LibraryScope.FAVOURITES,
  );

  return (
    <RecipeLibrary
      title="Favourites"
      filters={filters}
      basePath="/recipes/favourites"
      currentUserId={session.user.id}
    />
  );
}
