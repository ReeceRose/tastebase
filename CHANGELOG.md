# Changelog

Release notes for [Tastebase](https://github.com/ReeceRose/tastebase). This file is the
source of truth: `scripts/release.sh` writes each entry here, commits it, tags that
commit, and publishes the same text as the GitHub Release.

## v0.1.10 — 2026-11-08

Adding several photos from an imported recipe is now faster, and each photo in the full-size viewer shows its label.

### What's Changed

#### Features
- The full-size photo viewer now labels each photo with what it's tagged to, such as the finished dish, a step or an ingredient. When a recipe has more than one photo, the label sits next to the photo count.

#### Improvements
- When you add suggested photos from an imported recipe, Tastebase now downloads them several at a time instead of one by one, so adding a batch of photos takes much less time.
- Each photo is now processed into all its sizes at once, which makes saving it faster.
- Imported photos that are already web-ready are stored as they are, without being compressed a second time.

#### Fixes
- PNG and WebP uploads are now saved in their own format. Before, the stored file could be in a different format from the one its name and file type said.
- If an upload fails partway through, its resized copies are now deleted along with the original.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.10
```

## v0.1.9 — 2026-11-08

You can now tag each photo with what it shows: a step, an ingredient or the finished dish.

### What's Changed

#### Features
- **Photo tags:** in the recipe editor, mark a photo as showing a method step, an ingredient or the finished dish. Tag photos one at a time, or accept the suggested tags.
- **Step photos in recipes:** a photo tagged to a step appears next to that step on the recipe page and in cook mode.
- **Photo lightbox:** click a photo in the recipe's photo strip to see it full size.
- **Step photos on import:** if a site's recipe data includes photos for its steps, imported recipes now keep them with the right steps.

#### Improvements
- Updated the GitHub Actions used in CI.

Your database is updated with the new photo tag fields automatically. Existing photos keep their place and start out untagged.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.9
```

## v0.1.8 — 2026-11-07

A small release that lets you choose the order of a recipe's photos.

### What's Changed

#### Features
- **Reorder recipe photos**: In the recipe editor, you can now drag photos into the order you want. This sets which photo leads the recipe and the order the rest appear in.

#### Improvements
- Photo tiles in the editor have been rebuilt, making photos easier to manage while you edit a recipe.
- Photo order is now saved with the rest of the recipe when you save.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.8
```

## v0.1.7 — 2026-11-07

Recipes, people and tags now get more produce colours, and the recipe editor and sidebar keep up as you work.

### What's Changed

#### Features
- **More swatch colours**: there are new produce colours for recipes, members and tags, so fewer things end up sharing a colour.
- **Editor section tracking**: as you scroll through the recipe editor, the section nav shows which part you're in.
- **Live sidebar counts**: the recipe and list counts in the navigation change as soon as you add or remove something. You no longer need to reload the page.

#### Improvements
- Small layout fixes to the recipe photo strip.
- The design system docs now cover the new swatches.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.7
```

## v0.1.6 — 2026-11-07

Recipes can now have a video link, and pages show loading placeholders that match their final layout.

### What's Changed

#### Features
- **Recipe videos**: add an optional video link when you create or edit a recipe. YouTube and Vimeo links play right on the recipe page, and a YouTube link that includes a start time opens at that point. Links to other sites show up as a "Watch on …" link.

#### Fixes
- Loading placeholders now match the pages they stand in for: home, recipe library, recipe details, cook mode, the recipe form, settings and sign-in.
- The sidebar's recipe counts and quick picks no longer pop in after the page has loaded.

#### Improvements
- **Add a recipe** shows a loading screen that matches the start page. When you open it from a shared link or the browser extension, it says which site it's reading the recipe from.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.6
```

The update adds a database migration (the new video link column), which runs on start-up.

## v0.1.5 — 2026-11-07

This release swaps AI-assisted import for a faster, more reliable built-in parser, and makes setup simpler.

### What's Changed

#### Features
- Recipe import now reads microdata on sites that don't publish JSON-LD. If neither is there, it falls back to the page text, but only when the page looks like a recipe.
- Imported recipes show warnings for ingredient rows that may need a second look.

#### Fixes
- Fixed errors in recipe search queries.
- Ingredient lines that used to import badly now parse correctly. This covers mixed amounts, second measures like `flour (125 g)`, adjustments like "plus 2 tbsp", and notes.

#### Improvements
- The ingredient parser has been rebuilt and checked against about 1,900 real lines from around 30 recipe sites. Imported amounts now scale properly.
- Instructions are cleaned up better when they're imported.
- AI providers and AI recipe cleanup are gone. Any saved AI provider settings are removed when the database updates.
- Setup is simpler: the encryption key and AI environment variables are no longer needed. You can remove them from `.env` and `docker-compose.yml`.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.5
```

## v0.1.4 — 2026-11-07

Recipe library filtering by list, photos on list tiles, and tidier tags on imported recipes.

### What's Changed

#### Features
- Filter the recipe library by one of your lists, alongside the existing filters. The choice is saved in the URL, so filtered views can be bookmarked.
- List and favourites tiles now show a photo from one of their recipes. Tiles with no photos keep the existing look, with recipe titles and the colour motif.

#### Fixes
- Corrected the spacing around the logo in the sidebar.

#### Improvements
- Imported recipes get cleaner tags: keywords that only repeat an ingredient are dropped, while the site's own categories are kept. AI-assisted imports follow the same approach.
- The difficulty filter is now a compact dropdown instead of a row of chips.
- Updated dependencies, including Next.js, React, BetterAuth and the AI SDK.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.4
```

## v0.1.3 — 2026-11-07

A smoother recipe workflow, with sharing defaults, cleaner imports and more practical ingredient amounts.

### What's Changed

#### Features
- **Default recipe visibility:** Choose in Settings whether your new recipes start as public or private.
- **Structured recipe data:** Recipe pages now include JSON-LD, so tools that understand the format can read them.
- **Photo navigation:** Use the arrow keys to move between photos in the photo modal.

#### Fixes
- **Recipe import:** Ingredient lines are now parsed more reliably when importing recipes.

#### Improvements
- **Metric conversions:** Solid ingredients can now convert to grams using ingredient densities.
- **Faster builds:** CI and Docker builds have been reworked to run faster.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.3
```

## v0.1.2 — 2026-11-07

This release lets you close sign-ups, adds support for reaching Tastebase from more than one address, and makes recipe saves and unit conversions more reliable.

### What's Changed

#### Features
- Set `ALLOW_SIGN_UPS=false` to stop new accounts once everyone has joined. The first account always works.
- The Chrome extension can store a backup address, such as a LAN IP at home and Tailscale when you're away. The popup uses whichever one answers.
- New Tastebase website with a Docker setup guide: https://tastebase.reecerose.com

#### Fixes
- Recipe saves are more dependable, so a failure partway through is less likely to leave a recipe half-updated.
- Unit conversions and ingredient scaling are more accurate.
- Fixed "Invalid origin" sign-in errors on additional addresses. List them in `BETTER_AUTH_TRUSTED_ORIGINS`.
- Editing a recipe's title can no longer create a broken recipe link, and existing invalid links are repaired automatically when you update.

#### Improvements
- New bite logo, app icons and social preview image, plus refreshed copy.
- Added `.env.docker.example`, with every Docker setting explained.
- Expanded the deployment and troubleshooting docs, including Unraid and multi-address setups.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.2
```

## v0.1.1 — 2026-10-19

This release lets you find recipes by where they came from and makes the browser extension feel quicker.

### What's Changed

#### Features
- **Filter by source:** the recipe library has a new "Source" filter that lists every website and cookbook your recipes came from. Websites are grouped by domain, so `www.example.com` and `example.com` appear as one source.
- **Search by source:** the library search box now matches a recipe's source as well as its name, ingredients and notes.

#### Improvements
- The browser extension popup shows the recipe as soon as it reads the page, without waiting for your Tastebase server to reply. Whether you're signed in, and whether you've already saved the recipe, appear once the server answers.
- While the extension gathers photos, Tastebase now shows how many it has collected, so the import screen no longer looks stuck.
- The extension waits longer (15 seconds, up from 10) before giving up on a page with lots of photos.

#### Fixes
- When the server replied slowly, the extension popup could reset itself after you clicked save. It now stays put.
- The v0.1.0 release notes have been rewritten to be clearer.

### Docker

```bash
docker pull ghcr.io/reecerose/tastebase:0.1.1
```

## v0.1.0 — 2026-10-17

The first release of Tastebase: a self-hosted recipe collection that your household runs together in Docker.

### What's Changed

#### Features

- **A new look on every screen.** The "Market Crate" design gives each recipe and person a colour swatch. There's a sidebar with household avatars, a mobile tab bar and Cmd+K search.
- **Home page.** Shows a featured recipe, what's new in the house, recently opened recipes, household activity and recipes you haven't made in a while.
- **Recipe library.** Search, filter by cook, time, difficulty, cuisine, tag and visibility, sort, and switch between tiles and a list.
- **Recipe pages and cook mode.** Ingredients you can tick off, scaling and unit conversion, house notes, and a cook mode with step timers that keeps your screen awake.
- **Import without AI.** Paste a link, text or a photo. Tastebase reads recipe data from the page, parses text and runs local OCR, and uses AI only as an optional fallback.
- **Save to Tastebase Chrome extension.** Saves the recipe you're looking at, photos included, even from sites that block link import or need you to sign in.
- **Lists.** Private lists of recipes that only you can see.
- **Installable app.** Add Tastebase to your phone's home screen.

#### Fixes

- Other people's private notes and private recipes could appear on recipe pages and in search
- Favourites, recently viewed, drafts and photo uploads on the edit page didn't work
- Recipe links changed on every save, and cleared fields weren't saved
- Deleting an account did nothing
- Fixed the password reset flow

#### Improvements

- Saved AI keys are no longer sent to the browser. Link import refuses private and local network addresses.
- Database migrations run automatically when the container starts
- Removed AI chat and image generation to keep the app focused

### Docker

```
docker pull ghcr.io/reecerose/tastebase:0.1.0
```
