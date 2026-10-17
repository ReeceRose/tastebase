import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RecipeCreationWorkflow } from "@/components/forms/recipe-creation-workflow";
import { auth } from "@/lib/auth/auth";
import { RETURN_PATH_PARAM } from "@/lib/utils/return-path";
import { findSharedLink } from "@/lib/utils/shared-link";

export const metadata = {
  title: "Add a recipe | Tastebase",
  description: "Import a recipe from a link, text or photo, or write your own",
};

interface NewRecipePageProps {
  searchParams: Promise<{
    from?: string;
    url?: string;
    text?: string;
    title?: string;
  }>;
}

export default async function NewRecipePage({
  searchParams,
}: NewRecipePageProps) {
  const [session, params] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    searchParams,
  ]);
  const { from } = params;
  if (!session?.user) {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ).toString();
    const returnTo = query ? `/recipes/new?${query}` : "/recipes/new";
    redirect(
      `/auth/sign-in?${RETURN_PATH_PARAM}=${encodeURIComponent(returnTo)}`,
    );
  }

  return (
    <RecipeCreationWorkflow
      userId={session.user.id}
      fromExtension={from === "extension"}
      sharedUrl={findSharedLink({
        url: params.url ?? null,
        text: params.text ?? null,
        title: params.title ?? null,
      })}
    />
  );
}
