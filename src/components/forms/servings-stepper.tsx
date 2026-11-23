"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServingsStepperProps {
  servings: number;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
}

const STEP_BUTTON =
  "grid size-10 place-items-center rounded-full bg-card sm:size-8 outline-none disabled:opacity-40 focus-visible:ring-[3px] focus-visible:ring-ring";

export function ServingsStepper({
  servings,
  onDecrease,
  onIncrease,
  className,
}: ServingsStepperProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-background p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={servings <= 1}
        aria-label="Fewer servings"
        className={STEP_BUTTON}
      >
        <Minus className="size-4" strokeWidth={2.5} />
      </button>
      <span
        aria-live="polite"
        className="min-w-16 text-center text-sm font-extrabold tabular"
      >
        Serves {servings}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="More servings"
        className={STEP_BUTTON}
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
