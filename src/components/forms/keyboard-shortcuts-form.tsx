"use client";

import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateKeyboardShortcutSettings } from "@/lib/server-actions/keyboard-shortcut-actions";
import {
  ButtonVariant,
  type KeyboardShortcutAction,
  KeyboardShortcutScope,
  type KeyboardShortcutSettings,
} from "@/lib/types";
import {
  bindingConflict,
  bindingFromKeyPress,
  bindingKeys,
  isApplePlatform,
  isReservedBinding,
  KEYBOARD_SHORTCUTS,
  resolveKeyboardShortcutBindings,
} from "@/lib/utils/keyboard-shortcuts";

const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Meta",
  "Alt",
  "AltGraph",
  "CapsLock",
]);

const SCOPES = [
  { scope: KeyboardShortcutScope.ANYWHERE, title: "Anywhere" },
  { scope: KeyboardShortcutScope.RECIPE, title: "On a recipe" },
];

const subscribeToNothing = () => () => {};

function useIsApple(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );
}

interface KeyboardShortcutsFormProps {
  initialSettings: KeyboardShortcutSettings;
}

export function KeyboardShortcutsForm({
  initialSettings,
}: KeyboardShortcutsFormProps) {
  const enabledId = useId();
  const isApple = useIsApple();
  const [settings, setSettings] = useState(initialSettings);
  const [recording, setRecording] = useState<KeyboardShortcutAction | null>(
    null,
  );
  const [problem, setProblem] = useState<string | null>(null);
  const bindings = resolveKeyboardShortcutBindings(settings.bindings);
  const hasChanges = Object.keys(settings.bindings).length > 0;

  const save = useCallback(
    async (
      next: KeyboardShortcutSettings,
      previous: KeyboardShortcutSettings,
    ) => {
      setSettings(next);
      const result = await updateKeyboardShortcutSettings(next).catch(
        () => null,
      );
      if (result?.success) return;
      setSettings(previous);
      toast.error(result?.error ?? "That didn't save. Please try again.");
    },
    [],
  );

  useEffect(() => {
    if (!recording) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(event.key)) return;
      if (event.key === "Tab") {
        setRecording(null);
        setProblem(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setRecording(null);
        setProblem(null);
        return;
      }

      const binding = bindingFromKeyPress(event);
      if (!binding) {
        setProblem("Use a letter, number or symbol. Alt won't work.");
        return;
      }
      const spoken = bindingKeys(binding, isApple).join(" ");
      if (isReservedBinding(binding)) {
        setProblem(`${spoken} belongs to your browser. Try another.`);
        return;
      }
      const conflict = bindingConflict(settings.bindings, recording, binding);
      if (conflict) {
        setProblem(`${spoken} is already ${conflict.label}. Try another.`);
        return;
      }

      setRecording(null);
      setProblem(null);
      save(
        {
          ...settings,
          bindings: { ...settings.bindings, [recording]: binding },
        },
        settings,
      );
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [recording, settings, isApple, save]);

  const startRecording = (action: KeyboardShortcutAction) => {
    setProblem(null);
    setRecording(recording === action ? null : action);
  };

  const clearBinding = (action: KeyboardShortcutAction) => {
    setRecording(null);
    setProblem(null);
    save(
      { ...settings, bindings: { ...settings.bindings, [action]: null } },
      settings,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-tile bg-card p-5">
        <Label htmlFor={enabledId} className="text-body font-extrabold">
          Use keyboard shortcuts
        </Label>
        <Switch
          id={enabledId}
          checked={settings.enabled}
          onCheckedChange={(enabled) =>
            save({ ...settings, enabled }, settings)
          }
        />
      </div>

      {SCOPES.map(({ scope, title }) => (
        <div key={scope} className="space-y-2">
          <h3 className="px-1 text-meta font-extrabold">{title}</h3>
          <ul className="divide-y-2 divide-background overflow-hidden rounded-tile bg-card">
            {KEYBOARD_SHORTCUTS.filter(
              (shortcut) => shortcut.scope === scope,
            ).map((shortcut) => {
              const binding = bindings[shortcut.action];
              const isRecording = recording === shortcut.action;
              const keys = binding ? bindingKeys(binding, isApple) : [];
              return (
                <li key={shortcut.action} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-extrabold">
                      {shortcut.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant={ButtonVariant.OUTLINE}
                        size="sm"
                        aria-pressed={isRecording}
                        aria-label={
                          isRecording
                            ? `Press a key for ${shortcut.label}`
                            : `Change shortcut for ${shortcut.label}, ${keys.join(" ") || "not set"}`
                        }
                        onClick={() => startRecording(shortcut.action)}
                      >
                        {isRecording && "Press a key"}
                        {!isRecording && !binding && "Not set"}
                        {!isRecording &&
                          keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
                      </Button>
                      {binding ? (
                        <Button
                          variant={ButtonVariant.GHOST}
                          size="icon-sm"
                          aria-label={`Remove shortcut for ${shortcut.label}`}
                          onClick={() => clearBinding(shortcut.action)}
                        >
                          <X />
                        </Button>
                      ) : (
                        <span aria-hidden className="size-9" />
                      )}
                    </div>
                  </div>
                  {isRecording && (
                    <p
                      role="status"
                      className="mt-1 text-right text-meta text-muted-foreground"
                    >
                      {problem ?? "Esc to cancel"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {hasChanges && (
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={() => {
            setRecording(null);
            setProblem(null);
            save({ ...settings, bindings: {} }, settings);
          }}
        >
          Reset to defaults
        </Button>
      )}
    </div>
  );
}
