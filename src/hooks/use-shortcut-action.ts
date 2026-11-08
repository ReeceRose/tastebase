"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { KeyboardShortcutAction } from "@/lib/types";

export type ShortcutHandlers = Map<KeyboardShortcutAction, () => void>;

export const ShortcutHandlersContext = createContext<ShortcutHandlers>(
  new Map(),
);

export function useShortcutAction(
  action: KeyboardShortcutAction,
  handler: () => void,
) {
  const handlers = useContext(ShortcutHandlersContext);
  const latest = useRef(handler);

  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    const run = () => latest.current();
    handlers.set(action, run);
    return () => {
      if (handlers.get(action) === run) handlers.delete(action);
    };
  }, [action, handlers]);
}
