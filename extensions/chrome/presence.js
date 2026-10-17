// Runs on the connected Tastebase so the app knows the extension is installed.
// Keep these names in sync with src/hooks/use-extension-presence.ts.
document.documentElement.dataset.tastebaseExtension =
  chrome.runtime.getManifest().version;
window.dispatchEvent(new Event("tastebase:extension-present"));
