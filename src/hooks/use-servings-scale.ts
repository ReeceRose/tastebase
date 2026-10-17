"use client";

import { useState } from "react";
import { servingsFactor } from "@/lib/utils/ingredient-scaling";

const MAX_SERVINGS = 48;

export function useServingsScale(original: number | null) {
  const base = original && original > 0 ? original : null;
  const [servings, setServings] = useState<number>(base ?? 1);

  const step = base && base >= 8 ? 2 : 1;

  return {
    canScale: base !== null,
    servings,
    original: base,
    factor: servingsFactor(base, servings),
    isScaled: base !== null && servings !== base,
    increase: () =>
      setServings((value) => Math.min(MAX_SERVINGS, value + step)),
    decrease: () => setServings((value) => Math.max(1, value - step)),
    reset: () => setServings(base ?? 1),
  };
}
