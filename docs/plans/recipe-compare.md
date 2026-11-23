# Compare recipes

Put two to four versions of a dish side by side and see how they differ.

## The problem

The library collects the same dish from several places: Kenji's cookies, the NYT's cookies, a family card. Choosing between them means opening tabs and doing unit conversions in your head. Two cups of flour and 250 g look different but aren't. A recipe for 24 and one for 36 can't be compared amount by amount at all.

## What it answers

1. **How are these different?** Which ingredients only one version uses, and where the amounts really differ.
2. **Which one suits tonight?** Time, effort, number of ingredients, and which one the house has cooked and liked.
3. **How do the methods differ?** The steps, side by side.

## Principles

- **Line ingredients up.** Two pages next to each other leave the comparing to you. One row per ingredient, one column per recipe.
- **Make the numbers comparable.** Scale every version to the same servings and show them in one unit system.
- **Differences stand out, matches stay quiet.** Small bars in each recipe's swatch colour show relative amounts. A filter hides rows where the versions agree.
- **Columns carry the recipe's colour.** Each recipe keeps its swatch everywhere on the page, so columns need no labels after the header.
- **No new tables.** The comparison lives in the URL, so it can be shared, bookmarked and reached with Back.

## Page: `/recipes/compare?r=slug-a,slug-b`

```
← All recipes

Compare                                   [+ Add a recipe]
3 versions, scaled to serve 4

[ − Serves 4 + ]  [Metric | Imperial]  (Only differences)

┌─────────────┬──────────────┬──────────────┬──────────────┐
│             │ ███ TOMATO   │ ███ LEEK     │ ███ SKY      │  swatch tiles: photo,
│             │ Food Lab's   │ NYT Chewy    │ Grandma's    │  title, source, ✕
│             │ Serious Eats │ NYT Cooking  │ Reece        │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ At a glance                                              │
│ Total time  │ 1 h 10 min   │ 45 min ·fast │ 1 h          │
│ Ingredients │ 11           │ 9 · fewest   │ 12           │
│ Steps       │ 7            │ 5            │ 6            │
│ Difficulty  │ Medium       │ Easy         │ —            │
│ Rating      │ 4.5 ★        │ —            │ 5.0 ★        │
│ Cooked      │ 3 times      │ Never        │ Once         │
├─────────────┴──────────────┴──────────────┴──────────────┤
│ Ingredients                                              │
│ In all 3                                                 │
│ Butter      │ 113 g ▬▬▬    │ 225 g ▬▬▬▬▬▬ │ 170 g ▬▬▬▬   │
│  Up to 2×   │ unsalted     │              │ softened     │
│ Flour       │ 142 g ▬▬▬▬▬  │ 140 g ▬▬▬▬▬  │ 2 cups       │
│ Only in some                                             │
│ Ice cube    │ 1            │ —            │ —            │
├──────────────────────────────────────────────────────────┤
│ Method       one column of steps per recipe              │
└──────────────────────────────────────────────────────────┘
```

### Header

- Same back link and page header pattern as the other pages. The subtitle states the scaling ("scaled to serve 4"), so nobody mistakes scaled amounts for the original ones.
- **Add a recipe** (outline button, hidden at four) opens the picker.

### Controls

- **Servings stepper**, like the one on the recipe page. It starts at the first recipe's servings. Every column gets `target / its own servings`. A recipe without a serving count isn't scaled, and its column says "Not scaled: no serving count".
- **Metric / Imperial** segmented control. It starts at the user's preference, like the ingredient panel.
- **Only differences** filter chip. It hides ingredient rows where every version agrees within 10%, and shows "4 matching ingredients hidden".

### Photos

- When any recipe has a photo, a row of photos sits above the tiles, like a cover for each column: the main photo (fixed height, cropped), then up to four thumbnails of the recipe's other photos, with "+N" on the last one. Every photo opens the lightbox with all of that recipe's photos.
- A recipe without a photo gets a block in its swatch colour with the circle motif, so the row stays even.
- Step photos appear under their steps in the method columns.

### Column headers

- One swatch tile per recipe (`rounded-tile`, swatch background): a small round photo if there is one, the title (links to the recipe), source name or author, and an ✕ to remove it.
- When the servings are scaled, the tile shows "Written for 24".
- With one recipe chosen, an outlined "Add a recipe to compare" tile fills the second slot. With none chosen, the page shows an empty state with the same action.

### At a glance

Rows: total time, prep, cook, written for, difficulty, ingredients, steps, rating, cooked. Quickest total time, fewest ingredients and fewest steps get bold type and a "quickest" or "fewest" caption. There's no highlight when the values tie or only one recipe has a value.

### Ingredients

- **Two sections**: *In both / In all N* first, then *Only in one / In some*. A section with no rows is hidden.
- Within a section, rows follow the first recipe's order, then the next recipe's, so they read like a recipe.
- **Row label**: the cleaned shared name ("Butter").
- **Each cell**: the scaled, converted amount (from `displayIngredientAmount`, so the numbers match the recipe page). Underneath goes the name as written plus notes, when they add something ("unsalted, softened"). A missing ingredient shows a quiet "—".
- **Amount bars**: when every amount in a row converts to the same kind of measure (weight, volume, or a count of the same thing), each cell gets a thin bar in its recipe's swatch colour, sized against the row's largest amount. Amounts that can't be compared ("to taste", "1 can" vs "400 g") get no bars.
- **Difference caption**: rows whose comparable amounts differ by 25% or more get "Up to 2× more" under the label, with a turmeric dot.

### Method

- One column per recipe, steps numbered as on the recipe page, group names shown, temperatures converted to the user's unit. On desktop the columns sit side by side and top-aligned. On phones the columns scroll sideways and snap to each one.

### Picker

- A dialog: "Add a recipe to compare".
- With an empty search box it shows **suggestions**: visible recipes whose titles share a meaningful word with the recipes already chosen. "Recipe", "best", "the", "easy" and similar words don't count. Suggestions are ranked by overlap and the most similar come first. Search box on top, then results. Recipes already in the comparison are left out.

### Ways in

1. **Recipe page**: "Compare with…" in the ⋯ menu opens the picker. Choosing a recipe goes to `/recipes/compare?r=this,that`.
2. **Compare page**: Add a recipe, and remove one.
3. (Phase 2) **Library**: select several recipes, then a "Compare 3" bar.

### Mobile

- Under `lg` the whole table scrolls sideways in one container. The label column is sticky on the left, and each recipe column is at least 9.5rem wide, so two recipes fit on a phone without scrolling.
- The controls wrap. The stepper and the units control keep 44px touch targets.

### Loading and errors

- The page checks the session, then streams the comparison in Suspense with a skeleton the same shape as the page.
- Slugs that don't exist or aren't visible are dropped. The page then shows "1 recipe couldn't be found or is private."
- Duplicate slugs collapse into one. Anything after four is ignored.

## Matching ingredients (`src/lib/utils/ingredient-matching.ts`)

Each ingredient gets two keys:

- **Strict key**: lowercased name with the main phrase only (before a comma or bracket), quotes and amounts in the name removed, and the last word made singular ("eggs" → "egg", "tomatoes" → "tomato", "leaves" → "leaf").
- **Loose key**: the strict key, minus preparation and size words (large, fresh, chopped, minced, softened, unsalted, packed, extra-virgin, kosher, light, dark…), with synonyms joined (all-purpose and plain flour; icing, powdered and confectioners' sugar; white and granulated sugar; scallion, green onion and spring onion; cilantro and coriander; and so on).

Recipes are matched in order. For each ingredient: take the first row this recipe hasn't filled whose strict key matches, otherwise one whose loose key matches, otherwise start a new row. So a recipe never fills one row twice: "light soy sauce" and "dark soy sauce" in one recipe stay separate rows.

Words that change what the ingredient is (peanut butter vs butter, egg yolk vs egg, brown sugar vs sugar) are never stripped, so they never match.

## Comparable amounts (`src/lib/utils/recipe-compare.ts`)

For each cell, convert the scaled amount to one kind of measure:

- **weight**: g, kg, oz, lb, plus volume × `gramsPerCup` when the ingredient's density is known (so 2 cups of flour ≈ 250 g lines up with 250 g)
- **volume**: tsp, tbsp, cup, ml, l, fl oz…
- **count**: no unit, or the same counting unit (eggs, cloves)

A range uses its midpoint. A row is comparable when every filled cell has the same kind. Weight wins when every cell can become a weight. Then the spread is max ÷ min.

## Files

| File | What |
| --- | --- |
| `src/app/(dashboard)/recipes/compare/page.tsx` | Session check, reads `?r=`, Suspense |
| `src/lib/server-actions/recipe-compare-actions.ts` | `getRecipesToCompare(slugs)`, `searchRecipesToCompare(query, excludeIds)` |
| `src/lib/utils/ingredient-matching.ts` | Name keys |
| `src/lib/utils/recipe-compare.ts` | Rows, comparable amounts, glance facts |
| `src/lib/types/recipe-compare-types.ts` | Types |
| `src/components/layout/recipe-compare.tsx` | Client page: controls state, sections |
| `src/components/cards/compare-recipe-header.tsx` | Swatch column tiles and the add tile |
| `src/components/cards/compare-recipe-photos.tsx` | Photo row and lightbox per column |
| `src/components/lists/compare-glance-table.tsx` | At a glance |
| `src/components/lists/compare-ingredient-table.tsx` | Ingredient rows and bars |
| `src/components/lists/compare-method-columns.tsx` | Steps |
| `src/components/modals/compare-recipe-picker.tsx` | Picker dialog with suggestions |
| `src/components/skeletons/recipe-compare-skeleton.tsx` | Loading |
| `src/components/modals/recipe-actions-menu.tsx` | "Compare with…" |
| Tests | `ingredient-matching.test.ts`, `recipe-compare.test.ts` |

## Phases

**Phase 1 (now):** everything above except selecting in the library.

**Phase 2:**
- Select several recipes in the library, then a "Compare" bar
- Drag to rematch a row, or split one, when the automatic match is wrong (kept in the URL)
- "Cook this one" on each column, and "Add to list"
- A "Compare" link in the search results when several titles match

**Later, maybe:** merge the best parts into a new recipe, and remember recent comparisons.

## Risks

- **Bad matches.** Short synonym and descriptor lists, no fuzzy guessing, and tests built from real pairs. A missed match costs an extra row, and a wrong match is worse, so the rules stay cautious.
- **Scaling recipes without a serving count.** Show those amounts as written and say so.
- **Wide tables on phones.** Sticky labels and snapping columns, with the 2-recipe case fitting without scrolling.
