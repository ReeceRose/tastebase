"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import { performGlobalSearch } from "@/lib/server-actions/global-search-actions";
import type { RecipeWithDetails } from "@/lib/types/recipe-types";

interface UseGlobalSearchProps {
  isOpen: boolean;
}

interface UseGlobalSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: RecipeWithDetails[];
  isSearching: boolean;
  isPending: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleSelectResult: (result: RecipeWithDetails) => void;
  handleViewAllResults: () => void;
  clearSearch: () => void;
  hasResults: boolean;
  showResults: boolean;
  hasCompletedSearchForQuery: boolean;
}

export function useGlobalSearch({
  isOpen,
}: UseGlobalSearchProps): UseGlobalSearchReturn {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeWithDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const latestRequestIdRef = useRef(0);
  const [lastCompletedQuery, setLastCompletedQuery] = useState<string | null>(
    null,
  );

  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmedCurrentQuery = query.trim();
  const isDebouncing =
    trimmedCurrentQuery.length > 0 && query !== debouncedQuery;

  const performSearch = useCallback(async (searchQuery: string) => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      setLastCompletedQuery(null);
      return;
    }

    setIsSearching(true);
    try {
      const searchResult = await performGlobalSearch(trimmedQuery, 8);

      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      if (searchResult.success) {
        setResults(searchResult.recipes);
        setSelectedIndex(0);
        setLastCompletedQuery(trimmedQuery);
      } else {
        console.error("Global search error:", searchResult.error);
        setResults([]);
        setLastCompletedQuery(trimmedQuery);
      }
    } catch (error) {
      if (latestRequestIdRef.current !== requestId) {
        return;
      }
      console.error("Global search error:", error);
      setResults([]);
      setLastCompletedQuery(trimmedQuery);
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, performSearch]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setIsSearching(false);
      setLastCompletedQuery(null);
    }
  }, [isOpen]);

  const handleSelectResult = useCallback(
    (result: RecipeWithDetails) => {
      const slug = result.slug ?? result.id;
      router.push(`/recipes/${slug}`);
    },
    [router],
  );

  const handleViewAllResults = useCallback(() => {
    if (query.trim()) {
      router.push(`/recipes?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/recipes");
    }
  }, [router, query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    setLastCompletedQuery(null);
  }, []);

  const hasResults = results.length > 0;
  const showResults = trimmedCurrentQuery.length > 0;
  const isPendingSearch = isSearching || isDebouncing;
  const hasCompletedSearchForQuery =
    lastCompletedQuery !== null && lastCompletedQuery === trimmedCurrentQuery;

  return {
    query,
    setQuery,
    results,
    isSearching,
    isPending: isPendingSearch,
    selectedIndex,
    setSelectedIndex,
    handleSelectResult,
    handleViewAllResults,
    clearSearch,
    hasResults,
    showResults,
    hasCompletedSearchForQuery,
  };
}
