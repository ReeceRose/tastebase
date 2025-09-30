import { Home } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsTabs } from "@/components/forms/settings-tabs";
import { PageHeader } from "@/components/layout";
import { PageHeaderSkeleton } from "@/components/skeletons";
import { auth } from "@/lib/auth/auth";
import { ButtonVariant, StatType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Settings - TasteBase",
  description: "Customize your TasteBase experience and manage your account",
  keywords: ["settings", "profile", "account", "preferences", "tastebase"],
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const joinedDate = new Date(session.user.createdAt).toLocaleDateString();
  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(session.user.createdAt).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Suspense fallback={<PageHeaderSkeleton />}>
        <PageHeader
          title="Settings"
          description="Customize your TasteBase experience and manage your account"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
          actions={[
            {
              label: "Back to Home",
              icon: Home,
              href: "/",
              variant: ButtonVariant.OUTLINE,
            },
          ]}
          stats={[
            { label: "Member since", value: joinedDate, type: StatType.STATUS },
            {
              label: "Days active",
              value: daysSinceJoined,
              type: StatType.METRIC,
            },
          ]}
        />
      </Suspense>

      <SettingsTabs
        user={{ ...session.user, image: session.user.image ?? null }}
      />
    </div>
  );
}
