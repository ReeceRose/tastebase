"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VisibilityRadioGroup } from "@/components/forms/visibility-radio-group";
import { updateDefaultRecipeIsPublic } from "@/lib/server-actions/sharing-preference-actions";

interface SharingPreferenceFormProps {
  initialIsPublic: boolean;
}

export function SharingPreferenceForm({
  initialIsPublic,
}: SharingPreferenceFormProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  const save = async (next: boolean) => {
    const previous = isPublic;
    setIsPublic(next);
    const result = await updateDefaultRecipeIsPublic(next).catch(() => null);
    if (result?.success) {
      toast.success(
        next
          ? "New recipes will start shared with the house"
          : "New recipes will start visible only to you",
      );
      return;
    }
    setIsPublic(previous);
    toast.error(result?.error ?? "That didn't save. Please try again.");
  };

  return (
    <VisibilityRadioGroup
      label="Who can see new recipes"
      isPublic={isPublic}
      onChange={save}
    />
  );
}
