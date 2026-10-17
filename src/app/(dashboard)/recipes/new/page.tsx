import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RecipeCreationWorkflow } from "@/components/forms/recipe-creation-workflow";
import { auth } from "@/lib/auth/auth";

export const metadata = {
  title: "Add a recipe | Tastebase",
  description: "Import a recipe from a link, text or photo, or write your own",
};

export default async function NewRecipePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return <RecipeCreationWorkflow userId={session.user.id} />;
}
