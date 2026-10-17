"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { NavCountKey, NavCounts } from "@/lib/types";

interface NavCountsContextValue {
  adjustments: NavCounts;
  adjustCount: (key: NavCountKey, delta: number) => void;
}

const NO_ADJUSTMENTS: NavCounts = { recipes: 0, favourites: 0 };

const NavCountsContext = createContext<NavCountsContextValue>({
  adjustments: NO_ADJUSTMENTS,
  adjustCount: () => {},
});

interface NavCountsProviderProps {
  counts: Promise<NavCounts>;
  children: React.ReactNode;
}

export function NavCountsProvider({
  counts,
  children,
}: NavCountsProviderProps) {
  const [base, setBase] = useState(counts);
  const [adjustments, setAdjustments] = useState(NO_ADJUSTMENTS);

  if (base !== counts) {
    setBase(counts);
    setAdjustments(NO_ADJUSTMENTS);
  }

  const adjustCount = useCallback((key: NavCountKey, delta: number) => {
    setAdjustments((current) => ({ ...current, [key]: current[key] + delta }));
  }, []);

  return (
    <NavCountsContext value={{ adjustments, adjustCount }}>
      {children}
    </NavCountsContext>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
