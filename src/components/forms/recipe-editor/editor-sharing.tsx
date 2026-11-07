"use client";

import { Controller, useFormContext } from "react-hook-form";
import { EditorSectionCard } from "@/components/forms/recipe-editor/editor-field";
import { VisibilityRadioGroup } from "@/components/forms/visibility-radio-group";
import { EditorSection } from "@/lib/types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";

export function EditorSharing() {
  const { control } = useFormContext<RecipeEditorValues>();

  return (
    <EditorSectionCard id={EditorSection.SHARING} title="Who can see it">
      <Controller
        control={control}
        name="isPublic"
        render={({ field }) => (
          <VisibilityRadioGroup
            label="Who can see this recipe"
            isPublic={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </EditorSectionCard>
  );
}
