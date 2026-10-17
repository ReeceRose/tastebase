"use client";

import { use } from "react";
import type { NavCountKey, NavCounts } from "@/lib/types";

interface NavCountProps {
  counts: Promise<NavCounts>;
  countKey: NavCountKey;
}

export function NavCount({ counts, countKey }: NavCountProps) {
  const value = use(counts)[countKey];
  return (
    <span className="text-meta font-normal tabular opacity-65">{value}</span>
  );
}
