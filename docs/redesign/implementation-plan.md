# Redesign implementation plan

Companion to [the design system](../design-system.md). This covers every page, component and the layout/UX changes, not just a re-skin.

Mockups: `docs/mockups/market-crate.html`, `docs/mockups/market-crate-recipe.html`.

---

## Progress (2026-10-16)

| Phase | Status |
| --- | --- |
| 0 Foundations | Done |
| 1 App shell and navigation | Done (sidebar, top bar, mobile tab bar, account menu, ⌘K palette) |
| 2 Recipes library | Done |
| 3 Recipe page, cook mode, scaling, cook tracking | Done |
| 4 Add a recipe and the single editor | Done |
| 5 Home and house activity | Done |
| 6 Tags, Settings, Storage, Templates | Done |
| 7 Auth, system pages, skeletons | Done |
| 9 Clean-up | Done. Migrations now run on start (`src/instrumentation.ts`); session settings split into `security-sessions.tsx` and `delete-account.tsx`; `recipe_modifications` records edits and feeds the activity list; README updated |

Migrations added by the redesign: `0017_add_recipe_swatch`, `0018_add_recipe_cooks`.

## 1. Scope in one paragraph

We replace the generic dashboard with a household-recipe app. It gets a leek sidebar and a mobile tab bar, a real **Recipes** library (today `/recipes` just redirects to `/search`), and a **Home** that shows what the house is cooking instead of four stat boxes. The recipe page becomes a coloured hero plus a three-column cooking layout (today it's six stacked cards). Create and edit merge into **one editor** (today they're two forms of 754 and 627 lines). **Add a recipe** becomes a single paste-a-link-first flow. **Settings** gets a side nav and absorbs Storage and Templates. Every remaining component is restyled to the new tokens, and the old design docs are replaced.

---

## 2. Decisions (confirmed 2026-10-15)

| # | Decision | Outcome |
| --- | --- | --- |
| D1 | Spelling | **Canadian English** in all UI copy and user-visible URLs (`/recipes/favourites`). Code identifiers stay as they are |
| D2 | Let cooks choose a recipe's colour (adds a `recipes.swatch` column) or always derive it from the id | **Add the column**: a nullable column is cheap, and choosing a colour gives people a sense of ownership |
| D3 | Note templates: keep as a top-level nav item or move into Settings | **Move to Settings → Note templates**: it's set up once and rarely visited |
| D4 | Mobile navigation: bottom tab bar or keep the hamburger sheet | **Bottom tab bar**: one-thumb reach, and Add is always visible |
| D5 | New behaviour (servings scaling, cook mode, cook tracking, activity feed, household list) | **Include now**: built inside the phases that own each screen (scaling + cook mode in 3, activity + "Not made in a while" in 5). Phase 8 no longer exists as a separate phase |
| D6 | Dark mode | **Keep it**: tokens are defined in the design system and the theme defaults to system |

---

## 3. Information architecture

### Routes: before → after

| Route | Today | After |
| --- | --- | --- |
| `/` | Welcome text + 4 stat boxes | **Home**: featured recipe, "In the house" (recently added by others), "Pick up where you left off" (your recent), activity |
| `/recipes` | Redirects to `/search` | **Library**: search, filters, cards/list view. This is the main place to browse |
| `/search` | Search page | Redirects to `/recipes` (keeping the query string) |
| `/recipes/search` | Legacy redirect to `/search` | Redirects to `/recipes` |
| `/recipes/favorites` | Separate list page | Redirects to `/recipes/favourites` |
| `/recipes/favourites` | — | Library view: same `RecipeLibrary` with `scope=favourites` |
| `/recipes/recent` | Separate list page | Library view with `scope=recent` (list view by default) |
| `/recipes/tags` | Stat cards + tag cards | **Tags**: grid of swatch tag tiles with counts |
| `/recipes/tags/[id]` | Tag detail page | Redirects to `/recipes?tag=<id>` (the library shows a tag header chip) |
| `/recipes/[slug]` | 6 stacked cards | **Recipe**: hero + ingredients / method / house rail |
| `/recipes/[slug]/edit` | Edit form inside a header card | **Editor** (shared with new) |
| `/recipes/new` | Tabs: Import / Manual | **Add a recipe**: link first, then text or photo, or "write it yourself" → editor |
| `/recipes/[slug]/cook` | — | **Cook mode** (new, Phase 3) |
| `/settings` | Tabs: Profile, AI, Data, Preferences, Security | Side nav: Profile, Household, Units, Import & AI, Note templates, Storage, Security (`?section=`) |
| `/storage` | Orphan page (not in nav) | Redirects to `/settings?section=storage` |
| `/templates` | Top-level page | Redirects to `/settings?section=templates` |
| `/auth/*` | Centred card | Split screen: produce panel + form |

### Navigation

- **Sidebar:** Home, Recipes (count), Favourites (count), Recent, Tags. Quick picks: Under 30 min, Top rated, Easy. Household avatars. **Add a recipe**.
- **User menu** (avatar, top right): name and email, Settings, Note templates, Theme (Light/Dark/System), Sign out.
- **Mobile tab bar:** Home, Recipes, **+**, Favourites, Me (opens the user menu sheet).
- **⌘K** opens the command palette from anywhere; the top-bar search field opens it too.

---

## 4. Bugs and debt to fix along the way

| Found | Where | Fix (phase) |
| --- | --- | --- |
| Quick-access links `?filter=quick`, `?filter=top-rated`, `?filter=easy` are ignored, so the filter never applies | `dashboard-layout.tsx`, `lib/search/recipe-search.ts` | Implement as real library params (`maxTime=30`, `sort=rating`, `difficulty=easy`) (P2) |
| Tag colours never render: classes built at runtime (`` bg-${colorClass}/20 ``) | `lists/recipe-tags-list.tsx` | Static swatch class map (P6) |
| No font loaded: `Inter` is named in CSS, but nothing loads it | `app/layout.tsx`, `globals.css` | `next/font` Bricolage Grotesque (P0) |
| Two theme toggles | `ui/theme-toggle.tsx`, `theme/theme-toggle.tsx` | Keep one, inside the user menu (P1) |
| Two storage UIs (`/storage` page and the Settings "Data" tab) | `cards/storage-overview.tsx` + `forms/storage-settings-form.tsx` vs `cards/storage-stats-display.tsx` | One Storage section in Settings (P6) |
| Create and edit forms duplicated (~1,400 lines) | `forms/recipe-create-form.tsx`, `forms/recipe-edit-form.tsx` | One `RecipeEditor` (P4) |
| Cuisine/difficulty option lists duplicated | `layout/recipe-search-header.tsx`, `forms/inline-filter-bar.tsx` | Move to `lib/utils/recipe-constants.ts` (P2) |
| Error page claims "Our team has been notified" (self-hosted, nobody is) | `app/error.tsx` | Rewrite copy (P7) |
| Hard-coded colours (`fill-yellow-400`, difficulty colours) | `cards/recipe-card.tsx`, `ui/rating-display.tsx` | Tokens (P2/P3) |
| `use-debounced-search` hook unused | `hooks/` | Use it in the library search or delete it (P2) |
| Images card shows "No images yet" to everyone | `cards/recipe-detail-view.tsx` | Remove; the hero handles the no-photo case (P3) |
| Recipe author not shown on the recipe page (needed for "Priya's recipe") | `getRecipeBySlug` | Join the user name and include it (P3) |
| Inline template skeleton inside a page file | `app/(dashboard)/templates/page.tsx` | Moves with templates into Settings, with a proper skeleton component (P6) |

---

## 5. Phases

Each phase is one PR (or a small stack), leaves the app fully working, and ends with `pnpm run type-check`, `pnpm run lint`, `pnpm run test` and `pnpm run health-check:quick` green. Screens are checked in light, dark and at 390px.

### Phase 0: Foundations (tokens, type, primitives)

**Goal:** the new look exists as tokens and base components. Pages change appearance automatically where they already use ShadCN variables.

1. **Fonts:** load Bricolage Grotesque with `next/font/google` in `app/layout.tsx` (variable `--font-bricolage`, `display: swap`). Remove the Inter, Source Serif and JetBrains declarations from `globals.css`.
2. **Tokens:** rewrite `:root` and `.dark` in `globals.css` with the values from design-system §2. Add the paper/ink/leek/turmeric/swatch variables, type scale, radius tokens and the single floating shadow. Remove unused shadow variables.
3. **Enums and types** (`lib/types/index.ts`): `RecipeSwatch`, `ChipVariant`, `PanelTone`, `AvatarSize`, `LibraryScope` (`all | favourites | recent`), `SettingsSection`. Add `ButtonVariant.ACCENT`.
4. **Utilities:** `lib/utils/swatches.ts` (`SWATCH_CLASSES`, `swatchFor(id)`, `memberSwatch(userId)`) with unit tests (stable hash, distribution, every swatch has static classes). `lib/utils/time-formatting.ts`: add `formatTotalTime` ("1 h 10") and `formatRelativeDay`, with tests.
5. **Restyle ShadCN primitives** (`components/ui/`): `button` (variants and sizes from §8, new `accent`), `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `tabs` (as segmented control), `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `tooltip`, `badge` (status only), `skeleton`, `separator`, `scroll-area`, `progress`, `sonner`, `alert`, `label`, `kbd`, `card` (kept for settings forms; borderless white with `rounded-tile`), `collapsible`, `avatar`.
6. **New primitives:** `ui/chip.tsx` (filter/fact/tag), `ui/panel.tsx`, `ui/member-avatar.tsx` + `ui/member-avatar-stack.tsx`, `ui/empty-state.tsx`, `ui/segmented-control.tsx`, `ui/circle-motif.tsx`, `ui/swatch-picker.tsx` (used by the editor).
7. **Data (D2):** add the nullable `swatch` text column to `recipes` in `db/schema.recipes.ts`. Run `pnpm run db:generate`, then extend the Zod schemas in `lib/validations/` and the create/update actions. Map `recipeTags.color` values to swatch keys in a migration (unknown values → null → hashed).
8. **Docs:** move `docs/redesign/design-system.md` to `docs/design-system.md` and replace `docs/design-patterns.md` with the patterns section. Update the design system quick reference in `CLAUDE.md` (colour examples, spacing, typography).

**Done when:** a temporary `/_kitchen-sink` page (deleted at the end of the phase) shows every primitive in both themes, and the swatch tests pass.

### Phase 1: App shell and navigation

**Goal:** new sidebar, top bar, mobile tab bar and command palette on every authenticated page.

| File | Change |
| --- | --- |
| `layout/dashboard-layout.tsx` (337 lines) | Split into `layout/app-shell.tsx` (grid, providers, palette state), `navigation/app-sidebar.tsx`, `navigation/app-topbar.tsx`, `navigation/mobile-tab-bar.tsx` and `navigation/nav-items.ts` (config). Remove the duplicate header search, the separators and the "Add Recipe" button in the header (it lives in the sidebar and tab bar). Content area `max-w-[1360px] px-5 lg:px-9 py-7`. |
| `app/(dashboard)/layout.tsx` | Fetches the session, nav counts (recipes, favorites) and household members, each streamed (`Suspense` around the sidebar footer and counts). |
| `app/page.tsx` | Stops rendering its own `DashboardLayout`. Move it into `(dashboard)/page.tsx` so it shares the group layout (Home lives at `/`). |
| `auth/user-menu.tsx` | Avatar trigger (member swatch). Menu: name and email, Settings, Note templates, Theme submenu, Sign out. Remove "Recipe Chef". |
| `theme/theme-toggle.tsx`, `ui/theme-toggle.tsx` | Merge into a `ThemeMenu` submenu plus a standalone icon toggle for auth pages. Delete the duplicate. |
| `theme/theme-provider.tsx` | No visual change. Check the default is system. |
| `modals/global-search-modal.tsx`, `global-search-input.tsx`, `global-search-results.tsx`, `global-search-result-card.tsx` | Restyle as the command palette (design system §8). Add the empty state with recent searches and quick actions. Results use `RecipeRow` (small) with swatch dots, grouped "Yours" / "From the house". Keep `use-global-search` and `use-keyboard-shortcuts`. |
| `skeletons/` | `app-sidebar-skeleton.tsx` for streamed counts and avatars. |

New server action: `getHouseholdMembers()` in `lib/server-actions/household-actions.ts` (id, name, initial, swatch; no emails). The sidebar uses it, and later filters and Settings.

**Done when:** every existing page renders inside the new shell; the tab bar works at 390px; ⌘K opens the palette, ↑↓/Enter navigate and Esc closes.

### Phase 2: Recipes library (`/recipes`, favorites, recent, search)

**Goal:** one library component powers all collections, with working filters.

| File | Change |
| --- | --- |
| `app/(dashboard)/recipes/page.tsx` | Becomes the library page: `PageHeader` "Recipes" + `RecipeLibraryToolbar` + `Suspense(RecipeLibraryResults)`. |
| `app/(dashboard)/search/page.tsx`, `recipes/search/page.tsx` | Redirect to `/recipes` with params. |
| `app/(dashboard)/recipes/favorites/page.tsx` | Becomes a redirect to `/recipes/favourites`. |
| `app/(dashboard)/recipes/favourites/page.tsx` (new), `recent/page.tsx` | Render the same library with `scope`. Title only, no icon, no subtitle. |
| `layout/recipe-search-header.tsx` (292) | Replace with `forms/recipe-library-toolbar.tsx`: a big search field (debounced with `use-debounced-search`), filter chips (Cook = member avatars, Time ≤ 30/60, Difficulty, Cuisine select, Tag), sort select, Cards/List segmented control, and "Only mine / Shared / Private" chips. Search history moves into the search field's dropdown. |
| `forms/inline-filter-bar.tsx`, `forms/active-filter-chips.tsx` | Fold into the toolbar. Active filters show as filled chips with ×, plus "Clear all". Delete both files. |
| `lists/recipe-search-results.tsx` | Becomes `lists/recipe-library-results.tsx`: count line ("18 recipes"), tile grid or row list, empty states per scope, "Load more" pagination (today it's capped with no pagination UI; verify in `recipe-search.ts`). |
| `lists/recipe-favorites-list.tsx`, `lists/recipe-recent-list.tsx` | Delete; replaced by the library with scope. Keep their server actions. |
| `cards/recipe-card.tsx` (194) | Replace with `cards/recipe-tile.tsx` (design system §8) and `lists/recipe-row.tsx`. Delete the old card after the last usage moves (tag detail, favorites, recent, search). |
| `lib/search/recipe-search.ts` | Add `scope`, `author` (user id), `maxTotalMinutes`, sort by rating; return `swatch`, hero image, author name/id, favourite flag. Fix the quick-pick params. |
| `lib/utils/recipe-constants.ts` | Single source for cuisine, difficulty and sort options (with enums). |
| `skeletons/recipe-card-skeleton.tsx`, `recipe-search-results-skeleton.tsx`, `recipe-search-header-skeleton.tsx` | Replace with `recipe-tile-grid-skeleton.tsx`, `recipe-row-list-skeleton.tsx` and `recipe-library-toolbar-skeleton.tsx`. |

URL is the source of truth for filters (`?q=&tag=&author=&difficulty=&cuisine=&maxTime=&sort=&view=`), so quick picks and tag links are plain links.

**Done when:** all quick picks filter correctly; favorites, recent and tag views share one component; there's no layout shift between the skeleton and the grid; list view works on mobile.

### Phase 3: Recipe page

**Goal:** the cooking-first layout from `market-crate-recipe.html`.

| File | Change |
| --- | --- |
| `app/(dashboard)/recipes/[slug]/page.tsx` | Same data flow. Wraps `RecipeHero` and `RecipeBody` in separate Suspense boundaries if the body needs extra fetches. Remove the `container mx-auto` wrapper (the shell owns the width). |
| `cards/recipe-detail-view.tsx` (444) | Split up: `cards/recipe-hero.tsx`, `layout/recipe-body.tsx` (3-column grid), `cards/recipe-house-rail.tsx`, `modals/delete-recipe-dialog.tsx`. Remove the images card, the duplicate metadata card and the badge counts. The unit-toggle reset moves into the ingredients panel header. |
| `recipes/recipe-metadata.tsx` (202) | Delete. Prep, cook, difficulty and rating become fact pills in the hero; cuisine and source move to the rail. |
| `recipes/image-gallery.tsx` | Hero photo in the circle. Extra photos show as a thumbnail strip under the hero, opening the existing lightbox (restyled). |
| `recipes/ingredient-list.tsx` | Rebuild as an ingredient panel (design system §8): ticks persisted in `sessionStorage` per recipe, group headings, optional flag, unit-toggle per row kept (`ui/ingredient-display.tsx`, `ui/modern-unit-display.tsx` restyled). |
| `recipes/instruction-steps.tsx` | Rebuild as step blocks with swatch discs, time and temperature pills (`ui/temperature-display.tsx` restyled), group headings. |
| `recipes/recipe-tags.tsx` | Tag chips linking to `/recipes?tag=`. |
| `cards/recipe-notes-section.tsx`, `lists/recipe-notes-list.tsx`, `forms/recipe-note-form.tsx` | House rail: note bubbles (`cards/note-bubble.tsx`), an "Add a note" button opening a compact composer (textarea, optional rating stars, "Only me" toggle), and the template picker as a small menu. Edit and delete via the bubble's menu (the dialogs are restyled). |
| `forms/note-templates.tsx` (365) | Becomes `modals/note-template-picker.tsx` (a popover list); template management moves to Settings in P6. |
| `ui/recipe-favorite-button.tsx` | `secondary` button "Save" / "♥ Saved" with the scale feedback. |
| `ui/rating-display.tsx` | Ink stars, no yellow; compact variant for fact pills. |
| `ui/visibility-badge.tsx` | Copy: "Only you" badge, shown only when private. |
| `lib/server-actions/recipe-actions.ts` → `getRecipeBySlug` | Include author name/id and `swatch`. |
| `skeletons/recipe-detail-skeleton.tsx` (219) | Rebuild to the hero + 3-column shape (smaller). |

**New behaviour (separate commits after the restyle):**

1. **Servings scaling:** the stepper in the ingredients panel scales amounts (`hooks/use-servings-scale.ts`). Parse fractions and ranges in `lib/utils/recipe-utils.ts`, with tests for "1/2", "1 ½", "2-3", "a pinch" (left as-is) and unit-toggled values. The scaled serving count shows in the panel header; reset returns to the recipe's own value.
2. **Cook mode** `/recipes/[slug]/cook` (`app/(dashboard)/recipes/[slug]/cook/page.tsx`, `layout/cook-mode.tsx`, `cards/cook-step.tsx`, `skeletons/cook-mode-skeleton.tsx`): full screen with the sidebar hidden and a swatch-coloured top band. One step at a time in `text-display`, an ingredient drawer (sheet) with the same ticks, per-step timers from `timeMinutes` (with a toast plus sound when done, respecting reduced motion), Screen Wake Lock API with a fallback note, ←/→ keys and swipe, and **Finish** on the last step. "Start cooking" in the hero links here.
3. **Cook tracking:** a new `recipe_cooks` table (`id`, `recipe_id`, `user_id`, `cooked_at`) and `recordRecipeCook()` in `lib/server-actions/recipe-cook-actions.ts`, called by **Finish** in cook mode and by a "Mark as cooked" item in the hero's "…" menu. The hero facts show "Cooked 6 times · last by Theo, Tue". This feeds Home in Phase 5.

**Done when:** a recipe with no photo, one photo and many photos all look intentional; ticks survive a refresh; the page works at 390px (ingredients in a collapsible panel above the method); non-owners don't see Edit or Delete; scaling ×½/×2 gives correct amounts; cook mode works by keyboard and touch and records a cook.

### Phase 4: Add a recipe and the editor

**Goal:** one path in, one editor.

| File | Change |
| --- | --- |
| `app/(dashboard)/recipes/new/page.tsx` | Title "Add a recipe". Shows `forms/add-recipe-start.tsx`: a large link field with an **Import** button, and below it three options: "Paste text", "Photo of a page", "Write it yourself". |
| `forms/recipe-creation-workflow.tsx` | Rewrite as a small state machine: `start → importing → review(editor prefilled) → saved`. No tabs. |
| `forms/recipe-import-form.tsx`, `forms/recipe-url-input.tsx`, `forms/recipe-image-upload.tsx` | Restyle and fold into `add-recipe-start`. Keep "Recent links" under the link field (from `recipe-url-input`). Show import progress as a checklist (fetch → found recipe → read ingredients and steps → photo), using the progress the import pipeline already reports, or staged client states if it doesn't. |
| `cards/recipe-import-preview.tsx` | Delete. The prefilled editor is the preview, with a banner: "Imported from seriouseats.com, check it over and save." |
| `forms/recipe-create-form.tsx` (754), `forms/recipe-edit-form.tsx` (627) | Replace with `forms/recipe-editor/` (split to stay under ~300 lines each): `recipe-editor.tsx` (layout, section nav, save bar), `editor-basics.tsx` (title, description, servings/prep/cook/difficulty/cuisine), `editor-ingredients.tsx` (rows with drag handle, group headings, "Paste a list" using `lib/import/text-recipe-parser.ts`), `editor-method.tsx` (steps with time/temperature), `editor-photos.tsx` (`ui/recipe-image-manager.tsx` + `recipe-images/image-upload.tsx` restyled; set hero), `editor-details.tsx` (tags, source, colour via `ui/swatch-picker.tsx` with a live tile preview), `editor-visibility.tsx` (radio cards "Shared with the house" / "Only you"). |
| `hooks/use-auto-save.ts`, `lib/server-actions/recipe-draft-actions.ts` | Use them in both create and edit: "Draft saved 12 seconds ago" in the save bar. |
| `app/(dashboard)/recipes/[slug]/edit/page.tsx` | Remove the "Edit Recipe" card. Render `RecipeEditor` with a "← Back to recipe" link. |
| `skeletons/recipe-form-skeleton.tsx` | Rebuild to the editor shape. |

Editor layout: a 200px sticky section nav (Basics, Ingredients, Method, Photos, Details, Visibility) and a fluid form column. A sticky save bar at the bottom (mobile) or top-right (desktop) with **Save recipe** and the draft status. Validation errors scroll to the field and mark the section in the nav.

**Done when:** create, import (link, text, photo) and edit all use the same editor; the old forms are deleted; drafts restore after a reload; keyboard-only entry of a full recipe works.

### Phase 5: Home

**Goal:** a useful landing page.

| Section | Data | Component |
| --- | --- | --- |
| Greeting + search | session | `layout/home-header.tsx` ("Evening, Priya", using local time) |
| Featured | newest recipe added by someone else in the last 14 days, or else a random favourite, or else the newest | `cards/home-feature.tsx` (turmeric/swatch hero, "Start cooking", "Open recipe") |
| In the house | 8 latest shared recipes from others | tile grid (`RecipeTile`) |
| Pick up where you left off | your 6 most recently viewed | `RecipeRow` list |
| Not made in a while | shared recipes whose last cook (from `recipe_cooks`, Phase 3) is oldest; recipes never cooked fall back to `createdAt` | `RecipeRow` list with "5 months" |
| Around the house | notes, imports, favourites from others | `lists/house-activity.tsx` |

- `cards/dashboard-stats.tsx` and `skeletons/dashboard-stats-skeleton.tsx`: delete. `lib/server-actions/dashboard-stats-actions.ts`: replace with `home-actions.ts` (`getHomeFeed`).
- Each section gets its own Suspense and skeleton (`home-feature-skeleton.tsx`, reusing the tile grid and row list skeletons).
- **House activity** (`lib/server-actions/activity-actions.ts` → `getHouseActivity()`, `lists/house-activity.tsx`, `skeletons/house-activity-skeleton.tsx`): a merged, time-sorted feed of others' shared recipes added, notes left (the private notes of others excluded), favourites and cooks (`recipe_cooks`). Show the latest 8 with relative days. The unused `recipeModifications` table is either wired into this feed as "edited" events or dropped in Phase 9. Decide when building the feed, based on whether anything writes to it.
- **Not made in a while** (`getForgottenRecipes()` in `home-actions.ts`): shared recipes ordered by oldest last cook.
- First-run empty state (no recipes on the instance): one large panel, "Your collection is empty", with **Add your first recipe** and **Import from a link**.

### Phase 6: Tags, Settings, Storage, Templates

**Tags**

| File | Change |
| --- | --- |
| `lists/recipe-tags-list.tsx` (237) | Tag tiles in a 4-column grid: swatch (from `tag.color` mapped, or hashed), tag name in `text-tile`, count, and three recipe titles as a preview. Remove the stats cards and the broken dynamic classes. Group by `tag.category` only if more than one category exists. |
| `lists/recipe-tag-detail.tsx` | Delete; the route redirects to `/recipes?tag=`. |
| `skeletons/recipe-tags-skeleton.tsx` | Rebuild to the tag tile shape. |
| `lib/server-actions/recipe-tags-actions.ts` | `getTagStats` returns per-tag preview titles. |

**Settings** (`app/(dashboard)/settings/page.tsx`, `forms/settings-tabs.tsx` → `layout/settings-shell.tsx`)

- Side nav (`navigation/settings-nav.tsx`) driven by `?section=`. On mobile it becomes a select. Remove the PageHeader stats ("Member since", "Days active"), the breadcrumb and the "Back to Home" action.
- Sections and their components:
  - **Profile:** `forms/profile-form.tsx`, `forms/password-form.tsx` restyled, plus an avatar preview with your member colour.
  - **Household** (new, read-only): member list with avatars and recipe counts (`getHouseholdMembers`).
  - **Units:** `forms/unit-preferences-form.tsx` as radio cards with a live preview line.
  - **Import & AI:** `forms/ai-settings-form.tsx`, `forms/ai-provider-form.tsx` restyled. Copy explains that import works without AI.
  - **Note templates:** `lists/template-list.tsx`, `cards/template-card.tsx`, `forms/template-form.tsx` moved here (rows instead of cards; the edit form in a sheet). The `/templates` route redirects.
  - **Storage:** merge `cards/storage-stats-display.tsx`, `cards/storage-overview.tsx` and `forms/storage-settings-form.tsx` into one `cards/storage-panel.tsx` (usage bar split DB/images, counts, recalculate action). Delete the other two and redirect `/storage`.
  - **Security:** `forms/security-settings-form.tsx` (478) split into `security-sessions.tsx` and `danger-zone.tsx`, restyled; the delete-account dialog uses the destructive pattern.
- `layout/page-header.tsx`: rewrite to the simple design-system §7.2 header (title, intro, actions, children slot). Remove the stats and breadcrumbs props after migrating usages. `layout/section.tsx`: becomes the panel header pattern or is replaced by `Panel`.
- `skeletons/ai-settings-skeleton.tsx`, `page-skeletons.tsx`, `storage-overview-skeleton.tsx`: rebuild or delete to match.

### Phase 7: Auth, system pages, skeleton sweep

| File | Change |
| --- | --- |
| `app/(public)/auth/sign-in/page.tsx`, `sign-up/page.tsx`, `reset-password/page.tsx` | New `layout/auth-shell.tsx`: on desktop, a left leek panel with the logo, "The recipes your house actually cooks." and a stack of three sample swatch tiles; on the right, the form on paper. On mobile, the form only, with the logo. |
| `auth/sign-in-form.tsx`, `sign-up-form.tsx`, `password-reset-form.tsx`, `reset-password-token-form.tsx` | Restyle with the new inputs and buttons, remove Card wrappers, and update copy. In sign-up, move unit preferences behind "Set units now (optional)" or drop them for Settings defaults. |
| `app/error.tsx`, `global-error.tsx` | Empty-state pattern: "That page didn't load", **Try again**, "Back to recipes". Error message and digest shown only in development. No support or "team" copy. |
| `app/not-found.tsx` | "We couldn't find that recipe or page", **Back to recipes**. Remove the 404 badge, alert and double 404. |
| `app/loading.tsx` | Logo drop pulse on paper (static with reduced motion). |
| All of `skeletons/` | Final pass: every skeleton matches its component's new shape and radius. Delete any that are no longer used (`pnpm run unused-code`). |

### Phase 8: (folded into Phases 3 and 5)

Per D5, the new behaviour is built with the screens that own it:

- **Phase 3:** servings scaling, cook mode, cook tracking (`recipe_cooks`).
- **Phase 5:** house activity feed, "Not made in a while".
- **Phase 1/6:** household list (`getHouseholdMembers`), already part of those phases.

### Phase 9: Clean-up and QA

- Delete dead files flagged in this plan; run `pnpm run unused-code:verbose`, `import-issues`, `architecture` and `code-quality`.
- `pnpm run large-files`: the editor, settings and recipe page splits keep files under ~300 lines.
- Accessibility pass: keyboard through every page, screen-reader labels on icon buttons, colour-contrast spot checks in both themes, zoom to 200%.
- Responsive pass at 390, 768, 1024 and 1440.
- Update the README screenshots and the Docker Hub description if they show the UI.

---

## 6. Complete inventory

Action key: **R** restyle only · **RB** rebuild (new structure, same job) · **M** merge into another · **D** delete · **N** new · **K** keep logic, no visual change.

### Pages (`src/app`)

| File | Phase | Action |
| --- | --- | --- |
| `layout.tsx` | 0 | R (font, metadata copy) |
| `page.tsx` | 1/5 | RB → Home under `(dashboard)` |
| `loading.tsx` | 7 | R |
| `error.tsx`, `global-error.tsx` | 7 | RB |
| `not-found.tsx` | 7 | RB |
| `(dashboard)/layout.tsx` | 1 | RB (app shell, streamed counts) |
| `(dashboard)/recipes/page.tsx` | 2 | RB (library) |
| `(dashboard)/recipes/favorites/page.tsx` | 2 | RB → redirect |
| `(dashboard)/recipes/favourites/page.tsx` | 2 | N (library scope) |
| `(dashboard)/recipes/recent/page.tsx` | 2 | RB (library scope) |
| `(dashboard)/recipes/search/page.tsx` | 2 | K (redirect target → `/recipes`) |
| `(dashboard)/search/page.tsx` | 2 | RB → redirect |
| `(dashboard)/recipes/tags/page.tsx` | 6 | RB |
| `(dashboard)/recipes/tags/[id]/page.tsx` | 6 | RB → redirect |
| `(dashboard)/recipes/[slug]/page.tsx` | 3 | RB |
| `(dashboard)/recipes/[slug]/edit/page.tsx` | 4 | RB |
| `(dashboard)/recipes/[slug]/cook/page.tsx` | 3 | N |
| `(dashboard)/recipes/new/page.tsx` | 4 | RB |
| `(dashboard)/settings/page.tsx` | 6 | RB |
| `(dashboard)/storage/page.tsx` | 6 | RB → redirect |
| `(dashboard)/templates/page.tsx` | 6 | RB → redirect |
| `(public)/auth/sign-in/page.tsx` | 7 | RB |
| `(public)/auth/sign-up/page.tsx` | 7 | RB |
| `(public)/auth/reset-password/page.tsx` | 7 | RB |

### Components

| File | Phase | Action |
| --- | --- | --- |
| **auth/** | | |
| `sign-in-form.tsx` | 7 | R |
| `sign-up-form.tsx` | 7 | R + simplify |
| `password-reset-form.tsx` | 7 | R |
| `reset-password-token-form.tsx` | 7 | R |
| `user-menu.tsx` | 1 | RB |
| **cards/** | | |
| `dashboard-stats.tsx` | 5 | D |
| `recipe-card.tsx` | 2 | D → `recipe-tile.tsx` (N) |
| `recipe-detail-view.tsx` | 3 | RB → `recipe-hero.tsx` (N), `recipe-house-rail.tsx` (N) |
| `recipe-import-preview.tsx` | 4 | D |
| `recipe-notes-section.tsx` | 3 | M → house rail |
| `storage-overview.tsx` | 6 | M → `storage-panel.tsx` (N) |
| `storage-stats-display.tsx` | 6 | M → `storage-panel.tsx` |
| `template-card.tsx` | 6 | RB (row) |
| `home-feature.tsx` | 5 | N |
| `note-bubble.tsx` | 3 | N |
| **forms/** | | |
| `active-filter-chips.tsx` | 2 | M → library toolbar |
| `inline-filter-bar.tsx` | 2 | M → library toolbar |
| `recipe-library-toolbar.tsx` | 2 | N |
| `ai-provider-form.tsx` | 6 | R |
| `ai-settings-form.tsx` | 6 | R |
| `note-templates.tsx` | 3 | RB → `modals/note-template-picker.tsx` |
| `password-form.tsx` | 6 | R |
| `profile-form.tsx` | 6 | R |
| `recipe-create-form.tsx` | 4 | D → `recipe-editor/*` (N) |
| `recipe-edit-form.tsx` | 4 | D → `recipe-editor/*` |
| `recipe-creation-workflow.tsx` | 4 | RB |
| `add-recipe-start.tsx` | 4 | N |
| `recipe-image-upload.tsx` | 4 | M → add-recipe-start |
| `recipe-import-form.tsx` | 4 | M → add-recipe-start |
| `recipe-url-input.tsx` | 4 | R (used by add-recipe-start) |
| `recipe-note-form.tsx` | 3 | RB (compact composer) |
| `security-settings-form.tsx` | 6 | RB (split) |
| `settings-tabs.tsx` | 6 | D → `layout/settings-shell.tsx` (N) |
| `storage-settings-form.tsx` | 6 | M → storage-panel |
| `template-form.tsx` | 6 | R (in sheet) |
| `unit-preferences-form.tsx` | 6 | RB (radio cards) |
| **layout/** | | |
| `dashboard-layout.tsx` | 1 | RB → `app-shell.tsx` (N) |
| `index.ts` | 1 | K (update exports, `@/` paths) |
| `page-header.tsx` | 6 (started in 2) | RB |
| `recipe-search-header.tsx` | 2 | D → library toolbar |
| `section.tsx` | 6 | M → Panel |
| `recipe-body.tsx`, `home-header.tsx`, `auth-shell.tsx`, `settings-shell.tsx` | 3/5/7/6 | N |
| **lists/** | | |
| `recipe-favorites-list.tsx` | 2 | D (library scope) |
| `recipe-recent-list.tsx` | 2 | D (library scope) |
| `recipe-search-results.tsx` | 2 | RB → `recipe-library-results.tsx` |
| `recipe-notes-list.tsx` | 3 | RB (bubbles) |
| `recipe-tag-detail.tsx` | 6 | D |
| `recipe-tags-list.tsx` | 6 | RB |
| `template-list.tsx` | 6 | RB |
| `recipe-row.tsx`, `house-activity.tsx` | 2/5 | N |
| **modals/** | | |
| `global-search-modal.tsx` | 1 | RB (palette) |
| `global-search-input.tsx` | 1 | R |
| `global-search-results.tsx` | 1 | RB |
| `global-search-result-card.tsx` | 1 | D → `recipe-row` (small) |
| `delete-recipe-dialog.tsx`, `note-template-picker.tsx` | 3 | N |
| **navigation/** (new directory) | | |
| `app-sidebar.tsx`, `app-topbar.tsx`, `mobile-tab-bar.tsx`, `nav-items.ts`, `settings-nav.tsx` | 1/6 | N |
| **recipe-images/** | | |
| `image-upload.tsx` | 4 | R |
| **recipes/** | | |
| `image-gallery.tsx` | 3 | RB |
| `ingredient-list.tsx` | 3 | RB |
| `instruction-steps.tsx` | 3 | RB |
| `recipe-metadata.tsx` | 3 | D |
| `recipe-tags.tsx` | 3 | R |
| **skeletons/** | | |
| `ai-settings-skeleton.tsx` | 6 | R |
| `dashboard-stats-skeleton.tsx` | 5 | D |
| `index.ts` | all | K (exports) |
| `page-skeletons.tsx` | 6 | RB |
| `recipe-card-skeleton.tsx` | 2 | RB → tile grid skeleton |
| `recipe-detail-skeleton.tsx` | 3 | RB |
| `recipe-form-skeleton.tsx` | 4 | RB |
| `recipe-search-header-skeleton.tsx` | 2 | RB → toolbar skeleton |
| `recipe-search-results-skeleton.tsx` | 2 | RB → row/tile skeletons |
| `recipe-tags-skeleton.tsx` | 6 | RB |
| `storage-overview-skeleton.tsx` | 6 | RB |
| new: `app-sidebar-skeleton`, `home-feature-skeleton`, `recipe-hero-skeleton`, `settings-section-skeleton` | 1–6 | N |
| **theme/** | | |
| `theme-provider.tsx` | 1 | K |
| `theme-toggle.tsx` | 1 | M (single toggle) |
| **ui/** (ShadCN base) | | |
| `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `input`, `kbd`, `label`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `tabs`, `textarea`, `tooltip`, `visually-hidden` | 0 | R |
| **ui/** (custom) | | |
| `category-badge.tsx` | 6 | D if only used by the tags list (1 usage), else R |
| `ingredient-display.tsx`, `modern-unit-display.tsx`, `temperature-display.tsx` | 3 | R |
| `loading.tsx` | 7 | R (7 usages; check each still needs a spinner) |
| `rating-display.tsx` | 3 | R (tokens) |
| `recipe-favorite-button.tsx` | 3 | R |
| `recipe-image-manager.tsx` | 4 | R |
| `theme-toggle.tsx` | 1 | M |
| `visibility-badge.tsx` | 3 | R (copy) |
| new: `chip`, `panel`, `member-avatar`, `member-avatar-stack`, `empty-state`, `segmented-control`, `circle-motif`, `swatch-picker` | 0 | N |

### Hooks

| Hook | Action |
| --- | --- |
| `use-auto-save.ts` | K; used by both editor modes (P4) |
| `use-debounced-search.ts` | K; used by the library search (P2), currently unused |
| `use-global-search.ts`, `use-keyboard-shortcuts.ts` | K |
| `use-ingredient-unit-toggle.ts` | K |
| new `use-ingredient-ticks.ts` | N (P3; sessionStorage-backed) |
| new `use-servings-scale.ts` | N (P3) |

### Server and lib changes

| File | Change | Phase |
| --- | --- | --- |
| `db/schema.recipes.ts` + migration | `recipes.swatch` nullable; tag colour → swatch keys | 0 |
| `lib/validations/*` | Allow `swatch` | 0 |
| `lib/server-actions/household-actions.ts` | N: `getHouseholdMembers` | 1 |
| `lib/search/recipe-search.ts` | Scope, author, max time, rating sort, extra fields | 2 |
| `lib/utils/recipe-constants.ts` | Shared option lists + enums | 2 |
| `lib/server-actions/recipe-actions.ts` | Author on `getRecipeBySlug`, swatch on create/update | 3/4 |
| `lib/server-actions/home-actions.ts` | N: `getHomeFeed` | 5 |
| `lib/server-actions/dashboard-stats-actions.ts` | D | 5 |
| `lib/server-actions/recipe-tags-actions.ts` | Preview titles per tag | 6 |
| `lib/server-actions/storage-actions.ts` | K (check the storage panel needs nothing new) | 6 |
| `lib/server-actions/activity-actions.ts` | N | 5 |
| `db/schema.recipes.ts` → `recipe_cooks` table + `lib/server-actions/recipe-cook-actions.ts` | N | 3 |

---

## 7. Testing

- **Unit (Vitest):** `swatches.ts` (stability, all keys mapped), time formatting, quick-pick → search-param mapping, recipe-search filters (scope, author, maxTime, sort), servings scaling, cook tracking, house activity query.
- **Component tests:** RecipeTile (photo vs no photo, private badge, author), filter toolbar (URL sync), editor section validation, ingredient ticks persistence, note bubble owner actions.
- **Existing tests:** run after each phase; update snapshots and selectors where structure changed, but don't delete coverage.
- **Manual script** (each phase): light/dark × 390/1024/1440; keyboard only; reduced motion; a recipe with no photo and no description; a 60-character title; 0, 1 and 200 recipes.

---

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| Swatch tiles get loud at scale (48+ recipes) | Tiles with photos show colour only in the band; list view is one click away and remembered per user (`view` param + localStorage) |
| Bricolage Grotesque on low-DPI Windows at 13px | Meta never goes below 13.5px/600; check before Phase 2 |
| The editor merge breaks import prefill | The editor takes one `RecipeDraft` shape; import, create and edit all map into it, with tests on the mapping (`lib/utils/recipe-import-mapping.ts` already exists) |
| Redirects break bookmarks | Every removed route redirects and keeps query params |
| New behaviour makes Phases 3 and 5 large | Each new behaviour is its own commit inside the phase, after the restyle commits, so it can be reviewed separately |

---

## 9. Suggested order and size

| Phase | Depends on | Rough size |
| --- | --- | --- |
| 0 Foundations | — | M |
| 1 Shell | 0 | M |
| 2 Library | 0, 1 | L |
| 3 Recipe page + cook mode | 0, 1 (tile not needed) | XL |
| 4 Add + editor | 0, 3 (hero/tile preview) | XL |
| 5 Home + activity | 2 (tile, row), 3 (cook tracking) | L |
| 6 Tags, Settings | 0, 1, 2 | L |
| 7 Auth, system | 0 | S |
| 9 Clean-up | all | S |

Phases 3 and 6–7 can run in parallel with 2 once 0 and 1 are merged.
