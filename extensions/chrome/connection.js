// Where the user's Tastebase lives and whether we're allowed to open it.

export async function getTastebaseOrigin() {
  const { tastebaseUrl } = await chrome.storage.sync.get("tastebaseUrl");
  if (!tastebaseUrl) return null;
  const granted = await chrome.permissions.contains({
    origins: [`${tastebaseUrl}/*`],
  });
  return granted ? tastebaseUrl : null;
}

export async function getSavedAddress() {
  const { tastebaseUrl } = await chrome.storage.sync.get("tastebaseUrl");
  return tastebaseUrl ?? "";
}

export function toOrigin(input) {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${/^(localhost|127\.|\d+\.\d+\.\d+\.\d+)/.test(trimmed) ? "http" : "https"}://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export function displayAddress(origin) {
  return origin.replace(/^https?:\/\//, "");
}

// chrome.permissions.request must run straight from the click, so call this
// before awaiting anything else. The address is stored first because Chrome's
// permission prompt can close the popup before the request resolves.
export function connect(origin) {
  chrome.storage.sync.set({ tastebaseUrl: origin });
  return chrome.permissions.request({ origins: [`${origin}/*`] });
}

export const SessionState = Object.freeze({
  SIGNED_IN: "signed-in",
  SIGNED_OUT: "signed-out",
  UNREACHABLE: "unreachable",
});

export async function checkSession(origin) {
  try {
    const response = await fetch(`${origin}/api/auth/get-session`, {
      credentials: "include",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { state: SessionState.UNREACHABLE, name: null };
    const session = await response.json();
    return session?.user
      ? { state: SessionState.SIGNED_IN, name: session.user.name ?? null }
      : { state: SessionState.SIGNED_OUT, name: null };
  } catch {
    return { state: SessionState.UNREACHABLE, name: null };
  }
}

// A recipe already in Tastebase from the same page, or null.
export async function findSavedRecipe(origin, pageUrl) {
  try {
    const response = await fetch(
      `${origin}/api/recipes/saved?url=${encodeURIComponent(pageUrl)}`,
      { credentials: "include", signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return null;
    const body = await response.json();
    return body?.recipe ?? null;
  } catch {
    return null;
  }
}
