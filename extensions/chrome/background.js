import { getTastebaseOrigin } from "./connection.js";

// Keep these names in sync with src/hooks/use-extension-page-import.ts.
const PAGE_EVENT = "tastebase:extension-page";
const READY_EVENT = "tastebase:extension-ready";
const PROGRESS_EVENT = "tastebase:extension-progress";
const SAVE_MESSAGE = "tastebase:save";
const IMPORT_PATH = "/recipes/new?from=extension";
const PENDING_KEY = "pendingImports";
const MAX_HTML_LENGTH = 3 * 1024 * 1024;
const MAX_PHOTOS = 16;
const PHOTO_BUDGET = 4 * 1024 * 1024;
const MIN_PHOTO_WIDTH = 400;

// Pages waiting to be handed to a Tastebase tab. Kept in memory and, when it
// fits, in session storage so a restarted service worker can still deliver.
const pendingInMemory = new Map();

// Photo progress for tabs still waiting on their page. Only needed while the
// service worker is busy gathering photos, so it isn't stored.
const progressByTab = new Map();

// Runs in the recipe page. Drops scripts, styles and media so only the
// markup and the JSON-LD recipe data are sent.
function capturePage() {
  const root = document.documentElement.cloneNode(true);
  root
    .querySelectorAll(
      'script:not([type="application/ld+json"]), style, link, svg, iframe, noscript, template, video, audio, canvas, picture source',
    )
    .forEach((element) => {
      element.remove();
    });
  root.querySelectorAll("img").forEach((image) => {
    image.removeAttribute("srcset");
  });
  return { url: location.href, html: `<!doctype html>${root.outerHTML}` };
}

// Runs in the recipe page. Lists the photos in the recipe content in page
// order, skipping navigation, ads, author photos and anything small.
function collectPhotos(maxPhotos, mainPhotoUrl) {
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 250;
  const skipped =
    'nav, aside, [role="navigation"], [role="complementary"], [aria-hidden="true"], [class*="related"], [class*="recirc"], [class*="author"], [class*="byline"], [class*="avatar"], [class*="logo"], [class*="promo"], [class*="sponsor"], [class*="advert"], [class*="newsletter"], [class*="comment"], [id*="comment"]';
  const junk =
    /(logo|avatar|icon|sprite|pixel|badge|placeholder|spinner|headshot|emoji|tracking|\/cta\/|ebook)/i;
  const largest = (srcset) => {
    let best = null;
    for (const entry of (srcset ?? "").split(/,\s+/)) {
      const [url, descriptor = ""] = entry.trim().split(/\s+/);
      const size = Number.parseFloat(descriptor) || 0;
      if (url && (!best || size > best.size)) best = { url, size };
    }
    return best?.url ?? null;
  };
  // Keep in sync with photoKey in src/lib/utils/photo-suggestions.ts.
  const sizeSuffix =
    /(-\d+x\d+|-scaled|-(articleLarge|superJumbo|jumbo|facebookJumbo|popup|blog\d+|master\d+|threeByTwo\w*|videoSixteenByNine\w*|mediumSquare\w*|square\w*|thumbStandard|thumbLarge\w*|verticalTwoByThree\w*|horizontalMediumAt2X))$/i;
  const keyOf = (url) => {
    const file = url.pathname.split("/").filter(Boolean).pop() ?? "";
    const stem = file.replace(/\.[a-z0-9]+$/i, "").replace(sizeSuffix, "");
    return `${url.hostname}/${stem.toLowerCase()}`;
  };
  const shopHosts =
    /(^|\.)(media-amazon\.com|ssl-images-amazon\.com|scene7\.com|walmartimages\.com|shopify\.com)$/i;
  const shareSites = new Set([
    "pinterest.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
  ]);
  const siteOf = (hostname) => hostname.split(".").slice(-2).join(".");
  // Product photos in shopping roundups link out to the shop.
  const linksOffSite = (image) => {
    const href = image.closest("a")?.href;
    if (!href) return false;
    try {
      const site = siteOf(new URL(href).hostname);
      return !shareSites.has(site) && site !== siteOf(location.hostname);
    } catch {
      return false;
    }
  };
  const outsideContent = (image, tag) => {
    const wrapper = image.closest(tag);
    return wrapper && !wrapper.closest("article, main");
  };

  const seen = new Set();
  if (mainPhotoUrl) seen.add(keyOf(new URL(mainPhotoUrl)));
  const photos = [];
  for (const image of document.images) {
    if (photos.length >= maxPhotos) break;
    if (image.closest(skipped) || linksOffSite(image)) continue;
    if (outsideContent(image, "header") || outsideContent(image, "footer")) {
      continue;
    }

    const loaded = image.complete && image.naturalWidth > 0;
    const width = loaded
      ? image.naturalWidth
      : Number.parseInt(image.getAttribute("width"), 10) || 0;
    const height = loaded
      ? image.naturalHeight
      : Number.parseInt(image.getAttribute("height"), 10) || 0;
    if (width > 0) {
      if (width < MIN_WIDTH || (height > 0 && height < MIN_HEIGHT)) continue;
      if (height > 0 && (width / height > 3 || height / width > 2.2)) continue;
    } else if (!image.closest("main, article, [class*='recipe']")) {
      continue;
    }

    const pictureSource = image
      .closest("picture")
      ?.querySelector("source[srcset]")
      ?.getAttribute("srcset");
    const raw =
      largest(image.getAttribute("data-srcset")) ??
      largest(image.getAttribute("srcset")) ??
      largest(pictureSource) ??
      image.getAttribute("data-src") ??
      image.getAttribute("data-lazy-src") ??
      image.currentSrc ??
      image.src;
    let url;
    try {
      url = new URL(raw, location.href);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || shopHosts.test(url.hostname)) {
      continue;
    }
    if (url.origin === location.origin && url.pathname === location.pathname) {
      continue;
    }
    if (/\.(svg|gif|ico)$/i.test(url.pathname) || junk.test(url.pathname)) {
      continue;
    }
    const key = keyOf(url);
    if (seen.has(key)) continue;
    seen.add(key);
    photos.push(url.href);
  }
  return photos;
}

// Runs in the Tastebase page's own JavaScript world so the app can hear it.
function deliverPage(page, pageEvent, readyEvent) {
  const send = () =>
    window.dispatchEvent(new CustomEvent(pageEvent, { detail: page }));
  window.addEventListener(readyEvent, send);
  send();
}

// Runs in the Tastebase page's own JavaScript world. Keeps the latest
// progress on the window so a page that hydrates late still gets it.
function deliverProgress(progress, progressEvent, readyEvent) {
  const key = "__tastebaseExtensionProgress";
  const send = () =>
    window.dispatchEvent(
      new CustomEvent(progressEvent, { detail: window[key] }),
    );
  if (!(key in window)) window.addEventListener(readyEvent, send);
  window[key] = progress;
  send();
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

async function fetchImage(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

// Shrinks a photo to a sensible size as a JPEG. Returns null for images too
// small to be recipe photos or that the browser can't decode.
async function compressPhoto(blob, maxDimension, quality) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }
  if (bitmap.width < MIN_PHOTO_WIDTH) {
    bitmap.close();
    return null;
  }
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const jpeg = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return {
    data: toBase64(await jpeg.arrayBuffer()),
    mimeType: "image/jpeg",
  };
}

// The browser can usually load photos even when the site blocks Tastebase's
// server. Photos it can't load are sent as addresses for Tastebase to try.
async function captureMainPhoto(imageUrl) {
  const blob = imageUrl ? await fetchImage(imageUrl) : null;
  return blob ? compressPhoto(blob, 2400, 0.9) : null;
}

async function capturePhotos(urls, onPhotoDone) {
  const photos = urls.map((url) => ({ url, image: null }));
  let budget = PHOTO_BUDGET;
  let next = 0;
  const worker = async () => {
    while (next < photos.length) {
      const photo = photos[next++];
      const blob = await fetchImage(photo.url);
      const image = blob ? await compressPhoto(blob, 1600, 0.85) : null;
      if (blob && !image) photo.tooSmall = true;
      if (image && image.data.length <= budget) {
        budget -= image.data.length;
        photo.image = image;
      }
      onPhotoDone();
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return photos
    .filter((photo) => !photo.tooSmall)
    .map(({ url, image }) => ({ url, image }));
}

async function readStoredPending() {
  const stored = await chrome.storage.session.get(PENDING_KEY);
  return stored[PENDING_KEY] ?? {};
}

async function rememberPage(tabId, page) {
  pendingInMemory.set(tabId, page);
  const stored = await readStoredPending();
  stored[tabId] = page;
  await chrome.storage.session
    .set({ [PENDING_KEY]: stored })
    .catch(() => undefined);
}

async function takePage(tabId) {
  const stored = await readStoredPending();
  const page = pendingInMemory.get(tabId) ?? stored[tabId] ?? null;
  pendingInMemory.delete(tabId);
  if (stored[tabId]) {
    delete stored[tabId];
    await chrome.storage.session.set({ [PENDING_KEY]: stored });
  }
  return page;
}

async function saveRecipe(tabId, imageUrl) {
  const origin = await getTastebaseOrigin();
  if (!origin) {
    return { ok: false, error: "Connect your Tastebase first." };
  }

  let page;
  let photoUrls;
  try {
    const [[pageResult], [photosResult]] = await Promise.all([
      chrome.scripting.executeScript({ target: { tabId }, func: capturePage }),
      chrome.scripting.executeScript({
        target: { tabId },
        func: collectPhotos,
        args: [MAX_PHOTOS, imageUrl],
      }),
    ]);
    page = pageResult?.result;
    photoUrls = photosResult?.result ?? [];
  } catch {
    return { ok: false, error: "Chrome won't let extensions read this page." };
  }
  if (!page) {
    return { ok: false, error: "This page couldn't be read." };
  }
  if (page.html.length > MAX_HTML_LENGTH) {
    return { ok: false, error: "This page is too large to send to Tastebase." };
  }

  // Open Tastebase straight away so it can show progress while the photos
  // load, instead of leaving the popup waiting on them.
  const source = await chrome.tabs.get(tabId);
  const created = await chrome.tabs.create({
    url: `${origin}${IMPORT_PATH}`,
    index: source.index + 1,
    openerTabId: tabId,
  });
  sendPage(created.id, page, imageUrl, photoUrls).catch(() =>
    progressByTab.delete(created.id),
  );
  return { ok: true };
}

async function sendPage(tabId, page, imageUrl, photoUrls) {
  const total = photoUrls.length + (imageUrl ? 1 : 0);
  let done = 0;
  const onPhotoDone = () => {
    done += 1;
    updateProgress(tabId, { photosDone: done, photosTotal: total });
  };
  if (total > 0) updateProgress(tabId, { photosDone: 0, photosTotal: total });

  const [image, photos] = await Promise.all([
    captureMainPhoto(imageUrl).finally(() => {
      if (imageUrl) onPhotoDone();
    }),
    capturePhotos(photoUrls, onPhotoDone),
  ]);
  progressByTab.delete(tabId);
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;
  await rememberPage(tabId, { ...page, image, photos });
  await deliverIfReady(await chrome.tabs.get(tabId));
}

function updateProgress(tabId, progress) {
  progressByTab.set(tabId, progress);
  chrome.tabs
    .get(tabId)
    .then(deliverIfReady)
    .catch(() => undefined);
}

async function deliverIfReady(tab) {
  if (tab.status !== "complete") return;
  const tabId = tab.id;
  const origin = await getTastebaseOrigin();
  if (!origin || !tab.url?.startsWith(`${origin}${IMPORT_PATH}`)) return;

  const page = await takePage(tabId);
  if (page) {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: deliverPage,
      args: [page, PAGE_EVENT, READY_EVENT],
    });
    return;
  }
  const progress = progressByTab.get(tabId);
  if (!progress) return;
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: deliverProgress,
    args: [progress, PROGRESS_EVENT, READY_EVENT],
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== SAVE_MESSAGE) return false;
  saveRecipe(message.tabId, message.imageUrl ?? null).then(sendResponse, () =>
    sendResponse({ ok: false, error: "Something went wrong. Try again." }),
  );
  return true;
});

// Listening at the top level means a restarted service worker still
// delivers pages to tabs it opened before it went idle.
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    await deliverIfReady(tab);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  progressByTab.delete(tabId);
  await takePage(tabId);
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    await chrome.runtime.openOptionsPage();
  }
});

// Marks the connected Tastebase's pages so the app can tell the extension is
// installed. Re-registered whenever the address or permission changes.
const PRESENCE_SCRIPT_ID = "tastebase-presence";

async function syncPresenceScript() {
  await chrome.scripting
    .unregisterContentScripts({ ids: [PRESENCE_SCRIPT_ID] })
    .catch(() => undefined);
  const origin = await getTastebaseOrigin();
  if (!origin) return;
  await chrome.scripting
    .registerContentScripts([
      {
        id: PRESENCE_SCRIPT_ID,
        matches: [`${origin}/*`],
        js: ["presence.js"],
        runAt: "document_start",
      },
    ])
    .catch(() => undefined);
}

chrome.runtime.onInstalled.addListener(syncPresenceScript);
chrome.runtime.onStartup.addListener(syncPresenceScript);
chrome.permissions.onAdded.addListener(syncPresenceScript);
chrome.permissions.onRemoved.addListener(syncPresenceScript);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.tastebaseUrl) syncPresenceScript();
});
