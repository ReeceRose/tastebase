# Tastebase design system: "Market Crate"

Status: **in effect** from Phase 0 of the redesign (October 2026). The rollout plan, page by page, is in [redesign/implementation-plan.md](./redesign/implementation-plan.md). Screens not yet migrated still use the old structure but already pick up these tokens.

Visual reference: `docs/mockups/market-crate.html` (library) and `docs/mockups/market-crate-recipe.html` (recipe page).

---

## 1. What we're designing for

Tastebase is a recipe collection shared by a small group: a household, some flatmates, a cooking club. Everyone on the instance can see each other's public recipes and add notes to them.

The current UI is a generic admin dashboard: grey cards, icon-and-label everywhere, every page a stack of identical bordered boxes. It works, but nothing in it says "this is *our* kitchen".

The redesign has three jobs:

1. **Make the collection feel owned.** Every recipe has a colour, every cook has a face, and notes from the house are visible.
2. **Make the next step obvious.** Each screen has one primary action: choose something to cook, cook it, or add a new recipe.
3. **Cut the chrome.** Remove cards around cards, duplicated metadata, decorative icons and empty sections.

### Principles

| Principle | In practice |
| --- | --- |
| **Colour is identity, not decoration** | Colour means something: a recipe's swatch, a cook's avatar, a tag. UI chrome stays neutral (paper, ink, leek). |
| **One loud thing per screen** | The recipe hero on a recipe page, the featured recipe on Home, the tile grid in the library. Everything around it is quiet. |
| **People before metadata** | "Priya's recipe" before "Created 2026-10-11". Notes from the house come before source URLs. |
| **Big type, few words** | Headings carry the page. Remove helper text that repeats the heading. |
| **Flat and solid** | No drop shadows on surfaces, no gradients. Depth comes from colour blocks and 2px ink outlines. |
| **Warm, plain voice** | "Add a recipe", "Shared with the house", "Nothing here yet". Never "Recipe Chef", never "Our team has been notified". |

---

## 2. Colour

### 2.1 Core palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `paper` | `#F1F3EC` | `#111A13` | Page background |
| `surface` | `#FFFFFF` | `#1A271C` | Panels, inputs, popovers |
| `ink` | `#172015` | `#EEF1E8` | Text, primary buttons, outlines |
| `ink-muted` | `#5D6657` | `#A3AD9C` | Secondary text (5.4:1 on paper light, 7.6:1 dark) |
| `line` | `#D9DDD0` | `#2C3B2E` | Hairlines between rows |
| `leek` | `#234A2F` | `#16301F` | Sidebar background |
| `leek-soft` | `#2F5A3A` | `#21402B` | Sidebar hover |
| `turmeric` | `#F4B400` | `#F4B400` | The single brand accent: "Add a recipe", focus in dark mode, highlights |
| `danger` | `#B42318` | `#F97066` | Destructive actions and errors |

Light-mode body text (ink on paper) is 15:1 and dark-mode is 15.6:1. The sidebar text `#E6EFDF` on leek is 8.5:1.

### 2.2 Swatches (recipe colours)

Every recipe has a **swatch**, one of eight produce colours. A swatch is a background plus a fixed text colour that passes WCAG AA for body text (≥ 4.5:1). Swatches look the same in light and dark mode, because they are self-contained colour fields.

| Swatch | Background | Text | Contrast | Deep tone (circle motif) |
| --- | --- | --- | --- | --- |
| `tomato` | `#D63A25` | white | 4.68 | `#A82A18` |
| `leek` | `#3C6B45` | white | 6.21 | `#8CC152` |
| `aubergine` | `#4D2463` | white | 12.0 | `#7A3B98` |
| `beet` | `#9E1F4F` | white | 7.60 | `#EF7FA0` |
| `turmeric` | `#F4B400` | ink | 9.07 | `#E08A00` |
| `radish` | `#EF7FA0` | ink | 6.55 | `#D63A25` |
| `sky` | `#7CC4E6` | ink | 8.69 | `#FFE36E` |
| `herb` | `#8CC152` | ink | 7.87 | `#3C6B45` |

**How a recipe gets its swatch**

1. `recipes.swatch` (a new, nullable column) if the cook picked one in the editor.
2. Otherwise `swatchFor(recipe.id)`, a stable hash of the id modulo 8. A recipe never changes colour between visits.

**Where swatches appear:** recipe tiles, the recipe hero, the list-view colour dot, command-palette results, tag tiles, and step-number discs on the recipe page.

**Where they never appear:** buttons, navigation, form controls or page backgrounds. Swatches are reserved for content.

Code: `RecipeSwatch` enum in `src/lib/types/index.ts`, `SWATCHES` map and `swatchFor()` in `src/lib/utils/swatches.ts`. Classes are static (`bg-swatch-tomato text-swatch-tomato-fg`), never built from template strings at runtime. Tailwind can't detect runtime-built classes, which is why the current tag colours don't render.

### 2.3 Member colours

Each person on the instance gets a swatch from `swatchFor(user.id)` for their avatar. An avatar is the person's initial on their swatch. The same person always has the same colour, everywhere: tiles, notes, activity, filters.

### 2.4 Mapping to ShadCN variables

ShadCN components keep reading the standard variables. Only the values change.

| ShadCN var | Light | Dark |
| --- | --- | --- |
| `--background` | paper | paper |
| `--foreground` | ink | ink |
| `--card` / `--popover` | surface | surface |
| `--primary` / `--primary-foreground` | ink / white | ink (`#EEF1E8`) / `#111A13` |
| `--secondary` / `--secondary-foreground` | `#E4E8DC` / ink | `#243326` / ink |
| `--muted` / `--muted-foreground` | `#E9ECE2` / ink-muted | `#1F2C21` / ink-muted |
| `--accent` / `--accent-foreground` | turmeric / ink | turmeric / `#111A13` |
| `--destructive` | danger | danger |
| `--border` | line | line |
| `--input` | `#C9CFBF` | `#3A4B3C` |
| `--ring` | ink | turmeric |
| `--sidebar*` | leek family (see 2.1) | leek family |
| `--chart-1…5` | tomato, leek, turmeric, aubergine, sky | same |

New variables: `--swatch-{name}`, `--swatch-{name}-fg`, `--swatch-{name}-deep`, `--paper`, `--ink`, `--ink-muted`, `--leek`, `--turmeric`.

---

## 3. Typography

**One family: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)**, loaded with `next/font/google` (variable, `opsz` axis on, weights 400/600/800). Today `globals.css` names Inter, but nothing loads it, so the app falls back to the system sans.

The `opsz` axis does the work of a second typeface: large sizes get tight, chunky letterforms and small sizes stay open and readable. No serif and no mono. The only numbers that need alignment are ingredient amounts, which use `font-variant-numeric: tabular-nums`.

| Token | Size / line height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-hero` | 72 / 0.92 (mobile 44) | 800 | -0.04em | Recipe title on the recipe page |
| `text-display` | 56 / 0.95 (mobile 40) | 800 | -0.035em | Home featured recipe |
| `text-title` | 40 / 1.0 (mobile 32) | 800 | -0.03em | Page titles (Recipes, Tags, Settings) |
| `text-heading` | 26 / 1.1 | 800 | -0.02em | Section headings (Ingredients, In the house) |
| `text-tile` | 22 / 1.05 | 800 | -0.02em | Recipe tile titles, panel titles |
| `text-lead` | 17 / 1.5 | 400 | 0 | Recipe description, page intros |
| `text-body` | 15 / 1.5 | 400 | 0 | Default |
| `text-meta` | 13.5 / 1.4 | 600 | 0 | Times, counts, attribution |
| `text-caption` | 12 / 1.3 | 600 | 0 | Field hints, legend |

Rules:

- Sentence case everywhere. No all-caps labels (today the ingredient group headings use `uppercase tracking-wide`; remove it).
- Titles wrap with `text-wrap: balance`. Hero titles cap at `max-width: 12ch` so they break into two strong lines.
- Body copy stays under 70 characters per line (`max-w-prose` or `max-w-[60ch]`).
- Bold (`font-semibold`/600) is for meta and labels. Headings use 800, never 700.

---

## 4. Space, shape and depth

### Spacing

The 4px base is unchanged. These are the named steps used across layouts:

| Use | Value | Tailwind |
| --- | --- | --- |
| Page gutter | 36px desktop, 20px mobile | `px-5 lg:px-9` |
| Between page sections | 34px | `space-y-8` (32) for simplicity |
| Grid gap (tiles) | 16px | `gap-4` |
| Panel padding | 22px | `p-5.5` → use `p-6` |
| Inside tiles | 18px | `p-4.5` → use `p-5` |
| Field stack | 16px | `space-y-4` |

### Radius: size follows hierarchy

| Token | Value | Use |
| --- | --- | --- |
| `rounded-hero` | 28px | Recipe hero, home feature |
| `rounded-tile` | 22px | Recipe tiles, panels, note bubbles, dialogs |
| `rounded-control` | 14px | Buttons, inputs, selects, search |
| `rounded-sm` | 10px | Sidebar items, small menus |
| `rounded-full` | pill | Chips, filters, fact pills, avatars, step discs |

Note bubbles use `rounded-[20px_20px_20px_6px]`: the tail corner points at the author.

### Depth

- Surfaces have **no shadows**. Depth comes from colour (a white panel on paper, a swatch tile on paper).
- **Outlines** are 2px ink. Use them for things you interact with that sit on paper: the search field, filter chips, tag chips and the secondary button. Hairlines (`line`, 1–2px) separate rows inside panels.
- Only floating layers (popover, dropdown, dialog, toast, command palette) get one shadow token: `0 18px 40px -16px rgb(23 32 21 / 0.35)`.

---

## 5. Motion

- Default transition is 160ms `ease-out` on colour, background and transform. Nothing moves on its own.
- **Feedback motion only:** checking an ingredient (tick fills, row fades to 45%), saving a favourite (heart scales 1 → 1.15 → 1), opening a dialog (fade plus 8px rise).
- Tiles get no hover lift or shadow. Hover darkens the swatch by 6% (`brightness-95`), and keyboard focus shows a 3px ring.
- `prefers-reduced-motion`: all transforms off, colour changes stay.

---

## 6. Iconography

- Lucide, 2px stroke, `h-4 w-4` inline and `h-5 w-5` in the nav.
- **Text first:** drop icons that only repeat their label (the clock next to "Prep time", the chef hat beside every title, the book next to "Ingredients"). Keep icons where they stand in for a label (heart, search, more menu, close) or help scanning in the nav.
- The logo is a tomato "drop" (circle with one square corner) next to the wordmark. Remove `ChefHat` as the logo.

---

## 7. Layout

### 7.1 App shell

```
┌────────────┬──────────────────────────────────────────────┐
│ ● Tastebase│  [ Search 48 recipes…            ⌘K ]   (P) │
│            │                                              │
│ Home       │  Page title                      [ actions ] │
│ Recipes  48│                                              │
│ Favourites │  content…                                    │
│ Recent     │                                              │
│ Tags       │                                              │
│            │                                              │
│ Quick picks│                                              │
│ Under 30   │                                              │
│ Top rated  │                                              │
│ Easy       │                                              │
│            │                                              │
│ (M)(T)(P)(S│                                              │
│ [+ Add a   │                                              │
│   recipe ] │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** (236px, leek): logo, primary nav, "Quick picks" (saved library filters), household avatars, and the turmeric "Add a recipe" button pinned at the bottom. Templates and Settings leave the main nav and go in the user menu (see the plan).
- **Top bar** (in the content column, no border, sits on paper): a wide search field that opens the command palette, then the user avatar menu. The theme toggle moves into the user menu.
- **Mobile (< 1024px):** the sidebar is replaced by a bottom tab bar (Home, Recipes, a raised turmeric **+**, Favourites, Me). The top bar keeps search. No hamburger.
- Content max width: 1360px, left-aligned with the gutter (not centred), so pages line up with the sidebar.

### 7.2 Page anatomy

Every page uses the same `PageHeader`:

```
Title (text-title)                                 [secondary] [primary]
Optional one-line intro in ink-muted (only if it adds information)
[ filter chips / segmented control ]
```

- No icon beside the title, no breadcrumbs (except the recipe editor: "← Back to recipe"), no stats row.
- Detail pages (recipe) replace the PageHeader with a **hero**.

### 7.3 Grids

| Content | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Recipe tiles | 4 columns (`minmax(220px,1fr)` auto-fill) | 3 | 2 (compact tiles) |
| Recipe page | 360px ingredients / fluid method / 280px house rail | ingredients + method, rail below | single column, ingredients collapsible |
| Settings | 220px section nav / fluid form (max 720px) | same | nav becomes a select at the top |

---

## 8. Components

The rules below are the contract. File locations follow CLAUDE.md (`ui/` for primitives, `cards/`, `lists/` and so on for composed pieces).

### Buttons (`ui/button.tsx`, restyled)

| Variant | Look | Use |
| --- | --- | --- |
| `default` | ink fill, white text | The page's main action ("Start cooking", "Save recipe") |
| `accent` *(new)* | turmeric fill, ink text | Only "Add a recipe", once per screen |
| `secondary` | white fill, ink text | Actions that sit on a coloured surface (inside the hero) |
| `outline` | 2px ink outline, transparent | Secondary actions on paper |
| `ghost` | text only, muted hover | Toolbars, menus |
| `destructive` | danger fill | Confirm delete only, never the first click |

Sizes: `sm` 36px, `default` 44px, `lg` 52px. Radius `rounded-control`, weight 800, sentence case. Labels say what happens ("Save recipe", not "Submit"). Icon-only buttons need `aria-label`.

### Chips (`ui/chip.tsx`, new; replaces most `Badge` uses)

- **Filter chip:** pill, 2px ink outline, 600 weight. Selected = ink fill, white text. Use `aria-pressed`.
- **Fact pill:** white or `ink/10` fill, no outline. Shows a value plus a label ("30 min · Prep").
- **Tag chip:** 2px ink outline, links to `/recipes?tag=…`.
- `Badge` stays only for status ("Private"), drawn as a small `ink/15` pill on swatch backgrounds or a `muted` pill on paper.

### Inputs (`ui/input`, `textarea`, `select`, restyled)

White fill, 2px `--input` border, `rounded-control`, 48px tall, 15px text. On focus the border turns ink, plus a 3px ring (turmeric in dark mode). Labels sit above in `text-meta`. Hints and errors sit below in `text-caption`; errors are danger-coloured and start with what to do ("Add a title").

The primary search field uses a 2px ink border at rest, because it's a main entry point.

### Checkbox, radio, switch

- Checkbox: 20px, `rounded-[7px]`, 2px ink border. Checked = herb fill with an ink tick.
- Radio cards (visibility, units): a full-width card with a 2px border, ink border when selected. These replace bare radio rows.
- Switch: track ink when on.

### Segmented control (replaces most `Tabs` uses)

A pill-shaped track in `muted` with an ink pill under the selected item. Use it for view modes (Cards/List), units (Metric/Imperial) and import source (Link/Text/Photo). Real page sections (Settings) use the side nav, not tabs.

### Recipe tile (`cards/recipe-tile.tsx`, new; replaces `recipe-card.tsx`)

```
┌──────────────────────────┐   swatch background, rounded-tile, min-h 200
│ Charred leek &           │   title: text-tile, max 11ch, clamp 3 lines
│ white bean soup     ♥    │   favourite heart top-right if favourited
│                          │
│                     ◯◯◯  │   circle motif in the deep tone, bottom-right
│ 45 min  Private     (T)  │   meta: total time, Private badge, author avatar
└──────────────────────────┘
```

- **With a hero photo:** the photo fills the top 58% of the tile. Below it is a swatch band holding the title and meta, so the colour identity survives.
- The whole tile is one link. The heart isn't a separate button on the tile; you favourite from the recipe page or the tile's long-press menu on touch.
- Compact variant (mobile, two columns): min-height 150px, `text-[18px]` title.
- Search highlight: matching words get `bg-white/30 rounded px-0.5` on dark swatches and `bg-ink/10` on light ones.

### Recipe row (`lists/recipe-row.tsx`, new; list view)

One line per recipe: a 12px swatch dot, title (600), cook avatar, total time, difficulty, last opened. Row height 56px, hairline between rows. Use this for search results, Recent and dense views.

### Recipe hero (`cards/recipe-hero.tsx`, new)

A swatch block with `rounded-hero` and a two-column grid:

- **Left:** author line ("(P) Priya's recipe · shared with the house"), title in `text-hero`, description in `text-lead`, a row of fact pills (Prep, Cook, Difficulty, Rating), then the actions.
- **Right:** the hero photo clipped to a large circle, bleeding off the top-right corner. With no photo, it shows the plain circle motif in the deep tone.
- Actions (bottom-right on desktop, full width on mobile): `secondary` Edit (owner only), `secondary` Saved/Save (favourite toggle), `default` Start cooking, plus a `ghost` "…" menu (Share, Delete).

### Panels (`ui/panel.tsx`, new; replaces most `Card` uses)

A white surface with `rounded-tile`, `p-6` and no border. Header row: `text-heading` title on the left, an optional control on the right. Panels never nest inside panels or cards.

### Ingredient list (`recipes/ingredient-list.tsx`, rebuilt)

Rows are a 3-column grid: tick, amount (800, tabular), name (+ notes in ink-muted). Separate rows with a 2px `paper` divider. Checked rows fade to 45%. Group headings ("For the sauce") are `text-meta` ink-muted, sentence case. Optional ingredients get a trailing "optional" in ink-muted. The servings stepper sits in the panel header.

### Method steps (`recipes/instruction-steps.tsx`, rebuilt)

Each step is its own white `rounded-tile` block: a 44px number disc, the instruction (17px), and meta underneath (time, temperature) as fact pills. Disc colours cycle through the swatches starting from the recipe's own, so the method feels tied to the recipe. The "current step" (cook mode, Phase 8) gets a 3px ink outline.

### Note bubble (`cards/note-bubble.tsx`, new)

Coloured with the **author's** member swatch, using the bubble radius. Shows the avatar, name, optional star rating (★ in ink, 5-point) and the text. Private notes get a "Only you" badge. Your own notes show Edit and Delete in a "…" menu.

### Member avatar (`ui/member-avatar.tsx`, new)

Sizes 24, 30 and 44px. Shows the initial on the member swatch, in 800 weight. A stack of avatars overlaps by 8px with a 2px paper ring.

### Empty states (`ui/empty-state.tsx`, new)

A single circle motif (paper-deep), a `text-heading` line saying what's missing, one sentence saying what to do, and one button. For example: "No favourites yet" / "Tap the heart on any recipe to keep it here." / **Browse recipes**.

### Skeletons

Skeletons match the real shapes: tile-shaped blocks in `muted` with the same radius, a hero-shaped block on the recipe page. Use the `[0, 1, 2]` key pattern from CLAUDE.md. Pulse at 1.6s; with reduced motion, show static blocks.

### Feedback

- Toasts (sonner): ink background, white text, `rounded-control`, bottom-centre on mobile and bottom-right on desktop. The message names the result: "Saved to favourites", "Recipe deleted · Undo".
- Destructive confirms (AlertDialog): the title asks the question, the body states the consequence, and the button repeats the verb ("Delete recipe").
- Inline errors replace error cards. Full-page error and 404 screens use the empty-state pattern (see the plan).

### Command palette (`modals/global-search-modal.tsx`, restyled)

A white dialog with `rounded-tile`, 640px wide, and a large 2px-ink input at the top. With no query, it shows **recent searches** and **actions** (Add a recipe, Go to tags, Settings). Results are recipe rows with swatch dots, grouped into "Your recipes" and "From the house". Use ↑↓ and Enter to move and open, and Esc to close.

---

## 9. Patterns

| Situation | Pattern |
| --- | --- |
| Attribution | `(avatar) Priya` or "Priya's recipe". Show "You" for the current user. Never show raw emails. |
| Visibility | A recipe is "Shared with the house" or "Only you". Use the same words in the editor, the badge and toasts. Replace "Public/Private" in the UI copy, but keep `isPublic` in the code. |
| Times | `30 min`, `1 h 10`, `3 h 20`. Total time on tiles; prep and cook shown separately on the recipe page. |
| Counts | Plain numbers next to nav items and tags in ink-muted. No badges. |
| Dates | Relative within a week ("Yesterday", "Tue"), then "14 Oct", adding the year only if it isn't this year. |
| Loading | Suspense with a skeleton that matches the shape (CLAUDE.md). Never a centred spinner, except for the app-level `loading.tsx`. |
| Empty | The empty-state component with one action. |
| Errors | Say what happened and what to do. Don't apologise and don't mention "support" or "our team" (this is a self-hosted app). |

---

## 10. Accessibility checklist

- Every text/background pair in this document meets WCAG AA. Swatch text colours are fixed per swatch, so never pick a text colour by hand.
- Focus: a 3px ring on every interactive element (ink in light mode, turmeric in dark). Tiles show the ring outside their radius (`ring-offset-2 ring-offset-paper`).
- Hit targets of at least 44×44 on touch, including chips, steppers and the heart.
- Colour is never the only signal: Private has a text badge, a selected chip is filled and has `aria-pressed`, and a checked ingredient gets a tick and strike-through.
- `useId()` for every label/field pair (CLAUDE.md). Icon-only buttons need `aria-label`.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (theme defaults to system).

---

## 11. Voice

| Instead of | Write |
| --- | --- |
| Create New Recipe | Add a recipe |
| Import from a website or image, or create your recipe manually | (delete; the options speak for themselves) |
| Global Recipe Search | Search recipes |
| Recipe Chef | (delete) |
| Something went wrong! … Our team has been notified | That page didn't load. Try again, or go back to your recipes. |
| Public / Private | Shared with the house / Only you |
| Favorite Recipes — Your collection of go-to recipes and family favorites | Favourites |
| Color / Center / Organise | Colour / Centre / Organize |
| Clear Search | Clear search |
| Login to your account | Sign in to Tastebase |

**Spelling: Canadian English** in everything people read: favourite, colour, centre, flavour, metre/litre, catalogue, but organize/customize (-ize). User-visible URLs follow it (`/recipes/favourites`, with a redirect from `/recipes/favorites`). Code identifiers, database tables and existing server actions keep their current US names (`recipeFavorites`, `getUserFavoriteRecipes`); renaming them would only add churn.

---

## 12. Tailwind implementation sketch

```css
/* src/app/globals.css — additions inside @theme inline */
--font-sans: var(--font-bricolage), system-ui, sans-serif;

--text-hero: 4.5rem;     --text-hero--line-height: 0.92;   --text-hero--letter-spacing: -0.04em;
--text-display: 3.5rem;  --text-display--line-height: 0.95;
--text-title: 2.5rem;    --text-title--line-height: 1;
--text-heading: 1.625rem;--text-heading--line-height: 1.1;
--text-tile: 1.375rem;   --text-tile--line-height: 1.05;
--text-lead: 1.0625rem;  --text-meta: 0.84375rem; --text-caption: 0.75rem;

--radius-hero: 28px; --radius-tile: 22px; --radius-control: 14px;

--color-paper: var(--paper); --color-ink: var(--ink); --color-ink-muted: var(--ink-muted);
--color-leek: var(--leek); --color-turmeric: var(--turmeric);
--color-swatch-tomato: var(--swatch-tomato); --color-swatch-tomato-fg: var(--swatch-tomato-fg);
/* …repeat for each swatch… */
```

```ts
// src/lib/utils/swatches.ts
export const SWATCH_CLASSES: Record<RecipeSwatch, SwatchClasses> = {
  [RecipeSwatch.TOMATO]: { bg: "bg-swatch-tomato", fg: "text-swatch-tomato-fg", deep: "bg-swatch-tomato-deep" },
  // …
};
export function swatchFor(id: string): RecipeSwatch { /* stable hash % 8 */ }
```
