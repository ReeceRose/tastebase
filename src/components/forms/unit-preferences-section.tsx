"use client";

import { UnitPreferencesForm } from "@/components/forms/unit-preferences-form";
import { updateUserPreferences } from "@/lib/auth/auth-actions";
import type { UserPreferencesSubset } from "@/lib/types";

interface UnitPreferencesSectionProps {
  user: UserPreferencesSubset;
}

export function UnitPreferencesSection({ user }: UnitPreferencesSectionProps) {
  return (
    <UnitPreferencesForm
      user={user}
      onSave={async (preferences) => {
        const formData = new FormData();
        formData.append(
          "preferredTemperatureUnit",
          preferences.preferredTemperatureUnit,
        );
        formData.append("preferredWeightUnit", preferences.preferredWeightUnit);
        formData.append("preferredVolumeUnit", preferences.preferredVolumeUnit);
        const result = await updateUserPreferences(formData);
        return result.success
          ? { success: true }
          : { success: false, error: result.error };
      }}
    />
  );
}
