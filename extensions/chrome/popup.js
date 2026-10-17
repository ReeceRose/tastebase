import {
  checkSession,
  connect,
  displayAddress,
  findSavedRecipe,
  getSavedAddress,
  getTastebaseOrigin,
  SessionState,
  toOrigin,
} from "./connection.js";

const SAVE_MESSAGE = "tastebase:save";

const element = (id) => document.getElementById(id);
const views = [...document.querySelectorAll(".view")];
const settingsButton = element("settings-button");
const saveButton = element("save-button");
const saveAnywayButton = element("save-anyway-button");
const errorMessage = element("error");

let origin = null;
let tab = null;
let preview = null;

function show(name) {
  for (const view of views) {
    view.hidden = view.id !== `view-${name}`;
  }
  settingsButton.setAttribute("aria-pressed", String(name === "setup"));
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

// Runs in the recipe page to read what the recipe card will show. Mirrors
// how Tastebase picks the title and photo, so the preview matches the import.
function readRecipePreview() {
  const isRecipe = (node) => {
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some(
      (value) =>
        typeof value === "string" &&
        (value === "Recipe" || value.endsWith("/Recipe")),
    );
  };
  const find = (value, depth) => {
    if (!value || typeof value !== "object" || depth > 6) return null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = find(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (isRecipe(value)) return value;
    for (const key of [
      "@graph",
      "mainEntity",
      "mainEntityOfPage",
      "itemListElement",
    ]) {
      const found = find(value[key], depth + 1);
      if (found) return found;
    }
    return null;
  };
  const text = (value) => {
    if (typeof value === "string") return value.trim() || null;
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return text(value[0]);
    if (value && typeof value === "object")
      return text(value.name ?? value.text);
    return null;
  };
  const decode = (value) => {
    if (!value) return value;
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  };
  const meta = (name) =>
    document
      .querySelector(`meta[property="${name}"], meta[name="${name}"]`)
      ?.getAttribute("content")
      ?.trim() || null;
  // Keep in sync with readImageUrl in src/lib/import/json-ld-parser.ts.
  const sizeFromUrl = (url) => {
    const match =
      url.match(/[?&](?:resize|fit)=(\d+)(?:%2C|,)(\d+)/i) ??
      url.match(/-(\d{2,5})x(\d{2,5})\.[a-z]+(?:[?#]|$)/i) ??
      url.match(/[?&]wid=(\d+)&hei=(\d+)/i);
    return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
  };
  const image = (value) => {
    const candidates = (Array.isArray(value) ? value : [value])
      .map((item) => {
        const url =
          typeof item === "string" ? item : (item?.url ?? item?.contentUrl);
        if (typeof url !== "string" || !url.trim()) return null;
        const declaredWidth = Number.parseInt(item?.width, 10) || 0;
        const size =
          declaredWidth > 0
            ? {
                width: declaredWidth,
                height: Number.parseInt(item.height, 10) || 0,
              }
            : sizeFromUrl(url);
        if (!size) return { url, width: 100000, landscape: false };
        return {
          url,
          width: size.width,
          landscape: size.height > 0 && size.width > size.height,
        };
      })
      .filter(Boolean);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, item) => {
      const bothLarge = best.width >= 1000 && item.width >= 1000;
      if (bothLarge && item.landscape !== best.landscape) {
        return item.landscape ? item : best;
      }
      return item.width > best.width ? item : best;
    }).url;
  };
  const minutes = (value) => {
    const match =
      typeof value === "string" &&
      value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/i);
    if (!match) return 0;
    const [days, hours, mins] = match.slice(1).map((part) => Number(part ?? 0));
    return days * 1440 + hours * 60 + mins;
  };
  const countSteps = (value) => {
    if (!value) return 0;
    if (typeof value === "string") {
      return value.split(/\n+/).filter((line) => line.trim()).length;
    }
    if (Array.isArray(value)) {
      return value.reduce((total, item) => total + countSteps(item), 0);
    }
    if (value.itemListElement) return countSteps(value.itemListElement);
    return 1;
  };
  const absolute = (value) => {
    try {
      return value ? new URL(value, location.href).href : null;
    } catch {
      return null;
    }
  };

  let recipe = null;
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      recipe = find(JSON.parse(script.textContent), 0);
    } catch {
      recipe = null;
    }
    if (recipe) break;
  }

  const ingredients = recipe?.recipeIngredient ?? recipe?.ingredients;
  return {
    found: Boolean(recipe && (ingredients || recipe.recipeInstructions)),
    title: decode(text(recipe?.name) ?? meta("og:title") ?? document.title),
    siteName:
      decode(text(recipe?.publisher) ?? meta("og:site_name")) ??
      location.hostname.replace(/^www\./, ""),
    imageUrl: absolute(
      image(recipe?.image ?? recipe?.thumbnailUrl) ??
        meta("og:image") ??
        meta("twitter:image"),
    ),
    ingredientCount: Array.isArray(ingredients) ? ingredients.length : 0,
    stepCount: countSteps(recipe?.recipeInstructions),
    totalMinutes:
      minutes(recipe?.totalTime) ||
      minutes(recipe?.prepTime) + minutes(recipe?.cookTime),
    servings: text(recipe?.recipeYield),
  };
}

async function readPreview() {
  if (!tab?.id || !/^https?:/.test(tab.url ?? "")) {
    return { kind: "not-a-page" };
  }
  if (tab.url.startsWith(origin)) {
    return { kind: "in-tastebase" };
  }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: readRecipePreview,
    });
    return result?.result
      ? { kind: "page", preview: result.result }
      : { kind: "unreadable" };
  } catch {
    return { kind: "unreadable" };
  }
}

function formatMinutes(total) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function renderRecipe(recipe) {
  const photo = element("recipe-photo");
  const image = element("recipe-image");
  photo.hidden = !recipe.imageUrl;
  if (recipe.imageUrl) {
    image.onerror = () => {
      photo.hidden = true;
    };
    image.src = recipe.imageUrl;
  }

  element("recipe-site").textContent = recipe.siteName;
  element("recipe-title").textContent = recipe.title || "Untitled recipe";

  const facts = [];
  if (recipe.ingredientCount) {
    facts.push(plural(recipe.ingredientCount, "ingredient", "ingredients"));
  }
  if (recipe.stepCount) {
    facts.push(plural(recipe.stepCount, "step", "steps"));
  }
  if (recipe.totalMinutes) facts.push(formatMinutes(recipe.totalMinutes));
  if (recipe.servings) {
    facts.push(
      /^\d+$/.test(recipe.servings)
        ? `Serves ${recipe.servings}`
        : recipe.servings.slice(0, 24),
    );
  }
  element("recipe-facts").replaceChildren(
    ...facts.map((fact) => {
      const item = document.createElement("li");
      item.textContent = fact;
      return item;
    }),
  );

  show("recipe");
  saveButton.focus();
}

function savedWhen(isoDate) {
  const date = new Date(isoDate);
  const days = Math.round((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  return `on ${date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })}`;
}

// Already in Tastebase: opening it becomes the main action, and saving
// again is still there as a plain button.
function renderSaved(saved) {
  const notice = element("saved-notice");
  notice.hidden = !saved;
  if (!saved) return;
  const who = saved.isOwn ? "You" : saved.savedBy;
  element("saved-text").textContent =
    `${who} already saved this ${savedWhen(saved.savedAt)}.`;
  element("open-saved-button").onclick = () => {
    chrome.tabs.create({ url: `${origin}${saved.path}` });
    window.close();
  };
  saveButton.className = "button button-outline button-block";
  element("save-label").textContent = "Save another copy";
  element("open-saved-button").focus();
}

function renderFooter(session) {
  const footer = element("footer");
  const status = element("footer-status");
  const address = displayAddress(origin);
  footer.hidden = false;
  if (session.state === SessionState.SIGNED_IN) {
    const dot = document.createElement("span");
    dot.className = "status-dot";
    status.replaceChildren(
      `${session.name ? `Signed in as ${session.name}` : "Signed in"} · ${address}`,
    );
    footer.replaceChildren(dot, status);
  } else {
    footer.replaceChildren(status);
    status.textContent = address;
  }
}

async function load() {
  showError("");
  origin = await getTastebaseOrigin();
  if (!origin) {
    await showSetup();
    return;
  }

  settingsButton.hidden = false;
  for (const node of document.querySelectorAll(".tastebase-address")) {
    node.textContent = displayAddress(origin);
  }
  show("loading");

  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = /^https?:/.test(tab?.url ?? "") ? tab.url : null;
  const [session, page, saved] = await Promise.all([
    checkSession(origin),
    readPreview(),
    pageUrl && !pageUrl.startsWith(origin)
      ? findSavedRecipe(origin, pageUrl)
      : null,
  ]);
  renderFooter(session);

  if (session.state === SessionState.UNREACHABLE) {
    show("unreachable");
    return;
  }
  if (session.state === SessionState.SIGNED_OUT) {
    preview = page.kind === "page" ? page.preview : null;
    element("sign-in-button").textContent = preview
      ? "Sign in and save"
      : "Sign in";
    element("signed-out-text").lastChild.textContent = preview
      ? " in this browser. Sign in and this recipe comes with you."
      : " in this browser.";
    show("signed-out");
    element("sign-in-button").focus();
    return;
  }

  if (page.kind !== "page") {
    const [title, text] =
      page.kind === "in-tastebase"
        ? [
            "You're in Tastebase",
            "Open a recipe on another site, then click the Tastebase icon to bring it in.",
          ]
        : page.kind === "unreadable"
          ? [
              "Chrome won't share this page",
              "Extensions can't read some pages, like the Chrome Web Store. Copy the recipe text and paste it into Tastebase instead.",
            ]
          : [
              "Open a recipe first",
              "Go to a recipe on any site, then click the Tastebase icon or press Alt+Shift+T.",
            ];
    element("not-a-page-title").textContent = title;
    element("not-a-page-text").textContent = text;
    show("not-a-page");
    return;
  }

  preview = page.preview;
  if (preview.found) {
    renderRecipe(preview);
    renderSaved(saved);
  } else {
    show("no-recipe");
  }
}

async function showSetup() {
  element("setup-address").value = displayAddress(await getSavedAddress());
  element("setup-error").hidden = true;
  element("footer").hidden = true;
  show("setup");
  element("setup-address").focus();
}

function setBusy(button, label) {
  button.disabled = true;
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");
  button.replaceChildren(spinner, label);
}

async function save(button) {
  const original = [...button.childNodes];
  showError("");
  setBusy(button, "Opening Tastebase…");
  for (const other of [saveButton, saveAnywayButton]) other.disabled = true;

  const response = await chrome.runtime
    .sendMessage({
      type: SAVE_MESSAGE,
      tabId: tab.id,
      imageUrl: preview?.imageUrl ?? null,
    })
    .catch(() => null);

  if (response?.ok) {
    window.close();
    return;
  }
  button.replaceChildren(...original);
  button.disabled = false;
  for (const other of [saveButton, saveAnywayButton]) other.disabled = false;
  showError(response?.error ?? "Something went wrong. Try again.");
}

saveButton.addEventListener("click", () => save(saveButton));
saveAnywayButton.addEventListener("click", () => save(saveAnywayButton));
element("retry-button").addEventListener("click", load);

// Saving while signed out sends the user through sign-in, which returns to
// the import page, where the waiting recipe is handed over.
element("sign-in-button").addEventListener("click", () => {
  if (preview) {
    save(element("sign-in-button"));
    return;
  }
  chrome.tabs.create({ url: `${origin}/auth/sign-in` });
  window.close();
});

settingsButton.addEventListener("click", () => {
  if (settingsButton.getAttribute("aria-pressed") === "true") {
    load();
  } else {
    showSetup();
  }
});

element("setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const setupError = element("setup-error");
  const next = toOrigin(element("setup-address").value);
  if (!next) {
    setupError.textContent = "That doesn't look like a web address.";
    setupError.hidden = false;
    return;
  }
  connect(next).then((granted) => {
    if (granted) {
      load();
      return;
    }
    setupError.textContent =
      "Chrome needs your permission to open Tastebase at that address.";
    setupError.hidden = false;
  });
});

load();
