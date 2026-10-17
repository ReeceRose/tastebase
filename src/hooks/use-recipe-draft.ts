"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RecipeDraftSnapshot,
  RecipeEditorValues,
} from "@/lib/types/recipe-types";

const SAVE_DELAY_MS = 1500;

function readDraft(key: string): RecipeDraftSnapshot | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RecipeDraftSnapshot) : null;
  } catch {
    return null;
  }
}

export function useRecipeDraft(
  key: string,
  values: RecipeEditorValues,
  enabled: boolean,
) {
  const [savedDraft, setSavedDraft] = useState<RecipeDraftSnapshot | null>(
    null,
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);
  const serialized = JSON.stringify(values);

  useEffect(() => {
    setSavedDraft(readDraft(key));
  }, [key]);

  useEffect(() => {
    if (!enabled || savedDraft) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        const savedAt = new Date();
        window.localStorage.setItem(
          key,
          JSON.stringify({
            values: JSON.parse(serialized),
            savedAt: savedAt.toISOString(),
          }),
        );
        setLastSavedAt(savedAt);
      } catch {
        return;
      }
    }, SAVE_DELAY_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, serialized, enabled, savedDraft]);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      return;
    }
    setSavedDraft(null);
  }, [key]);

  const dismiss = useCallback(() => setSavedDraft(null), []);

  return { savedDraft, lastSavedAt, clear, dismiss };
}
