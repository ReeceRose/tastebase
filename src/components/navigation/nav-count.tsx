"use client";

import { use } from "react";
import { useNavCounts } from "@/components/navigation/nav-counts-provider";
import type { NavCountKey, NavCounts } from "@/lib/types";

interface NavCountProps {
  counts: Promise<NavCounts>;
  countKey: NavCountKey;
}

export function NavCount({ counts, countKey }: NavCountProps) {
  const { adjustments } = useNavCounts();
  const value = Math.max(0, use(counts)[countKey] + adjustments[countKey]);
  return (
    <span className="text-meta font-normal tabular opacity-65">{value}</span>
  );
}
