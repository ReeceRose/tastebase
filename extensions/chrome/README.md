# Save to Tastebase (Chrome extension)

Brings the recipe you're looking at into your Tastebase, photo included. Your
browser has already loaded the page, so this works on sites that block
Tastebase's own link import (Serious Eats, Allrecipes and the other People
Inc. sites) and on subscriber sites you're signed in to, like NYT Cooking.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this `extensions/chrome` folder.
3. A setup page opens. Enter the address you use for Tastebase, for example
   `localhost:3000`, and allow access when Chrome asks.
4. Pin the extension: click the puzzle piece in the toolbar, then the pin.

Works the same way in other Chromium browsers (Edge, Brave, Arc).

## Use

Open a recipe and click the Tastebase icon, or press **Alt+Shift+T**. The
popup shows the recipe it found: photo, title, site, ingredient and step
counts. Click **Save to Tastebase** (or press Enter) and Tastebase opens with
everything filled in, so you can check it before saving. The recipe's main
photo is already attached, and the other photos from the page (step shots,
close-ups) are under **Photos** for you to pick from.

If someone in your Tastebase already saved the recipe, the popup says who and
when, and offers to open it (you can still save another copy).

The popup also tells you when something needs fixing first: Tastebase isn't
running, or the page has no recipe Tastebase can read directly (you can still
send the page and it picks out what it can). If you're signed out, **Sign in
and save** takes you through sign-in and the recipe comes along.

Use the gear in the popup to change the Tastebase address.

## How it works

1. When the popup opens it reads the page's recipe data (JSON-LD) for the
   preview, and checks your Tastebase session.
2. On save, it copies the page without scripts, styles or media, and
   collects the photos in the recipe content. It skips navigation, sidebars,
   author photos, ads, shop products and anything small, then downloads the
   photos in your browser and shrinks them.
3. It opens `/recipes/new?from=extension` on your Tastebase and hands both
   over through a browser event (`src/hooks/use-extension-page-import.ts`).
4. Tastebase parses the page with the same import used for links and saves
   the main photo. The other photos stay in the page until you pick them, so
   only the ones you keep are stored. If the browser couldn't fetch a photo,
   Tastebase tries to download it itself.

On your Tastebase's own pages, a tiny script (`presence.js`) sets a
`data-tastebase-extension` attribute so **Add a recipe** knows the extension
is installed and points you to it instead of suggesting you install it. It
only runs on the Tastebase address you connected.

Nothing is sent anywhere except your own Tastebase. The extension only reads
a page when you open the popup on it.
