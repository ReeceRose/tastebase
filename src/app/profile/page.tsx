import { Home, KeyRound, User } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  AppHeader,
  PageHeader,
  PageLayout,
  Section,
} from "@/components/layout";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeaderSkeleton, SectionSkeleton } from "@/components/skeletons";
import { auth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Profile - TasteBase",
  description: "Manage your profile and account settings",
  keywords: ["profile", "account", "settings", "tastebase"],
};

export default async function ProfilePage() {
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
    <div className="min-h-screen bg-background">
      <AppHeader user={session.user} />

      <main>
        <PageLayout maxWidth="wide">
          <Suspense fallback={<PageHeaderSkeleton />}>
            <PageHeader
              title="Profile Settings"
              description="Manage your account information and security settings."
              breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile" }]}
              actions={[
                {
                  label: "Back to Home",
                  icon: Home,
                  href: "/",
                  variant: "outline",
                },
              ]}
              stats={[
                { label: "Member since", value: joinedDate, type: "status" },
                {
                  label: "Days active",
                  value: daysSinceJoined,
                  type: "metric",
                },
                {
                  label: "Account status",
                  value: session.user.emailVerified ? "Verified" : "Unverified",
                  type: "status",
                  status: session.user.emailVerified ? "success" : "warning",
                },
              ]}
            />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Personal Information"
              description="Update your basic profile details"
            >
              <Suspense fallback={<SectionSkeleton />}>
                <ProfileForm user={session.user} />
              </Suspense>
            </Section>

            <Section
              title="Security"
              description="Manage your account security"
            >
              <Suspense fallback={<SectionSkeleton />}>
                <PasswordForm />
              </Suspense>
            </Section>
          </div>

          <Section
            title="Account Details"
            description="View your account information"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Display Name</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.name || "User"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Account ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {session.user.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </PageLayout>
      </main>
    </div>
  );
}
