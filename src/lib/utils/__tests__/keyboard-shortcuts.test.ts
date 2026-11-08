import { describe, expect, it } from "vitest";
import { KeyboardShortcutAction } from "@/lib/types";
import {
  actionForBinding,
  bindingFromKeyPress,
  bindingKeys,
  normalizeKeyboardShortcutSettings,
  resolveKeyboardShortcutBindings,
} from "@/lib/utils/keyboard-shortcuts";

const press = (key: string, modifiers = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...modifiers,
});

describe("bindingFromKeyPress", () => {
  it("treats Ctrl and Cmd as the same key", () => {
    expect(bindingFromKeyPress(press("p", { ctrlKey: true }))).toBe("mod+p");
    expect(bindingFromKeyPress(press("p", { metaKey: true }))).toBe("mod+p");
  });

  it("reads Caps Lock as the plain letter", () => {
    expect(bindingFromKeyPress(press("E"))).toBe("e");
  });

  it("keeps Shift for letters", () => {
    expect(bindingFromKeyPress(press("E", { shiftKey: true }))).toBe("shift+e");
  });

  it("drops Shift for symbols the key already spells", () => {
    expect(bindingFromKeyPress(press("?", { shiftKey: true }))).toBe("?");
  });

  it("ignores Alt, spaces and named keys", () => {
    expect(bindingFromKeyPress(press("e", { altKey: true }))).toBeNull();
    expect(bindingFromKeyPress(press(" "))).toBeNull();
    expect(bindingFromKeyPress(press("Enter"))).toBeNull();
  });
});

describe("resolved bindings", () => {
  it("uses the defaults when nothing has changed", () => {
    const bindings = resolveKeyboardShortcutBindings({});

    expect(bindings[KeyboardShortcutAction.EDIT_RECIPE]).toBe("e");
    expect(actionForBinding(bindings, "mod+p")).toBe(
      KeyboardShortcutAction.EXPORT_RECIPE,
    );
  });

  it("frees a key when its shortcut is removed", () => {
    const bindings = resolveKeyboardShortcutBindings({
      [KeyboardShortcutAction.EDIT_RECIPE]: null,
    });

    expect(bindings[KeyboardShortcutAction.EDIT_RECIPE]).toBeNull();
    expect(actionForBinding(bindings, "e")).toBeNull();
  });
});

describe("normalizeKeyboardShortcutSettings", () => {
  const edit = KeyboardShortcutAction.EDIT_RECIPE;

  it("stores only what differs from the defaults", () => {
    expect(
      normalizeKeyboardShortcutSettings({
        enabled: true,
        bindings: {
          [edit]: "e",
          [KeyboardShortcutAction.COOK_RECIPE]: "shift+c",
        },
      }),
    ).toEqual({
      enabled: true,
      bindings: { [KeyboardShortcutAction.COOK_RECIPE]: "shift+c" },
    });
  });

  it("refuses two shortcuts on one key", () => {
    expect(
      normalizeKeyboardShortcutSettings({
        enabled: true,
        bindings: { [edit]: "c" },
      }),
    ).toBeNull();
  });

  it("allows a key once its old shortcut moves elsewhere", () => {
    expect(
      normalizeKeyboardShortcutSettings({
        enabled: true,
        bindings: {
          [edit]: "c",
          [KeyboardShortcutAction.COOK_RECIPE]: "shift+k",
        },
      }),
    ).not.toBeNull();
  });

  it.each(["mod+n", "mod+k", "mod+shift+t", "Enter", "", "shift+1"])(
    "refuses %s",
    (binding) => {
      expect(
        normalizeKeyboardShortcutSettings({
          enabled: true,
          bindings: { [edit]: binding },
        }),
      ).toBeNull();
    },
  );

  it("handles the plus key as a key rather than a separator", () => {
    expect(bindingKeys("mod++", false)).toEqual(["Ctrl", "+"]);
    expect(
      normalizeKeyboardShortcutSettings({
        enabled: false,
        bindings: { [edit]: "+" },
      }),
    ).not.toBeNull();
  });
});
