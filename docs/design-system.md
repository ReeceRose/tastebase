# TasteBase Design System

A comprehensive design system guide for maintaining consistency across the TasteBase recipe management application.

## Core Design Principles

### 1. Clean & Minimal
- **No heavy borders**: Use subtle borders and shadows
- **White space**: Generous spacing between elements
- **Focused content**: One primary action per interface
- **Clean card design**: Simple borders without excessive decoration

### 2. Theme-Aware
- **CSS Variables Only**: Never use hard-coded Tailwind colors
- **Automatic adaptation**: All colors work in light/dark modes
- **Semantic naming**: Colors describe purpose, not appearance
- **Consistent theming**: All components follow the same color system

### 3. Consistent Interactions
- **Predictable behavior**: Similar elements behave similarly
- **Smooth transitions**: 200ms duration for most interactions
- **Clear feedback**: Visual confirmation for all actions
- **Accessible states**: Proper focus, hover, and active states

### 4. ShadCN Component System
- **Always use ShadCN components**: Don't create custom UI components
- **Extend, don't replace**: Use className to customize, not recreate
- **Follow variants**: Use provided variants (default, secondary, outline, etc.)
- **Install missing components**: Use `npx shadcn@latest add <component>`

## Color System

### Background Colors
```css
/* Primary backgrounds */
bg-background      /* Main app background */
bg-card           /* Card and elevated surfaces */
bg-muted          /* Subtle background areas */
bg-popover        /* Dropdown and modal backgrounds */

/* Interactive backgrounds */
bg-primary        /* Primary action buttons */
bg-secondary      /* Secondary action buttons */
bg-accent         /* Accent areas and hover states */
bg-destructive    /* Error and delete actions */

/* Input backgrounds */
bg-input          /* Form input backgrounds */
```

### Text Colors
```css
/* Primary text */
text-foreground        /* Primary text color */
text-muted-foreground  /* Secondary text, descriptions */
text-card-foreground   /* Text on card backgrounds */

/* Interactive text */
text-primary          /* Links and primary actions */
text-secondary        /* Secondary action text */
text-accent           /* Accent text */
text-destructive      /* Error messages, delete actions */

/* Specific contexts */
text-popover-foreground  /* Text in dropdowns/modals */
```

### Border Colors
```css
border-border     /* Default borders (cards, inputs) */
border-input      /* Input field borders */
border-ring       /* Focus ring color */
border-muted      /* Subtle dividers */
```

### Interactive States
```css
/* Hover states */
hover:bg-primary/90        /* Primary buttons */
hover:bg-accent           /* Ghost buttons, clickable areas */
hover:bg-muted           /* Subtle interactive elements */

/* Focus states */
focus-visible:ring-ring/50     /* Focus rings */
focus-visible:border-ring      /* Focus borders */

/* Active states */
data-[state=checked]:bg-primary  /* Checkboxes, toggles */
```

## Typography Scale

### Headers
```css
text-3xl font-bold    /* Page titles */
text-2xl font-bold    /* Section headers */
text-xl font-semibold /* Subsection headers */
text-lg font-medium   /* Card titles */
```

### Body Text
```css
text-base   /* Emphasized body text */
text-sm     /* Standard body text (default) */
text-xs     /* Small text, metadata */
```

### Text Hierarchy
```css
text-foreground        /* Primary content */
text-muted-foreground  /* Secondary information */
font-medium           /* Emphasis within body text */
font-semibold         /* Strong emphasis */
```

## Spacing System

### Layout Spacing
```css
/* Page and section spacing */
space-y-8    /* Between major sections */
space-y-6    /* Between related sections */
space-y-4    /* Between components */
space-y-2    /* Between small elements */
space-y-1    /* Between tightly related items */

/* Padding */
p-6     /* Main content areas */
p-4     /* Card content */
p-3     /* Compact areas */
p-2     /* Tight spacing */

/* Margins */
mb-8    /* Section bottom margin */
mb-4    /* Component bottom margin */
mb-2    /* Element bottom margin */
```

### Component Spacing
```css
/* Gaps in flex/grid layouts */
gap-8    /* Large component gaps */
gap-6    /* Standard component gaps */
gap-4    /* Medium element gaps */
gap-2    /* Small element gaps */
gap-1    /* Tight element gaps */
```

## Component Guidelines

### Badges
Use Badge component with semantic variants:

```tsx
/* Status indicators */
<Badge variant="default">Public</Badge>
<Badge variant="outline">Private</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Error</Badge>

/* Sizing */
className="text-xs"     /* Small badges */
className="text-sm"     /* Standard badges */

/* Colors - NEVER use hardcoded colors */
❌ className="bg-green-600 text-white"
✅ <Badge variant="default">Status</Badge>
```

### Buttons
Use Button component with appropriate variants:

```tsx
/* Primary actions */
<Button variant="default">Save Recipe</Button>

/* Secondary actions */
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Edit</Button>

/* Subtle actions */
<Button variant="ghost">More Options</Button>

/* Destructive actions */
<Button variant="destructive">Delete</Button>

/* Link-style actions */
<Button variant="link">View Details</Button>

/* Sizes */
<Button size="sm">Small Action</Button>
<Button size="default">Standard Action</Button>
<Button size="lg">Large Action</Button>
<Button size="icon"><Icon /></Button>
```

### Cards
Use Card component for content grouping:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Recipe Name</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
</Card>

/* Card styling */
className="hover:shadow-md transition-shadow"  /* Interactive cards */
className="border-l-4 border-l-primary/20"    /* Accent cards */
```

### Form Controls
Always use ShadCN form components:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* Form structure */
<div className="space-y-2">
  <Label htmlFor="input-id">Label</Label>
  <Input id="input-id" placeholder="Enter value..." />
</div>
```

## Icon System

### Icon Sizes
```css
h-3 w-3    /* Tiny icons (in badges, small text) */
h-4 w-4    /* Standard inline icons */
h-5 w-5    /* Section header icons */
h-6 w-6    /* Large header icons */
h-8 w-8    /* Hero icons */
```

### Icon Colors
```css
text-muted-foreground  /* Default icon color */
text-primary          /* Active/selected icons */
text-destructive      /* Error/delete icons */
text-foreground       /* Emphasized icons */
```

### Icon Placement
```tsx
/* Left icon in buttons */
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>

/* Right icon in buttons */
<Button>
  Continue
  <ArrowRight className="h-4 w-4 ml-2" />
</Button>

/* Icon-only buttons */
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

## Animation & Transitions

### Standard Transitions
```css
transition-all duration-200    /* Default for interactive elements */
transition-colors             /* Color-only changes */
transition-opacity            /* Fade effects */
transition-transform          /* Scale/movement effects */
```

### Common Animations
```css
/* Hover effects */
hover:scale-105 transition-transform    /* Subtle scale on hover */
hover:shadow-lg transition-shadow       /* Shadow on hover */

/* Focus effects */
focus-visible:ring-2 focus-visible:ring-ring/50

/* Loading states */
animate-pulse    /* Loading placeholders */
animate-spin     /* Loading spinners */
```

## Layout Patterns

### Dashboard Layout
```tsx
<div className="min-h-screen flex">
  {/* Sidebar */}
  <aside className="w-64 border-r bg-muted/30">
    {/* Navigation */}
  </aside>
  
  {/* Main content */}
  <main className="flex-1 overflow-auto">
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Page Structure
```tsx
{/* Page header */}
<div className="space-y-2 mb-8">
  <h1 className="text-3xl font-bold">Page Title</h1>
  <p className="text-muted-foreground">Page description</p>
</div>

{/* Main content sections */}
<div className="space-y-8">
  <section>
    <h2 className="text-xl font-semibold mb-4">Section Title</h2>
    {/* Section content */}
  </section>
</div>
```

### Grid Layouts
```tsx
/* Responsive card grids */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>

/* Two-column layout */
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

## Loading States & Skeletons

### Skeleton Components
Always create skeleton components for loading states:

```tsx
// src/components/skeletons/recipe-card-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RecipeCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}
```

### Skeleton Patterns for Arrays
```tsx
/* Fixed-size arrays */
{[0, 1, 2].map((index) => (
  <RecipeCardSkeleton key={`recipe-skeleton-${index}`} />
))}

/* Dynamic arrays */
{Array.from({ length: count }, (_, i) => (
  <RecipeCardSkeleton key={`recipe-skeleton-${i + 1}`} />
))}
```

## Accessibility Guidelines

### Semantic HTML
```tsx
/* Use proper heading hierarchy */
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

/* Form labels */
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />

/* Buttons vs links */
<Button onClick={handleAction}>Perform Action</Button>
<Button asChild>
  <Link href="/page">Navigate</Link>
</Button>
```

### Focus Management
```css
/* Focus indicators */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring/50

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: white;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

### ARIA Attributes
```tsx
/* Dialogs */
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Modal description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>

/* Loading states */
<div aria-live="polite" aria-busy="true">
  Loading content...
</div>

/* Form validation */
<Input 
  aria-invalid={!!error}
  aria-describedby={error ? "error-message" : undefined}
/>
{error && (
  <p id="error-message" className="text-sm text-destructive">
    {error}
  </p>
)}
```

## Best Practices

### ✅ DO
- Use CSS variables for all colors (`bg-muted`, `text-foreground`)
- Install ShadCN components instead of building custom ones
- Create skeleton components for all loading states
- Use semantic HTML elements
- Follow consistent spacing patterns
- Use TypeScript path aliases (`@/components/...`)
- Group related elements with Cards
- Use appropriate Button and Badge variants

### ❌ DON'T
- Use hard-coded Tailwind colors (`bg-blue-500`, `text-red-600`)
- Create custom UI components when ShadCN equivalents exist
- Use inline styles or CSS classes for theming
- Mix different spacing patterns in the same interface
- Use generic component names (`Component`, `Item`, `Thing`)
- Put business logic in route files
- Use relative imports (`../components/...`)
- Create heavy borders or excessive shadows

### Color Anti-Patterns
```tsx
/* ❌ Hard-coded colors */
<Badge className="bg-green-600 text-white">Status</Badge>
<div className="border-blue-500 text-red-600">Content</div>
<Button className="bg-yellow-400 hover:bg-yellow-500">Action</Button>

/* ✅ Design system colors */
<Badge variant="default">Status</Badge>
<div className="border-border text-foreground">Content</div>
<Button variant="default">Action</Button>
```

### Component Anti-Patterns
```tsx
/* ❌ Custom UI components */
function CustomButton({ children }) {
  return <button className="px-4 py-2 bg-blue-500">{children}</button>;
}

/* ✅ ShadCN components */
import { Button } from "@/components/ui/button";
<Button variant="default">{children}</Button>
```

## File Organization

### Component Structure
```
src/components/
├── ui/                  # ShadCN base components
├── forms/              # All form components
├── lists/              # List and table components
├── cards/              # Card display components
├── layout/             # Layout and navigation
├── skeletons/          # Loading state components
└── auth/               # Authentication components
```

### Naming Conventions
```
✅ Good names:
- recipe-form.tsx
- recipe-list.tsx
- recipe-card.tsx
- recipe-card-skeleton.tsx

❌ Bad names:
- component.tsx
- item.tsx
- thing.tsx
- utils.tsx
```

---

This design system ensures consistency, maintainability, and accessibility across the TasteBase application. Always refer to this guide when implementing new UI components or patterns.