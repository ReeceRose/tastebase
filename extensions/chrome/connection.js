// Where the user's Tastebase lives and whether we're allowed to open it.

// How long the primary address gets to answer once the backup already has.
// Keeps the primary preferred when both work, like at home with Tailscale on.
const PRIMARY_GRACE_MS = 1000;

// The addresses we're allowed to open, primary first.
export async function getTastebaseOrigins() {
  const { primary, backup } = await getSavedAddresses();
  const origins = [primary, backup].filter(Boolean);
  const granted = await Promise.all(
    origins.map((origin) =>
      chrome.permissions.contains({ origins: [`${origin}/*`] }),
    ),
  );
  return origins.filter((_, index) => granted[index]);
}

export async function getSavedAddresses() {
  const { tastebaseUrl, tastebaseBackupUrl } = await chrome.storage.sync.get([
    "tastebaseUrl",
    "tastebaseBackupUrl",
  ]);
  return { primary: tastebaseUrl ?? "", backup: tastebaseBackupUrl ?? "" };
}

function toOrigin(input) {
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
export function connect(primary, backup) {
  chrome.storage.sync.set({
    tastebaseUrl: primary,
    tastebaseBackupUrl: backup,
  });
  const origins = [primary, backup].filter(Boolean);
  return chrome.permissions.request({
    origins: origins.map((origin) => `${origin}/*`),
  });
}

// Reads the setup form's two fields. An empty or repeated backup means none.
export function parseAddresses(primaryInput, backupInput) {
  const primary = toOrigin(primaryInput);
  const hasBackup = backupInput.trim() !== "";
  const backup = hasBackup ? toOrigin(backupInput) : null;
  if (!primary || (hasBackup && !backup)) return null;
  return { primary, backup: backup === primary ? null : backup };
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

// Picks the address to use. Both are tried at once so being away from home
// doesn't mean waiting out the primary's timeout on every popup. If neither
// answers, the result is the primary's unreachable state.
export async function findConnection(origins) {
  const [primary, backup] = origins.map(async (origin) => ({
    origin,
    session: await checkSession(origin),
  }));
  if (!backup) return primary;

  const isReachable = (result) =>
    result.session.state !== SessionState.UNREACHABLE;
  const graceOver = backup.then((result) =>
    isReachable(result)
      ? new Promise((resolve) =>
          setTimeout(() => resolve(null), PRIMARY_GRACE_MS),
        )
      : primary,
  );
  const first = await Promise.race([primary, graceOver]);
  if (first && isReachable(first)) return first;
  const fallback = await backup;
  return isReachable(fallback) ? fallback : primary;
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
