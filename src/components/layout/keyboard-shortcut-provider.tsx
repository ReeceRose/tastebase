"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import {
  type ShortcutHandlers,
  ShortcutHandlersContext,
} from "@/hooks/use-shortcut-action";
import type { KeyboardShortcutSettings } from "@/lib/types";
import {
  actionForBinding,
  bindingFromKeyPress,
  bindingUsesModifier,
  resolveKeyboardShortcutBindings,
} from "@/lib/utils/keyboard-shortcuts";

const TYPING_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]';
const OVERLAY_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

function isTyping(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TYPING_SELECTOR) !== null;
}

interface KeyboardShortcutListenerProps {
  settings: Promise<KeyboardShortcutSettings>;
  handlers: ShortcutHandlers;
}

function KeyboardShortcutListener({
  settings,
  handlers,
}: KeyboardShortcutListenerProps) {
  const { enabled, bindings: overrides } = use(settings);
  const bindings = useMemo(
    () => resolveKeyboardShortcutBindings(overrides),
    [overrides],
  );

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const binding = bindingFromKeyPress(event);
      if (!binding) return;
      const action = actionForBinding(bindings, binding);
      if (!action) return;
      const handler = handlers.get(action);
      if (!handler) return;

      const usesModifier = bindingUsesModifier(binding);
      if (!usesModifier && isTyping(event.target)) return;
      const overlayOpen = document.querySelector(OVERLAY_SELECTOR) !== null;
      if (!usesModifier && overlayOpen) return;

      event.preventDefault();
      if (event.repeat || overlayOpen) return;
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, bindings, handlers]);

  return null;
}

interface KeyboardShortcutProviderProps {
  settings: Promise<KeyboardShortcutSettings>;
  children: React.ReactNode;
}

export function KeyboardShortcutProvider({
  settings,
  children,
}: KeyboardShortcutProviderProps) {
  const [handlers] = useState<ShortcutHandlers>(() => new Map());

  return (
    <ShortcutHandlersContext value={handlers}>
      <Suspense fallback={null}>
        <KeyboardShortcutListener settings={settings} handlers={handlers} />
      </Suspense>
      {children}
    </ShortcutHandlersContext>
  );
}
