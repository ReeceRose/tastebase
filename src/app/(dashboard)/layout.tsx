import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  HouseholdStrip,
  HouseholdStripSkeleton,
} from "@/components/navigation/household-strip";
import { auth } from "@/lib/auth/auth";
import { getNavCounts } from "@/lib/server-actions/household-actions";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <AppShell
      user={session.user}
      counts={getNavCounts()}
      household={
        <Suspense fallback={<HouseholdStripSkeleton />}>
          <HouseholdStrip />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
