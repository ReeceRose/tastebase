"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getNavCounts } from "@/lib/server-actions/household-actions";
import type { NavCountKey, NavCounts } from "@/lib/types";

interface NavCountsContextValue {
  latest: NavCounts | null;
  adjustments: NavCounts;
  adjustCount: (key: NavCountKey, delta: number) => void;
}

const NO_ADJUSTMENTS: NavCounts = { recipes: 0, favourites: 0 };

const NavCountsContext = createContext<NavCountsContextValue>({
  latest: null,
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
  const pathname = usePathname();
  const [base, setBase] = useState(counts);
  const [latest, setLatest] = useState<NavCounts | null>(null);
  const [adjustments, setAdjustments] = useState(NO_ADJUSTMENTS);
  const loadedPath = useRef(pathname);

  if (base !== counts) {
    setBase(counts);
    setLatest(null);
    setAdjustments(NO_ADJUSTMENTS);
  }

  useEffect(() => {
    if (loadedPath.current === pathname) return;
    loadedPath.current = pathname;
    let current = true;
    getNavCounts().then((fresh) => {
      if (!current) return;
      setLatest(fresh);
      setAdjustments(NO_ADJUSTMENTS);
    });
    return () => {
      current = false;
    };
  }, [pathname]);

  const adjustCount = useCallback((key: NavCountKey, delta: number) => {
    setAdjustments((current) => ({ ...current, [key]: current[key] + delta }));
  }, []);

  return (
    <NavCountsContext value={{ latest, adjustments, adjustCount }}>
      {children}
    </NavCountsContext>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
