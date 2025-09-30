"use client";

import { Bot, Database, Settings, Shield, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { StorageStatsDisplay } from "@/components/cards/storage-stats-display";
import { AISettingsForm } from "@/components/forms/ai-settings-form";
import { PasswordForm } from "@/components/forms/password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import { SecuritySettingsForm } from "@/components/forms/security-settings-form";
import { UnitPreferencesForm } from "@/components/forms/unit-preferences-form";
import { Section } from "@/components/layout";
import { SectionSkeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User as UserType } from "@/db/schema.base";
import { updateUserPreferences } from "@/lib/auth/auth-actions";

interface SettingsTabsProps {
  user: UserType;
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.replace(url.pathname + url.search);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI</span>
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Data</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Personal Information"
            description="Update your basic profile details"
          >
            <Suspense fallback={<SectionSkeleton />}>
              <ProfileForm user={user} />
            </Suspense>
          </Section>

          <Section
            title="Account Details"
            description="View your account information"
          >
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Display Name</p>
                    <p className="text-sm text-muted-foreground">
                      {user.name || "User"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
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
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </TabsContent>

      <TabsContent value="ai" className="space-y-6">
        <Section
          title="AI Configuration"
          description="Configure your AI providers and settings for recipe parsing and assistance"
        >
          <Suspense fallback={<SectionSkeleton />}>
            <AISettingsForm />
          </Suspense>
        </Section>
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        <Section
          title="Storage Information"
          description="Monitor your recipe data and storage usage"
        >
          <Suspense fallback={<SectionSkeleton />}>
            <StorageStatsDisplay />
          </Suspense>
        </Section>
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Password Security"
            description="Change your account password"
          >
            <Suspense fallback={<SectionSkeleton />}>
              <PasswordForm />
            </Suspense>
          </Section>

          <Section
            title="Account Security"
            description="Monitor sessions and security settings"
          >
            <Suspense fallback={<SectionSkeleton />}>
              <SecuritySettingsForm />
            </Suspense>
          </Section>
        </div>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-6">
        <Section
          title="Unit Preferences"
          description="Customize your preferred units for displaying recipes"
        >
          <Suspense fallback={<SectionSkeleton />}>
            <UnitPreferencesForm
              user={user}
              onSave={async (preferences) => {
                const formData = new FormData();
                formData.append(
                  "preferredTemperatureUnit",
                  preferences.preferredTemperatureUnit,
                );
                formData.append(
                  "preferredWeightUnit",
                  preferences.preferredWeightUnit,
                );
                formData.append(
                  "preferredVolumeUnit",
                  preferences.preferredVolumeUnit,
                );
                const result = await updateUserPreferences(formData);
                return result.success
                  ? { success: true }
                  : { success: false, error: result.error };
              }}
            />
          </Suspense>
        </Section>
      </TabsContent>
    </Tabs>
  );
}
