import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardStats } from "@/components/cards/dashboard-stats";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "TasteBase - Your Recipe Collection",
  description: "Your personal recipe collection",
  keywords: ["recipes", "cooking", "collection", "tastebase"],
};

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name || "User"}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your recipe collection awaits.
          </p>

          <Suspense fallback={<DashboardStatsSkeleton />}>
            <DashboardStats />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
