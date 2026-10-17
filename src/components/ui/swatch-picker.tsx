"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import type { RecipeSwatch } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  isRecipeSwatch,
  SWATCH_LABELS,
  SWATCH_ORDER,
  swatchClasses,
} from "@/lib/utils/swatches";

const AUTOMATIC = "automatic";

interface SwatchPickerProps {
  value: RecipeSwatch | null;
  automaticSwatch: RecipeSwatch;
  onValueChange: (value: RecipeSwatch | null) => void;
  label: string;
  className?: string;
}

export function SwatchPicker({
  value,
  automaticSwatch,
  onValueChange,
  label,
  className,
}: SwatchPickerProps) {
  const automatic = swatchClasses(automaticSwatch);

  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      orientation="horizontal"
      value={value ?? AUTOMATIC}
      onValueChange={(next) =>
        onValueChange(isRecipeSwatch(next) ? next : null)
      }
      className={cn("flex flex-wrap items-center gap-2.5", className)}
    >
      <RadioGroupPrimitive.Item
        value={AUTOMATIC}
        aria-label={`Automatic (${SWATCH_LABELS[automaticSwatch]})`}
        className="group relative grid size-11 place-items-center rounded-full border-2 border-dashed border-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:border-solid"
      >
        <span className={cn("size-6 rounded-full", automatic.bg)} />
        <RadioGroupPrimitive.Indicator className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {SWATCH_ORDER.map((swatch) => {
        const classes = swatchClasses(swatch);
        return (
          <RadioGroupPrimitive.Item
            key={swatch}
            value={swatch}
            aria-label={SWATCH_LABELS[swatch]}
            className={cn(
              "relative grid size-11 place-items-center rounded-full outline-none transition-transform duration-150 hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:ring-[3px] data-[state=checked]:ring-foreground data-[state=checked]:ring-offset-2 data-[state=checked]:ring-offset-background",
              classes.bg,
              classes.fg,
            )}
          >
            <RadioGroupPrimitive.Indicator>
              <Check className="size-4" strokeWidth={3} />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
