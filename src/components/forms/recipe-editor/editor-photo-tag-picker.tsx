"use client";

import { useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
const STEP_TOOLTIP_CLASS = "max-w-[min(20rem,calc(100vw-2rem))] text-pretty";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const value = valueFor(tag);
  const taggedStep =
    tag?.role === PhotoRole.STEP
      ? (steps.find((step) => step.key === tag.stepKey) ?? null)
      : null;
  const hasStep = !tag || tag.role !== PhotoRole.STEP || taggedStep !== null;

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
    <Select
      open={menuOpen}
      onOpenChange={setMenuOpen}
      value={hasStep ? value : NO_TAG}
      onValueChange={choose}
    >
      <Tooltip
        open={taggedStep !== null && triggerHovered && !menuOpen}
        disableHoverableContent
      >
        <TooltipTrigger asChild>
          <SelectTrigger
            size="sm"
            aria-label={`What photo ${photoNumber} shows`}
            className="w-full min-w-0 text-meta"
            onPointerEnter={() => setTriggerHovered(true)}
            onPointerLeave={() => setTriggerHovered(false)}
          >
            <SelectValue />
          </SelectTrigger>
        </TooltipTrigger>
        {taggedStep && (
          <TooltipContent sideOffset={8} className={STEP_TOOLTIP_CLASS}>
            {taggedStep.text}
          </TooltipContent>
        )}
      </Tooltip>
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
                <Tooltip key={step.key} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <SelectItem value={`${STEP_PREFIX}${step.key}`}>
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
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    collisionPadding={16}
                    className={STEP_TOOLTIP_CLASS}
                    onEscapeKeyDown={() => setMenuOpen(false)}
                  >
                    {step.text}
                  </TooltipContent>
                </Tooltip>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
