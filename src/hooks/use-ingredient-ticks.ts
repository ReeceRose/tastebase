"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(recipeId: string): string {
  return `tastebase:ticks:${recipeId}`;
}

function readTicks(recipeId: string): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(storageKey(recipeId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function useIngredientTicks(recipeId: string) {
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTicked(readTicks(recipeId));

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(recipeId)) setTicked(readTicks(recipeId));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [recipeId]);

  const persist = useCallback(
    (next: Set<string>) => {
      try {
        window.sessionStorage.setItem(
          storageKey(recipeId),
          JSON.stringify([...next]),
        );
      } catch {
        return;
      }
    },
    [recipeId],
  );

  const toggle = useCallback(
    (ingredientId: string) => {
      setTicked((current) => {
        const next = new Set(current);
        if (next.has(ingredientId)) {
          next.delete(ingredientId);
        } else {
          next.add(ingredientId);
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    const next = new Set<string>();
    persist(next);
    setTicked(next);
  }, [persist]);

  return { ticked, toggle, reset };
}
