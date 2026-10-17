# Design patterns

How to build screens with the [design system](./design-system.md). Follow these patterns before writing anything new.

## Recipe colours

Never pick a colour by hand for recipe content. Resolve the recipe's swatch, then use the static class map:

```tsx
import { resolveSwatch, swatchClasses } from "@/lib/utils/swatches";

const swatch = resolveSwatch(recipe.id, recipe.swatch);
const classes = swatchClasses(swatch);

<div className={cn("rounded-tile p-5", classes.bg, classes.fg)}>…</div>
```

People get colours the same way:

```tsx
import { MemberAvatar } from "@/components/ui/member-avatar";

<MemberAvatar userId={recipe.userId} name={authorName} />
```

Never build class names from strings (`` `bg-${colour}` ``). Tailwind can't see them, so they never reach the CSS.

## Page header

```tsx
<header className="mb-8 flex flex-wrap items-end justify-between gap-4">
  <div>
    <h1 className="text-title">Recipes</h1>
    <p className="mt-2 text-muted-foreground">48 recipes from 4 cooks</p>
  </div>
  <Button variant={ButtonVariant.ACCENT} asChild>
    <Link href="/recipes/new">Add a recipe</Link>
  </Button>
</header>
```

- No icon next to the title, and no subtitle that repeats the title.
- The page's single primary action goes on the right.

## Sections on a page

Use `Panel` for white surfaces. Don't nest panels or cards.

```tsx
<Panel title="Ingredients" action={<ServingsStepper />}>
  <IngredientList … />
</Panel>
```

Sections that sit straight on paper (tile grids, lists) use a plain heading:

```tsx
<section className="space-y-4">
  <h2 className="text-heading">In the house</h2>
  <RecipeTileGrid … />
</section>
```

## Chips

```tsx
<Chip aria-pressed={active} onClick={toggle}>Under 30 min</Chip>
<Chip variant={ChipVariant.FACT}>30 min · Prep</Chip>
<Chip variant={ChipVariant.TAG} asChild>
  <Link href={`/recipes?tag=${tag.id}`}>{tag.name}</Link>
</Chip>
```

## View switches

Use `SegmentedControl` for switching views (Cards/List, Metric/Imperial). Use `Tabs` only when the panels are different content and the URL doesn't change.

## Empty states

```tsx
<EmptyState
  title="No favourites yet"
  description="Tap the heart on any recipe to keep it here."
  action={<Button asChild><Link href="/recipes">Browse recipes</Link></Button>}
/>
```

## Loading

Every async section sits in `Suspense` with a skeleton the same shape as the real content (CLAUDE.md has the key rules). Skeleton blocks use `rounded-tile` for tiles and panels, and `rounded-full` for chips and avatars.

## Buttons

| Situation | Variant |
| --- | --- |
| Main action on the page | `default` |
| "Add a recipe" | `accent` (once per screen) |
| On a swatch or hero background | `secondary` |
| Secondary on paper | `outline` |
| Toolbars and menus | `ghost` |
| Confirming a delete | `destructive` (inside the confirm dialog only) |

## Copy

Use Canadian English (favourite, colour, centre) in sentence case. Labels say what happens: "Save recipe", "Delete recipe", "Add a note". Toasts repeat the verb: "Recipe saved".
