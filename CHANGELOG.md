# Changelog

Release notes for [Tastebase](https://github.com/ReeceRose/tastebase). This file is the
source of truth: `scripts/release.sh` writes each entry here, commits it, tags that
commit, and publishes the same text as the GitHub Release.

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
