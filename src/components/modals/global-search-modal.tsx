"use client";

import { useEffect, useRef } from "react";
import { GlobalSearchInput } from "@/components/modals/global-search-input";
import { GlobalSearchResults } from "@/components/modals/global-search-results";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  userId,
}: GlobalSearchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    isSearching,
    isPending,
    selectedIndex,
    setSelectedIndex,
    handleSelectResult,
    handleViewAllResults,
    clearSearch,
    hasResults,
    showResults,
    hasCompletedSearchForQuery,
  } = useGlobalSearch({ isOpen });

  // Handle Escape key
  useKeyboardShortcut({
    key: "Escape",
    callback: onClose,
  });

  // Handle Enter key - select current result or view all
  useKeyboardShortcut({
    key: "Enter",
    callback: () => {
      if (!isOpen) return;

      if (hasResults && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
        onClose();
      } else if (showResults) {
        handleViewAllResults();
        onClose();
      }
    },
  });

  // Handle Cmd/Ctrl+Enter - view all results
  useKeyboardShortcut({
    key: "Enter",
    metaKey: true,
    callback: () => {
      if (!isOpen) return;
      handleViewAllResults();
      onClose();
    },
  });

  useKeyboardShortcut({
    key: "Enter",
    ctrlKey: true,
    callback: () => {
      if (!isOpen) return;
      handleViewAllResults();
      onClose();
    },
  });

  // Handle Arrow keys for navigation
  useKeyboardShortcut({
    key: "ArrowDown",
    callback: () => {
      if (!isOpen || !hasResults) return;
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    },
  });

  useKeyboardShortcut({
    key: "ArrowUp",
    callback: () => {
      if (!isOpen || !hasResults) return;
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    },
  });

  // Reset selection when results change
  useEffect(() => {
    if (hasResults) {
      setSelectedIndex(0);
    }
  }, [hasResults, setSelectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={modalRef}
        showCloseButton={false}
        className={cn(
          "max-w-2xl p-0 gap-0 bg-background border shadow-2xl rounded-2xl overflow-hidden",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[20vh]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          "data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-[20vh]",
        )}
        onPointerDownOutside={onClose}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Global Recipe Search</DialogTitle>
          <DialogDescription>
            Search across all your recipes, ingredients, instructions, and notes
          </DialogDescription>
        </DialogHeader>

        <div className="border-b bg-background/95 backdrop-blur">
          <div className="p-4">
            <GlobalSearchInput
              value={query}
              onChange={setQuery}
              onClear={clearSearch}
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <GlobalSearchResults
            query={query}
            results={results}
            isSearching={isSearching}
            isPending={isPending}
            hasCompletedSearch={hasCompletedSearchForQuery}
            selectedIndex={selectedIndex}
            currentUserId={userId}
            onSelectResult={(result) => {
              handleSelectResult(result);
              onClose();
            }}
            onViewAllResults={() => {
              handleViewAllResults();
              onClose();
            }}
          />
        </div>

        {showResults && (
          <div className="border-t bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  <span>to select</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>↵</Kbd>
                  <span>to view all</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Kbd>esc</Kbd>
                <span>to close</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
