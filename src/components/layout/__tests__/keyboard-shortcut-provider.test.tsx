// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyboardShortcutProvider } from "@/components/layout/keyboard-shortcut-provider";
import { useShortcutAction } from "@/hooks/use-shortcut-action";
import {
  KeyboardShortcutAction,
  type KeyboardShortcutSettings,
} from "@/lib/types";

function Actions({
  edit,
  exportPdf,
}: {
  edit: () => void;
  exportPdf: () => void;
}) {
  useShortcutAction(KeyboardShortcutAction.EDIT_RECIPE, edit);
  useShortcutAction(KeyboardShortcutAction.EXPORT_RECIPE, exportPdf);
  return (
    <>
      <input aria-label="Note" />
      <button type="button">Plain</button>
    </>
  );
}

async function setup(settings: KeyboardShortcutSettings, withExport = true) {
  const edit = vi.fn();
  const exportPdf = vi.fn();
  const view = await act(async () =>
    render(
      <KeyboardShortcutProvider settings={Promise.resolve(settings)}>
        {withExport ? (
          <Actions edit={edit} exportPdf={exportPdf} />
        ) : (
          <input aria-label="Note" />
        )}
      </KeyboardShortcutProvider>,
    ),
  );
  return { edit, exportPdf, view };
}

function press(target: Element | Document, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

const on: KeyboardShortcutSettings = { enabled: true, bindings: {} };
const print = { key: "p", ctrlKey: true };

describe("KeyboardShortcutProvider", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("leaves every key alone while shortcuts are off", async () => {
    const { edit, exportPdf } = await setup({ enabled: false, bindings: {} });

    const printing = press(document.body, print);
    press(document.body, { key: "e" });

    expect(printing.defaultPrevented).toBe(false);
    expect(exportPdf).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
  });

  it("takes over Ctrl P where export is available", async () => {
    const { exportPdf } = await setup(on);

    const event = press(document.body, print);

    expect(event.defaultPrevented).toBe(true);
    expect(exportPdf).toHaveBeenCalledOnce();
  });

  it("leaves Ctrl P to the browser on pages without export", async () => {
    await setup(on, false);

    expect(press(document.body, print).defaultPrevented).toBe(false);
  });

  it("does not steal plain keys from someone typing", async () => {
    const { edit, view } = await setup(on);

    const event = press(view.getByLabelText("Note"), { key: "e" });

    expect(event.defaultPrevented).toBe(false);
    expect(edit).not.toHaveBeenCalled();
  });

  it("still exports when Ctrl P is pressed while typing", async () => {
    const { exportPdf, view } = await setup(on);

    press(view.getByLabelText("Note"), print);

    expect(exportPdf).toHaveBeenCalledOnce();
  });

  it("does nothing behind an open dialog, and doesn't print either", async () => {
    const { edit, exportPdf } = await setup(on);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.append(dialog);

    press(document.body, { key: "e" });
    const printing = press(document.body, print);

    expect(edit).not.toHaveBeenCalled();
    expect(exportPdf).not.toHaveBeenCalled();
    expect(printing.defaultPrevented).toBe(true);
  });

  it("follows a changed key", async () => {
    const { edit } = await setup({
      enabled: true,
      bindings: { [KeyboardShortcutAction.EDIT_RECIPE]: "shift+e" },
    });

    press(document.body, { key: "e" });
    expect(edit).not.toHaveBeenCalled();

    press(document.body, { key: "E", shiftKey: true });
    expect(edit).toHaveBeenCalledOnce();
  });
});
