import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeCreationWorkflow } from "@/components/forms/recipe-creation-workflow";
import { RecipeFormSkeleton } from "@/components/skeletons/recipe-form-skeleton";
import { auth } from "@/lib/auth/auth";

export const metadata = {
  title: "Create Recipe | Tastebase",
  description: "Add a new recipe to your collection",
};

export default async function NewRecipePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New Recipe</h1>
          <p className="text-muted-foreground">
            Import from a website or image, or create your recipe manually
          </p>
        </div>

        <Suspense fallback={<RecipeFormSkeleton />}>
          <RecipeCreationWorkflow userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
