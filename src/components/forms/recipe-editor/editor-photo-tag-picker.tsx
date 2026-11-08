"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoRole } from "@/lib/types";
import type {
  EditorPhotoTag,
  EditorStepOption,
} from "@/lib/types/recipe-types";
import { toPhotoRole } from "@/lib/utils/photo-tags";

interface EditorPhotoTagPickerProps {
  photo: string;
  tag: EditorPhotoTag | null;
  steps: EditorStepOption[];
  photoNumber: number;
  onChange: (tag: EditorPhotoTag | null) => void;
}

const NO_TAG = "none";
const STEP_PREFIX = "step:";

function valueFor(tag: EditorPhotoTag | null): string {
  if (!tag) return NO_TAG;
  if (tag.role === PhotoRole.STEP) return `${STEP_PREFIX}${tag.stepKey}`;
  return tag.role;
}

export function EditorPhotoTagPicker({
  photo,
  tag,
  steps,
  photoNumber,
  onChange,
}: EditorPhotoTagPickerProps) {
  const value = valueFor(tag);
  const hasStep =
    !tag ||
    tag.role !== PhotoRole.STEP ||
    steps.some((step) => step.key === tag.stepKey);

  const choose = (next: string) => {
    if (next === NO_TAG) {
      onChange(null);
    } else if (next.startsWith(STEP_PREFIX)) {
      onChange({
        photo,
        role: PhotoRole.STEP,
        stepKey: next.slice(STEP_PREFIX.length),
      });
    } else {
      const role = toPhotoRole(next);
      if (role) onChange({ photo, role, stepKey: null });
    }
  };

  return (
    <Select value={hasStep ? value : NO_TAG} onValueChange={choose}>
      <SelectTrigger
        size="sm"
        aria-label={`What photo ${photoNumber} shows`}
        className="w-full min-w-0 text-meta"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-w-[min(24rem,calc(100vw-2rem))]">
        <SelectItem value={NO_TAG}>Not tagged</SelectItem>
        <SelectItem value={PhotoRole.INGREDIENTS}>Ingredients</SelectItem>
        <SelectItem value={PhotoRole.FINISHED}>Finished dish</SelectItem>
        {steps.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Method</SelectLabel>
              {steps.map((step) => (
                <SelectItem key={step.key} value={`${STEP_PREFIX}${step.key}`}>
                  <span className="truncate">
                    Step {step.number}
                    {step.preview && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {step.preview}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
