import {
  KeyboardShortcutAction,
  type KeyboardShortcutBindings,
  type KeyboardShortcutOverrides,
  KeyboardShortcutScope,
  type KeyboardShortcutSettings,
} from "@/lib/types";

export interface KeyboardShortcutDefinition {
  action: KeyboardShortcutAction;
  label: string;
  scope: KeyboardShortcutScope;
  defaultBinding: string;
}

interface KeyPress {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

const MOD_PREFIX = "mod+";
const SHIFT_PREFIX = "shift+";

export const KEYBOARD_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    action: KeyboardShortcutAction.OPEN_SEARCH,
    label: "Search",
    scope: KeyboardShortcutScope.ANYWHERE,
    defaultBinding: "/",
  },
  {
    action: KeyboardShortcutAction.NEW_RECIPE,
    label: "Add a recipe",
    scope: KeyboardShortcutScope.ANYWHERE,
    defaultBinding: "n",
  },
  {
    action: KeyboardShortcutAction.GO_HOME,
    label: "Go home",
    scope: KeyboardShortcutScope.ANYWHERE,
    defaultBinding: "h",
  },
  {
    action: KeyboardShortcutAction.GO_RECIPES,
    label: "Go to recipes",
    scope: KeyboardShortcutScope.ANYWHERE,
    defaultBinding: "r",
  },
  {
    action: KeyboardShortcutAction.EDIT_RECIPE,
    label: "Edit",
    scope: KeyboardShortcutScope.RECIPE,
    defaultBinding: "e",
  },
  {
    action: KeyboardShortcutAction.COOK_RECIPE,
    label: "Start cooking",
    scope: KeyboardShortcutScope.RECIPE,
    defaultBinding: "c",
  },
  {
    action: KeyboardShortcutAction.FAVOURITE_RECIPE,
    label: "Favourite",
    scope: KeyboardShortcutScope.RECIPE,
    defaultBinding: "f",
  },
  {
    action: KeyboardShortcutAction.EXPORT_RECIPE,
    label: "Export as PDF",
    scope: KeyboardShortcutScope.RECIPE,
    defaultBinding: "mod+p",
  },
];

export const DEFAULT_KEYBOARD_SHORTCUT_SETTINGS: KeyboardShortcutSettings = {
  enabled: false,
  bindings: {},
};

const RESERVED_BINDINGS = new Set(
  [
    "a",
    "c",
    "f",
    "k",
    "l",
    "n",
    "q",
    "r",
    "t",
    "v",
    "w",
    "x",
    "y",
    "z",
    "shift+c",
    "shift+i",
    "shift+j",
    "shift+n",
    "shift+r",
    "shift+t",
    "shift+w",
    "shift+z",
  ].map((binding) => `${MOD_PREFIX}${binding}`),
);

function isLetter(key: string): boolean {
  return /^[a-z]$/.test(key);
}

function isSingleKey(key: string): boolean {
  return key.length === 1 && key !== " " && key === key.toLowerCase();
}

function parseBinding(binding: string) {
  let key = binding;
  const hasMod = key.length > MOD_PREFIX.length && key.startsWith(MOD_PREFIX);
  if (hasMod) key = key.slice(MOD_PREFIX.length);
  const hasShift =
    key.length > SHIFT_PREFIX.length && key.startsWith(SHIFT_PREFIX);
  if (hasShift) key = key.slice(SHIFT_PREFIX.length);
  return { hasMod, hasShift, key };
}

export function bindingFromKeyPress(press: KeyPress): string | null {
  if (press.altKey || press.key.length !== 1) return null;
  const key = press.key.toLowerCase();
  if (!isSingleKey(key)) return null;
  const mod = press.ctrlKey || press.metaKey ? MOD_PREFIX : "";
  const shift = press.shiftKey && isLetter(key) ? SHIFT_PREFIX : "";
  return `${mod}${shift}${key}`;
}

export function bindingUsesModifier(binding: string): boolean {
  return parseBinding(binding).hasMod;
}

export function isReservedBinding(binding: string): boolean {
  return RESERVED_BINDINGS.has(binding);
}

function isValidBinding(binding: string): boolean {
  const { hasShift, key } = parseBinding(binding);
  if (!isSingleKey(key)) return false;
  if (hasShift && !isLetter(key)) return false;
  return !isReservedBinding(binding);
}

export function resolveKeyboardShortcutBindings(
  overrides: KeyboardShortcutOverrides,
): KeyboardShortcutBindings {
  const entries = KEYBOARD_SHORTCUTS.map((shortcut) => {
    const override = overrides[shortcut.action];
    const binding = override === undefined ? shortcut.defaultBinding : override;
    return [shortcut.action, binding] as const;
  });
  return Object.fromEntries(entries) as KeyboardShortcutBindings;
}

export function actionForBinding(
  bindings: KeyboardShortcutBindings,
  binding: string,
): KeyboardShortcutAction | null {
  const shortcut = KEYBOARD_SHORTCUTS.find(
    (entry) => bindings[entry.action] === binding,
  );
  return shortcut?.action ?? null;
}

export function bindingConflict(
  overrides: KeyboardShortcutOverrides,
  action: KeyboardShortcutAction,
  binding: string,
): KeyboardShortcutDefinition | null {
  const bindings = resolveKeyboardShortcutBindings(overrides);
  const shortcut = KEYBOARD_SHORTCUTS.find(
    (entry) => entry.action !== action && bindings[entry.action] === binding,
  );
  return shortcut ?? null;
}

export function bindingKeys(binding: string, isApple: boolean): string[] {
  const { hasMod, hasShift, key } = parseBinding(binding);
  return [
    ...(hasMod ? [isApple ? "⌘" : "Ctrl"] : []),
    ...(hasShift ? ["Shift"] : []),
    key.toUpperCase(),
  ];
}

export function isApplePlatform(platform: string): boolean {
  return /mac|iphone|ipad/i.test(platform);
}

export function normalizeKeyboardShortcutSettings(
  input: KeyboardShortcutSettings,
): KeyboardShortcutSettings | null {
  const known = new Map(
    KEYBOARD_SHORTCUTS.map((shortcut) => [shortcut.action, shortcut]),
  );
  const bindings: KeyboardShortcutOverrides = {};

  for (const [name, binding] of Object.entries(input.bindings)) {
    const shortcut = known.get(name as KeyboardShortcutAction);
    if (!shortcut || binding === undefined) return null;
    if (binding !== null && !isValidBinding(binding)) return null;
    if (binding !== shortcut.defaultBinding) {
      bindings[shortcut.action] = binding;
    }
  }

  const used = Object.values(resolveKeyboardShortcutBindings(bindings)).filter(
    (binding) => binding !== null,
  );
  if (new Set(used).size !== used.length) return null;

  return { enabled: input.enabled, bindings };
}
