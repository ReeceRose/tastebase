import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RecipeLibrary } from "@/components/layout/recipe-library";
import { ListActionsMenu } from "@/components/modals/list-actions-menu";
import { auth } from "@/lib/auth/auth";
import { getRecipeList } from "@/lib/server-actions/recipe-list-actions";
import { LibraryScope } from "@/lib/types";
import {
  type LibrarySearchParams,
  parseLibraryParams,
} from "@/lib/utils/library-params";

interface ListPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<LibrarySearchParams>;
}

export default async function ListPage({
  params,
  searchParams,
}: ListPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;
  const list = await getRecipeList(id);
  if (!list) notFound();

  const filters = {
    ...parseLibraryParams(await searchParams, LibraryScope.LIST),
    listId: list.id,
  };

  return (
    <RecipeLibrary
      title={list.name}
      actions={<ListActionsMenu list={list} />}
      filters={filters}
      basePath={`/recipes/lists/${list.id}`}
      currentUserId={session.user.id}
    />
  );
}

export async function generateMetadata({ params }: ListPageProps) {
  const { id } = await params;
  const list = await getRecipeList(id);
  return { title: list ? `${list.name} | Tastebase` : "List not found" };
}
