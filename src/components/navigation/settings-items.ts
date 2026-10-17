import { SettingsSection } from "@/lib/types";

export interface SettingsItem {
  id: SettingsSection;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsItem[] = [
  {
    id: SettingsSection.PROFILE,
    label: "Profile",
    description: "Your name and email.",
  },
  {
    id: SettingsSection.HOUSEHOLD,
    label: "Household",
    description: "Who shares this Tastebase.",
  },
  {
    id: SettingsSection.UNITS,
    label: "Units",
    description: "How amounts and temperatures show on recipes.",
  },
  {
    id: SettingsSection.IMPORT,
    label: "Import and AI",
    description:
      "Imports work without AI. Add a provider if you want help with messy text and photos.",
  },
  {
    id: SettingsSection.SAVING,
    label: "Saving recipes",
    description:
      "Save recipes from other sites in your browser or straight from your phone.",
  },
  {
    id: SettingsSection.TEMPLATES,
    label: "Note templates",
    description: "Starting points for the notes you leave on recipes.",
  },
  {
    id: SettingsSection.STORAGE,
    label: "Storage",
    description: "How much space recipes and photos use on this server.",
  },
  {
    id: SettingsSection.SECURITY,
    label: "Password and sessions",
    description: "Change your password and see where you're signed in.",
  },
];

const LEGACY_TABS: Record<string, SettingsSection> = {
  profile: SettingsSection.PROFILE,
  ai: SettingsSection.IMPORT,
  data: SettingsSection.STORAGE,
  preferences: SettingsSection.UNITS,
  security: SettingsSection.SECURITY,
};

export function resolveSettingsSection(
  section: string | null,
  legacyTab: string | null,
): SettingsSection {
  const match = SETTINGS_SECTIONS.find((item) => item.id === section);
  if (match) return match.id;
  if (legacyTab && LEGACY_TABS[legacyTab]) return LEGACY_TABS[legacyTab];
  return SettingsSection.PROFILE;
}
