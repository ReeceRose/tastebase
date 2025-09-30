"use client";

import { useEffect } from "react";

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function useKeyboardShortcut(config: KeyboardShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        key,
        ctrlKey = false,
        metaKey = false,
        shiftKey = false,
        altKey = false,
        callback,
        preventDefault = true,
      } = config;

      const isMatch =
        event.key === key &&
        event.ctrlKey === ctrlKey &&
        event.metaKey === metaKey &&
        event.shiftKey === shiftKey &&
        event.altKey === altKey;

      if (isMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useKeyboardShortcut({
    key: "k",
    ctrlKey: true,
    callback: onOpen,
  });

  useKeyboardShortcut({
    key: "k",
    metaKey: true,
    callback: onOpen,
  });
}

export function useKeyboardShortcuts(_config: {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
}) {
  const defaultShortcuts: Record<string, KeyboardShortcut[]> = {
    Navigation: [
      {
        key: "/",
        description: "Focus search",
        category: "Navigation",
      },
      {
        key: "k",
        ctrlKey: true,
        description: "Global search",
        category: "Navigation",
      },
      {
        key: "k",
        metaKey: true,
        description: "Global search (Mac)",
        category: "Navigation",
      },
    ],
    "Recipe Management": [
      {
        key: "n",
        ctrlKey: true,
        description: "New recipe",
        category: "Recipe Management",
      },
      {
        key: "e",
        ctrlKey: true,
        description: "Edit recipe",
        category: "Recipe Management",
      },
    ],
    General: [
      {
        key: "Escape",
        description: "Close dialog/modal",
        category: "General",
      },
      {
        key: "?",
        description: "Show keyboard shortcuts",
        category: "General",
      },
    ],
  };

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.metaKey) parts.push("⌘");
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");
    parts.push(shortcut.key === " " ? "Space" : shortcut.key);
    return parts.join(" + ");
  };

  const getShortcutsByCategory = () => {
    return defaultShortcuts;
  };

  return {
    formatShortcut,
    getShortcutsByCategory,
  };
}
