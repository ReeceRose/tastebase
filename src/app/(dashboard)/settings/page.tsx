import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AISettingsForm } from "@/components/forms/ai-settings-form";
import { DeleteAccount } from "@/components/forms/delete-account";
import { PasswordForm } from "@/components/forms/password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { SecuritySessions } from "@/components/forms/security-sessions";
import { UnitPreferencesSection } from "@/components/forms/unit-preferences-section";
import {
  HouseholdSection,
  StorageSection,
} from "@/components/layout/settings-sections";
import { TemplateList } from "@/components/lists/template-list";
import {
  resolveSettingsSection,
  SETTINGS_SECTIONS,
} from "@/components/navigation/settings-items";
import { SettingsNav } from "@/components/navigation/settings-nav";
import { SettingsSectionSkeleton } from "@/components/skeletons/settings-section-skeleton";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { auth } from "@/lib/auth/auth";
import { AvatarSize, SettingsSection } from "@/lib/types";

export const metadata: Metadata = {
  title: "Settings | Tastebase",
  description: "Your account, your household and how Tastebase works for you",
};

interface SettingsPageProps {
  searchParams: Promise<{ section?: string; tab?: string }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;
  const section = resolveSettingsSection(
    params.section ?? null,
    params.tab ?? null,
  );
  const item =
    SETTINGS_SECTIONS.find((entry) => entry.id === section) ??
    SETTINGS_SECTIONS[0];
  const user = { ...session.user, image: session.user.image ?? null };

  return (
    <div className="space-y-6">
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        Settings
      </h1>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <SettingsNav active={section} />
        <section
          aria-labelledby="settings-section-title"
          className="min-w-0 max-w-3xl space-y-5"
        >
          <div>
            <h2 id="settings-section-title" className="text-heading">
              {item.label}
            </h2>
            <p className="mt-1 text-muted-foreground">{item.description}</p>
          </div>

          {section === SettingsSection.PROFILE && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-tile bg-card p-5">
                <MemberAvatar
                  userId={user.id}
                  name={user.name || user.email}
                  size={AvatarSize.LG}
                  decorative
                />
                <p className="text-muted-foreground">
                  This is your colour. It marks your recipes, notes and activity
                  so the house can tell them apart.
                </p>
              </div>
              <ProfileForm user={user} />
            </div>
          )}

          {section === SettingsSection.HOUSEHOLD && (
            <Suspense fallback={<SettingsSectionSkeleton />}>
              <HouseholdSection currentUserId={user.id} />
            </Suspense>
          )}

          {section === SettingsSection.UNITS && (
            <UnitPreferencesSection user={user} />
          )}

          {section === SettingsSection.IMPORT && <AISettingsForm />}

          {section === SettingsSection.TEMPLATES && <TemplateList />}

          {section === SettingsSection.STORAGE && (
            <Suspense fallback={<SettingsSectionSkeleton />}>
              <StorageSection />
            </Suspense>
          )}

          {section === SettingsSection.SECURITY && (
            <div className="space-y-5">
              <PasswordForm />
              <SecuritySessions />
              <DeleteAccount />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
