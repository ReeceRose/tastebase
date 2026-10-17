import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecentlyOpenedList } from "@/components/lists/recently-opened-list";
import { RecipeLibraryResultsSkeleton } from "@/components/skeletons/recipe-library-skeletons";
import { auth } from "@/lib/auth/auth";
import { ViewMode } from "@/lib/types";

export const metadata: Metadata = {
  title: "Recent | Tastebase",
  description: "Recipes you've opened lately",
};

export default async function RecentPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        Recent
      </h1>
      <Suspense
        fallback={<RecipeLibraryResultsSkeleton view={ViewMode.LIST} />}
      >
        <RecentlyOpenedList currentUserId={session.user.id} />
      </Suspense>
    </div>
  );
}
