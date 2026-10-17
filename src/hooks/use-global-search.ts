"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import { performGlobalSearch } from "@/lib/server-actions/global-search-actions";
import {
  getSearchHistory,
  recordSearchQuery,
} from "@/lib/server-actions/search-history-actions";
import type { RecipeSummary } from "@/lib/types/recipe-types";

interface UseGlobalSearchProps {
  isOpen: boolean;
}

export function useGlobalSearch({ isOpen }: UseGlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastCompletedQuery, setLastCompletedQuery] = useState<string | null>(
    null,
  );
  const latestRequest = useRef(0);
  const debouncedQuery = useDebouncedValue(query, 250);
  const trimmed = query.trim();

  useEffect(() => {
    if (!isOpen) return;
    getSearchHistory(5)
      .then((result) => {
        if (result.success && result.data) {
          setRecentSearches(result.data.map((entry) => entry.query));
        }
      })
      .catch(() => undefined);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const searchFor = debouncedQuery.trim();
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    if (!searchFor) {
      setResults([]);
      setTotal(0);
      setIsSearching(false);
      setLastCompletedQuery(null);
      return;
    }

    setIsSearching(true);
    performGlobalSearch(searchFor, 8)
      .then((result) => {
        if (latestRequest.current !== requestId) return;
        setResults(result.recipes);
        setTotal(result.total);
        setSelectedIndex(0);
        setLastCompletedQuery(searchFor);
      })
      .catch(() => {
        if (latestRequest.current !== requestId) return;
        setResults([]);
        setTotal(0);
        setLastCompletedQuery(searchFor);
      })
      .finally(() => {
        if (latestRequest.current === requestId) setIsSearching(false);
      });
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (isOpen) return;
    setQuery("");
    setResults([]);
    setTotal(0);
    setSelectedIndex(0);
    setIsSearching(false);
    setLastCompletedQuery(null);
  }, [isOpen]);

  const remember = useCallback(() => {
    if (trimmed) void recordSearchQuery(trimmed, total);
  }, [trimmed, total]);

  const openRecipe = useCallback(
    (recipe: RecipeSummary) => {
      remember();
      router.push(`/recipes/${recipe.slug}`);
    },
    [remember, router],
  );

  const viewAll = useCallback(() => {
    remember();
    router.push(
      trimmed ? `/recipes?q=${encodeURIComponent(trimmed)}` : "/recipes",
    );
  }, [remember, router, trimmed]);

  return {
    query,
    setQuery,
    results,
    total,
    recentSearches,
    selectedIndex,
    setSelectedIndex,
    openRecipe,
    viewAll,
    isPending: isSearching || (trimmed.length > 0 && query !== debouncedQuery),
    hasQuery: trimmed.length > 0,
    hasCompletedSearch:
      lastCompletedQuery !== null && lastCompletedQuery === trimmed,
  };
}
