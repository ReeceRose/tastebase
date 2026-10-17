"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { SegmentedOption } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  label,
  className,
}: SegmentedControlProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      aria-label={label}
      orientation="horizontal"
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "inline-flex h-11 items-center gap-1 rounded-full bg-muted p-1",
        className,
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="h-full rounded-full px-4 text-sm font-extrabold whitespace-nowrap text-foreground transition-colors duration-150 outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
