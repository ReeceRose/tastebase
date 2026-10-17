"use client";

import { useSyncExternalStore } from "react";
import { ExtensionPresence } from "@/lib/types";

// The Save to Tastebase extension tags the page as soon as it loads. Keep
// these names in sync with extensions/chrome/presence.js.
const PRESENT_EVENT = "tastebase:extension-present";

function subscribe(onChange: () => void) {
  window.addEventListener(PRESENT_EVENT, onChange);
  return () => window.removeEventListener(PRESENT_EVENT, onChange);
}

// The extension is Chrome-only and phones can't run extensions.
function canInstall(): boolean {
  const agent = navigator.userAgent;
  return /Chrome|Chromium/.test(agent) && !/Mobile|Android/.test(agent);
}

function getSnapshot(): ExtensionPresence {
  if (document.documentElement.dataset.tastebaseExtension) {
    return ExtensionPresence.INSTALLED;
  }
  return canInstall()
    ? ExtensionPresence.MISSING
    : ExtensionPresence.UNSUPPORTED;
}

function getServerSnapshot(): ExtensionPresence {
  return ExtensionPresence.UNKNOWN;
}

export function useExtensionPresence(): ExtensionPresence {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
