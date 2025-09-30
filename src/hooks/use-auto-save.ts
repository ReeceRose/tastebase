"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AutoSaveOptions<T = unknown> {
  delay?: number;
  enabled?: boolean;
  onSave: (data: T) => Promise<{ success: boolean; error?: string }>;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  saveCount: number;
  error?: string;
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions<T>) {
  const { delay = 2000, enabled = true, onSave, onError, onSuccess } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    hasUnsavedChanges: false,
    saveCount: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);
  const savePromiseRef = useRef<Promise<{
    success: boolean;
    error?: string;
  }> | null>(null);

  const performSave = useCallback(
    async (dataToSave: T) => {
      if (savePromiseRef.current) {
        await savePromiseRef.current;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: undefined }));

      savePromiseRef.current = onSave(dataToSave);

      try {
        const result = await savePromiseRef.current;

        if (result.success) {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            hasUnsavedChanges: false,
            lastSaved: new Date(),
            saveCount: prev.saveCount + 1,
            error: undefined,
          }));
          onSuccess?.();
        } else {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            error: result.error || "Save failed",
          }));
          onError?.(result.error || "Save failed");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Save failed";
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
      } finally {
        savePromiseRef.current = null;
      }
    },
    [onSave, onError, onSuccess],
  );

  const debouncedSave = useCallback(
    (dataToSave: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        performSave(dataToSave);
      }, delay);
    },
    [delay, performSave],
  );

  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(data);
  }, [data, performSave]);

  const resetUnsavedChanges = useCallback(() => {
    setState((prev) => ({ ...prev, hasUnsavedChanges: false }));
    lastDataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled) return;

    const dataChanged =
      JSON.stringify(data) !== JSON.stringify(lastDataRef.current);

    if (dataChanged) {
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
      debouncedSave(data);
      lastDataRef.current = data;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    forceSave,
    resetUnsavedChanges,
  };
}
