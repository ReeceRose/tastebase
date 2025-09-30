"use client";

import { useRouter } from "next/navigation";
import {
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts";

interface UseRecipeShortcutsProps {
  onNewRecipe?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
  onTogglePrivacy?: () => void;
  onAddIngredient?: () => void;
  onAddInstruction?: () => void;
  onAddNote?: () => void;
  onToggleFavorite?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onHelp?: () => void;
  enabled?: boolean;
}

export function useRecipeShortcuts({
  onNewRecipe: _onNewRecipe,
  onSave: _onSave,
  onSearch: _onSearch,
  onTogglePrivacy: _onTogglePrivacy,
  onAddIngredient: _onAddIngredient,
  onAddInstruction: _onAddInstruction,
  onAddNote: _onAddNote,
  onToggleFavorite: _onToggleFavorite,
  onDuplicate: _onDuplicate,
  onDelete: _onDelete,
  onExport: _onExport,
  onPrint: _onPrint,
  onHelp: _onHelp,
  enabled = true,
}: UseRecipeShortcutsProps = {}) {
  const _router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: "n",
      ctrlKey: true,
      description: "Create new recipe",
      category: "Navigation",
    },
    {
      key: "h",
      description: "Go to recipes home",
      category: "Navigation",
    },
    {
      key: "f",
      ctrlKey: true,
      description: "Focus search",
      category: "Navigation",
    },

    // Form shortcuts
    {
      key: "s",
      ctrlKey: true,
      description: "Save recipe",
      category: "Forms",
    },
    {
      key: "i",
      altKey: true,
      description: "Add ingredient",
      category: "Forms",
    },
    {
      key: "t",
      altKey: true,
      description: "Add instruction step",
      category: "Forms",
    },

    // Recipe actions
    {
      key: "m",
      altKey: true,
      description: "Add note",
      category: "Recipe Actions",
    },
    {
      key: "l",
      altKey: true,
      description: "Toggle favorite",
      category: "Recipe Actions",
    },
    {
      key: "d",
      ctrlKey: true,
      shiftKey: true,
      description: "Duplicate recipe",
      category: "Recipe Actions",
    },
    {
      key: "p",
      ctrlKey: true,
      description: "Print recipe",
      category: "Recipe Actions",
    },

    // Advanced shortcuts
    {
      key: "e",
      ctrlKey: true,
      shiftKey: true,
      description: "Export recipe",
      category: "Advanced",
    },
    {
      key: "Delete",
      shiftKey: true,
      description: "Delete recipe",
      category: "Advanced",
    },
    {
      key: "v",
      ctrlKey: true,
      shiftKey: true,
      description: "Toggle privacy",
      category: "Advanced",
    },

    // Help and utility
    {
      key: "?",
      description: "Show keyboard shortcuts",
      category: "Help",
    },
    {
      key: "/",
      ctrlKey: true,
      description: "Show keyboard shortcuts",
      category: "Help",
    },

    // Quick navigation numbers
    {
      key: "1",
      altKey: true,
      description: "Go to recipes list",
      category: "Quick Navigation",
    },
    {
      key: "2",
      altKey: true,
      description: "Go to new recipe",
      category: "Quick Navigation",
    },
    {
      key: "3",
      altKey: true,
      description: "Go to favorites",
      category: "Quick Navigation",
    },

    // ESC to cancel/close
    {
      key: "Escape",
      description: "Cancel/Close",
      category: "General",
    },
  ];

  const { formatShortcut, getShortcutsByCategory } = useKeyboardShortcuts({
    shortcuts,
    enabled,
  });

  return {
    shortcuts,
    formatShortcut,
    getShortcutsByCategory,
  };
}
