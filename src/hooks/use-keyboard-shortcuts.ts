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
