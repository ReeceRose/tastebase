"use client";

import { usePathname, useRouter } from "next/navigation";
import { useShortcutAction } from "@/hooks/use-shortcut-action";
import { KeyboardShortcutAction } from "@/lib/types";

const COOK_MODE_PATH = /^\/recipes\/[^/]+\/cook$/;

interface GlobalShortcutsProps {
  onOpenSearch: () => void;
}

function GlobalShortcutActions({ onOpenSearch }: GlobalShortcutsProps) {
  const router = useRouter();

  useShortcutAction(KeyboardShortcutAction.OPEN_SEARCH, onOpenSearch);
  useShortcutAction(KeyboardShortcutAction.NEW_RECIPE, () =>
    router.push("/recipes/new"),
  );
  useShortcutAction(KeyboardShortcutAction.GO_HOME, () => router.push("/"));
  useShortcutAction(KeyboardShortcutAction.GO_RECIPES, () =>
    router.push("/recipes"),
  );

  return null;
}

export function GlobalShortcuts({ onOpenSearch }: GlobalShortcutsProps) {
  const pathname = usePathname();
  if (COOK_MODE_PATH.test(pathname)) return null;
  return <GlobalShortcutActions onOpenSearch={onOpenSearch} />;
}

interface RecipeShortcutsProps {
  slug: string;
  canEdit: boolean;
}

export function RecipeShortcuts({ slug, canEdit }: RecipeShortcutsProps) {
  const router = useRouter();

  useShortcutAction(KeyboardShortcutAction.EDIT_RECIPE, () => {
    if (canEdit) router.push(`/recipes/${slug}/edit`);
  });
  useShortcutAction(KeyboardShortcutAction.COOK_RECIPE, () =>
    router.push(`/recipes/${slug}/cook`),
  );

  return null;
}
