"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Controller, useFormContext } from "react-hook-form";
import { EditorSectionCard } from "@/components/forms/recipe-editor/editor-field";
import { EditorSection } from "@/lib/types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";

const SHARED = "shared";
const PRIVATE = "private";

const OPTIONS = [
  {
    value: SHARED,
    title: "Shared with the house",
    description:
      "Everyone on this Tastebase can see it, cook it and leave notes.",
  },
  {
    value: PRIVATE,
    title: "Only visible to me",
    description: "Stays in your collection until you decide to share it.",
  },
];

export function EditorSharing() {
  const { control } = useFormContext<RecipeEditorValues>();

  return (
    <EditorSectionCard id={EditorSection.SHARING} title="Who can see it">
      <Controller
        control={control}
        name="isPublic"
        render={({ field }) => (
          <RadioGroupPrimitive.Root
            aria-label="Who can see this recipe"
            value={field.value ? SHARED : PRIVATE}
            onValueChange={(value) => field.onChange(value === SHARED)}
            className="grid gap-3 sm:grid-cols-2"
          >
            {OPTIONS.map((option) => (
              <RadioGroupPrimitive.Item
                key={option.value}
                value={option.value}
                className="group flex items-start gap-3 rounded-control border-2 border-input bg-card p-4 text-left outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring data-[state=checked]:border-foreground"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-foreground">
                  <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-foreground" />
                </span>
                <span>
                  <span className="block font-extrabold">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
        )}
      />
    </EditorSectionCard>
  );
}
