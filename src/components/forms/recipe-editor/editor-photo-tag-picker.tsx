"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { stepNumbersLabel } from "@/lib/utils/photo-tags";

interface EditorPhotoTagPickerProps {
  photo: string;
  tags: EditorPhotoTag[];
  steps: EditorStepOption[];
  photoNumber: number;
  onChange: (tags: EditorPhotoTag[]) => void;
}

const STEP_TOOLTIP_CLASS = "max-w-[min(20rem,calc(100vw-2rem))] text-pretty";

export function EditorPhotoTagPicker({
  photo,
  tags,
  steps,
  photoNumber,
  onChange,
}: EditorPhotoTagPickerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const taggedSteps = steps.filter((step) =>
    tags.some((tag) => tag.role === PhotoRole.STEP && tag.stepKey === step.key),
  );
  const role = tags.find((tag) => tag.role !== PhotoRole.STEP)?.role ?? null;
  const onlyStep = taggedSteps.length === 1 ? taggedSteps[0] : null;

  const chooseRole = (next: PhotoRole | null) =>
    onChange(next ? [{ photo, role: next, stepKey: null }] : []);

  const toggleStep = (stepKey: string) => {
    const keys = taggedSteps.map((step) => step.key);
    const nextKeys = keys.includes(stepKey)
      ? keys.filter((key) => key !== stepKey)
      : [...keys, stepKey];
    onChange(
      nextKeys.map((key) => ({ photo, role: PhotoRole.STEP, stepKey: key })),
    );
  };

  const roleLabel =
    role === PhotoRole.INGREDIENTS
      ? "Ingredients"
      : role === PhotoRole.FINISHED
        ? "Finished dish"
        : "Not tagged";

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip
        open={taggedSteps.length > 0 && triggerHovered && !menuOpen}
        disableHoverableContent
      >
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={`What photo ${photoNumber} shows`}
            className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-control border-2 border-input bg-card px-4 text-meta whitespace-nowrap transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25"
            onPointerEnter={() => setTriggerHovered(true)}
            onPointerLeave={() => setTriggerHovered(false)}
          >
            <span className="truncate">
              {taggedSteps.length === 0 && roleLabel}
              {taggedSteps.length > 0 &&
                stepNumbersLabel(taggedSteps.map((step) => step.number))}
              {onlyStep?.preview && (
                <span className="text-muted-foreground">
                  {" "}
                  · {onlyStep.preview}
                </span>
              )}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {taggedSteps.length > 0 && (
          <TooltipContent sideOffset={8} className={STEP_TOOLTIP_CLASS}>
            {onlyStep ? (
              onlyStep.text
            ) : (
              <ul className="space-y-1">
                {taggedSteps.map((step) => (
                  <li key={step.key}>
                    Step {step.number} · {step.preview}
                  </li>
                ))}
              </ul>
            )}
          </TooltipContent>
        )}
      </Tooltip>
      <DropdownMenuContent className="max-w-[min(24rem,calc(100vw-2rem))]">
        <DropdownMenuCheckboxItem
          checked={role === null && taggedSteps.length === 0}
          onSelect={() => chooseRole(null)}
        >
          Not tagged
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={role === PhotoRole.INGREDIENTS}
          onSelect={() => chooseRole(PhotoRole.INGREDIENTS)}
        >
          Ingredients
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={role === PhotoRole.FINISHED}
          onSelect={() => chooseRole(PhotoRole.FINISHED)}
        >
          Finished dish
        </DropdownMenuCheckboxItem>
        {steps.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-caption text-muted-foreground">
                Method
              </DropdownMenuLabel>
              {steps.map((step) => (
                <Tooltip key={step.key} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <DropdownMenuCheckboxItem
                      checked={taggedSteps.includes(step)}
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleStep(step.key);
                      }}
                    >
                      <span className="truncate">
                        Step {step.number}
                        {step.preview && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {step.preview}
                          </span>
                        )}
                      </span>
                    </DropdownMenuCheckboxItem>
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
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
