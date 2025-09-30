import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecipeDiscoveryChat } from "@/components/chat/recipe-discovery-chat";
import { RecipeDiscoveryChatSkeleton } from "@/components/skeletons/recipe-discovery-chat-skeleton";
import { auth } from "@/lib/auth/auth";

export const metadata = {
  title: "Recipe Discovery - AI Chat | Tastebase",
  description: "Discover new recipes through natural conversation with AI",
};

export default async function RecipeDiscoveryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/sign-in");

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<RecipeDiscoveryChatSkeleton />}>
          <RecipeDiscoveryChat userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
