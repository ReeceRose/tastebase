import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader, PageLayout } from "@/components/layout";
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
    <div className="min-h-screen bg-background">
      <AppHeader user={session.user} />

      <main>
        <PageLayout>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome back, {session.user.name || "User"}!
            </h2>
            <p className="text-muted-foreground mt-2">
              Your recipe collection awaits.
            </p>
          </div>
        </PageLayout>
      </main>
    </div>
  );
}
