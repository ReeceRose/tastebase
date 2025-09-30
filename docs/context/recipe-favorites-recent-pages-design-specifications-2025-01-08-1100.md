# Recipe Favorites & Recent Pages - Design Specifications
**Project**: TasteBase Personal Recipe Management
**Created**: January 8, 2025
**Pages**: `/recipes/favorites` and `/recipes/recent`

## Executive Summary

This document provides comprehensive UX/UI specifications for two critical recipe discovery pages in TasteBase: the Favorites page for users to access their beloved recipes, and the Recent page for quick access to recently viewed content. These pages leverage existing backend functionality while providing intuitive, efficient user experiences that encourage recipe exploration and cooking habit formation.

**Design Philosophy**: Create effortless access patterns that feel natural - favorites as a personal "recipe box" and recent as a "cooking journal" - using temporal context and emotional connection to enhance recipe discovery.

---

## 1. User Experience Analysis & Requirements

### User Personas & Mental Models

**Primary Persona: The Home Cook**
- **Behavior**: Saves 3-5 favorite recipes they cook repeatedly (comfort foods, family favorites)
- **Mental Model**: Favorites = "my reliable go-to recipes" (like bookmarked websites)
- **Pain Points**: Scrolling through all recipes to find the ones they cook most often
- **Success Metrics**: Quick access to favorites, reduced time from "what to cook" to starting

**Secondary Persona: The Recipe Explorer**
- **Behavior**: Views many recipes while browsing and exploring new ideas
- **Mental Model**: Recent = "where was that recipe I looked at yesterday?" 
- **Pain Points**: Can't remember recipe details or location after browsing sessions
- **Success Metrics**: Easy rediscovery of recently viewed content, browsing continuity

### User Journey Mapping

**Favorites Journey**:
1. **Entry Point**: Navigation click → immediate visual scan for familiar recipes
2. **Recognition**: Quick identification through images and titles
3. **Selection**: Single click to recipe details
4. **Actions**: View recipe, remove from favorites if needed

**Recent Journey**:
1. **Entry Point**: "Where was that recipe?" → Recent page access
2. **Temporal Scan**: Visual scan ordered by recency with time indicators  
3. **Recognition**: Identify target recipe through visual + temporal cues
4. **Discovery**: Serendipitous rediscovery of previously viewed recipes

### Accessibility & Inclusive Design Requirements

- **Visual Recognition**: Strong visual hierarchy with consistent recipe cards
- **Temporal Understanding**: Clear, relative time indicators ("2 hours ago", "3 days ago")
- **Keyboard Navigation**: Full keyboard accessibility for all actions
- **Screen Reader Support**: Proper ARIA labels for timestamps and favorite status
- **Color Independence**: Status information not solely dependent on color

---

## 2. Design Philosophy & Approach

### Core Design Principles

**Temporal Intuition**: Both pages leverage time as a natural organizing principle
- Favorites: Organized by "favorited date" (when user marked as favorite)
- Recent: Organized by "viewed date" (chronological browsing history)

**Effortless Recognition**: Visual design optimized for quick scanning
- High-contrast recipe images for immediate recognition
- Consistent card layout matching existing RecipeCard pattern
- Clear temporal indicators without overwhelming the interface

**Contextual Actions**: Actions that make sense for each page's purpose
- Favorites: Remove from favorites, view recipe
- Recent: View recipe, clear history, add to favorites

**Cognitive Load Reduction**:
- Minimal interface chrome - content takes precedence
- Familiar patterns from main recipes page
- Progressive disclosure of actions (hover states, context menus)

### Interaction Patterns

**Scanning Optimization**: 
- Grid layout for visual scanning efficiency
- Consistent spacing and alignment
- High-contrast images and text hierarchy

**Quick Access Actions**:
- Single-click recipe access (primary action)
- Hover-revealed secondary actions (remove favorite, clear history)
- Keyboard shortcuts for power users

---

## 3. Visual Design System & ShadCN Color Integration

### Semantic Color Usage

**Page Headers**:
```css
/* Favorites page header */
bg-gradient-to-br from-chart-2/10 via-background to-primary/5
text-foreground

/* Recent page header */  
bg-gradient-to-br from-chart-3/10 via-background to-muted/20
text-foreground
```

**Recipe Cards** (using existing RecipeCard):
```css
/* Standard cards */
bg-card border-border text-card-foreground
hover:shadow-md (existing pattern)

/* Favorite indicator */
text-chart-2 (heart icon when favorited)

/* Time indicators */
text-muted-foreground (relative time stamps)
text-chart-3 (recent indicators like "New" badges)
```

**Empty States**:
```css
/* Background gradients */
bg-gradient-to-br from-muted/20 to-background

/* Icons and text */
text-muted-foreground (main empty state text)
text-primary (call-to-action elements)
```

**Action Buttons**:
```css
/* Remove favorite button */
text-destructive hover:bg-destructive/10

/* Clear history button */
text-muted-foreground hover:bg-muted/20

/* Add to favorites (from recent) */
text-chart-2 hover:bg-chart-2/10
```

**Status Indicators**:
```css
/* Recently added to favorites */
bg-chart-2/10 text-chart-2 border-chart-2/20

/* Recently viewed indicator */
bg-chart-3/10 text-chart-3 border-chart-3/20
```

---

## 4. User Flow & Interaction Design

### Favorites Page User Flow

```
Dashboard Navigation
↓
Click "Favorites" → Page loads with skeleton
↓  
RecipeFavoritesList component fetches data
↓
Display favorited recipes in grid (newest favorites first)
↓
User Actions:
- Click recipe → Navigate to recipe details
- Hover card → Show "Remove from favorites" action  
- Click remove → Confirm modal → Remove and refresh list
- Search/filter → Filter favorites collection
```

**Loading States & Transitions**:
- **Initial Load**: RecipeCardGridSkeleton with 6 placeholders
- **Remove Action**: Fade out animation → slide remaining cards up
- **Filter/Search**: Smooth transition between filtered results
- **Empty to Content**: Fade in animation when first favorite is added

### Recent Page User Flow

```
Dashboard Navigation  
↓
Click "Recent" → Page loads with skeleton
↓
RecentRecipesList component fetches data  
↓
Display recently viewed recipes (newest first) with timestamps
↓
User Actions:
- Click recipe → Navigate to recipe details (+ update view timestamp)  
- Hover card → Show "Add to favorites" action
- Click "Clear History" → Confirm modal → Clear all views
- Search/filter → Filter recent collection
```

**Micro-Interactions**:
- **Timestamp Updates**: Subtle animation when timestamp changes ("1 hour ago" → "2 hours ago")
- **Clear History**: Gentle fade out of all cards simultaneously
- **Add to Favorites**: Heart icon fills with color animation

### Error States & Edge Cases

**Network Errors**: Retry button with exponential backoff
**No Permissions**: Graceful degradation with auth redirect
**Concurrent Modifications**: Optimistic updates with rollback on failure

---

## 5. Interface Layout & Component Specifications

### Page Layout Structure (Both Pages)

```
DashboardLayout wrapper
├── Page Header Section
│   ├── Title + Subtitle  
│   ├── Action Buttons (Clear History / Manage Favorites)
│   └── RecipeHeader component (search, filters, view toggle)
├── Content Section
│   ├── Recipe Grid (responsive)
│   └── Load More / Pagination
└── Empty State (when no recipes)
```

### Favorites Page Layout Specifications

**Page Header**:
```typescript
<div className="p-6 space-y-6">
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-foreground">
        Favorite Recipes
      </h1>
      <p className="text-muted-foreground">
        Your collection of go-to recipes and family favorites
      </p>
    </div>
    
    {favoriteCount > 0 && (
      <Badge variant="secondary" className="text-sm">
        {favoriteCount} favorites
      </Badge>
    )}
  </div>
</div>
```

**Recipe Grid**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {favorites.map((favorite) => (
    <div key={favorite.recipe.id} className="relative group">
      <RecipeCard 
        recipe={favorite.recipe}
        showImages={true}
        className="transition-all duration-200 hover:scale-[1.02]"
      />
      
      {/* Favorite metadata overlay */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/80">
          <Heart className="h-4 w-4 text-chart-2 fill-current" />
        </Button>
      </div>
      
      {/* Favorited timestamp */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Favorited {formatRelativeTime(favorite.favoritedAt)}
      </div>
    </div>
  ))}
</div>
```

### Recent Page Layout Specifications

**Page Header**:
```typescript
<div className="p-6 space-y-6">
  <div className="flex items-center justify-between">
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-foreground">
        Recently Viewed
      </h1>
      <p className="text-muted-foreground">
        Recipes you've looked at recently, ordered by last viewed
      </p>
    </div>
    
    <div className="flex items-center gap-2">
      {recentCount > 0 && (
        <>
          <Badge variant="outline" className="text-sm">
            {recentCount} recent
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearHistory}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </>
      )}
    </div>
  </div>
</div>
```

**Recipe Grid with Timestamps**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {recentRecipes.map((recent) => (
    <div key={recent.recipe.id} className="relative group">
      <RecipeCard 
        recipe={recent.recipe}
        showImages={true}
        className="transition-all duration-200 hover:scale-[1.02]"
      />
      
      {/* Recent indicator badge */}
      {isVeryRecent(recent.viewedAt) && (
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs bg-chart-3/20 text-chart-3">
            Recently viewed
          </Badge>
        </div>
      )}
      
      {/* Viewed timestamp with add to favorites */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Viewed {formatRelativeTime(recent.viewedAt)}
        </span>
        
        <Button 
          size="sm" 
          variant="ghost"
          className="h-6 px-2 text-chart-2 hover:bg-chart-2/10"
        >
          <Heart className="h-3 w-3 mr-1" />
          Add to Favorites  
        </Button>
      </div>
    </div>
  ))}
</div>
```

### Responsive Design Patterns

**Mobile (< 768px)**:
- Single column grid
- Larger touch targets (44px minimum)
- Simplified timestamp format ("2h ago" vs "2 hours ago")
- Stack header elements vertically

**Tablet (768px - 1024px)**:
- Two column grid
- Medium-sized cards
- Full timestamp format

**Desktop (> 1024px)**:
- Three column grid
- Hover interactions enabled
- Full feature set including hover overlays

---

## 6. Empty State Design & Messaging

### Favorites Page Empty State

```typescript
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="relative mb-6">
    {/* Decorative background */}
    <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 to-primary/5 rounded-full blur-3xl opacity-50" />
    
    {/* Heart icon */}
    <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
      <Heart className="h-12 w-12 text-chart-2" />
    </div>
  </div>
  
  <div className="space-y-3 max-w-md">
    <h3 className="text-lg font-semibold text-foreground">
      No favorite recipes yet
    </h3>
    <p className="text-muted-foreground leading-relaxed">
      Start building your personal collection by marking recipes as favorites. 
      Look for the heart icon when viewing any recipe.
    </p>
  </div>
  
  <div className="flex flex-col sm:flex-row gap-3 mt-8">
    <Button asChild>
      <Link href="/recipes">
        <Book className="h-4 w-4 mr-2" />
        Browse Recipes
      </Link>
    </Button>
    <Button variant="outline" asChild>
      <Link href="/recipes/new">
        <Plus className="h-4 w-4 mr-2" />
        Add Recipe
      </Link>
    </Button>
  </div>
</div>
```

### Recent Page Empty State

```typescript
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="relative mb-6">
    {/* Decorative background */}
    <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-muted/20 rounded-full blur-3xl opacity-50" />
    
    {/* Clock icon */}
    <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-full p-8 border border-border/50">
      <Clock className="h-12 w-12 text-chart-3" />
    </div>
  </div>
  
  <div className="space-y-3 max-w-md">
    <h3 className="text-lg font-semibold text-foreground">
      No recent activity
    </h3>
    <p className="text-muted-foreground leading-relaxed">
      Your recently viewed recipes will appear here as you browse your collection. 
      Start exploring to build your viewing history.
    </p>
  </div>
  
  <div className="flex flex-col sm:flex-row gap-3 mt-8">
    <Button asChild>
      <Link href="/recipes">
        <Book className="h-4 w-4 mr-2" />
        Explore Recipes
      </Link>
    </Button>
    <Button variant="outline" asChild>
      <Link href="/recipes/search">
        <Search className="h-4 w-4 mr-2" />
        Search Recipes
      </Link>
    </Button>
  </div>
</div>
```

---

## 7. Timestamp Display & Relative Time Formatting

### Time Display Strategy

**Recent Page** (emphasis on recency):
- **< 1 hour**: "Just now", "5 minutes ago", "45 minutes ago"  
- **< 24 hours**: "2 hours ago", "8 hours ago"
- **< 7 days**: "Yesterday", "2 days ago", "5 days ago"
- **< 30 days**: "Last week", "2 weeks ago", "3 weeks ago"  
- **> 30 days**: "Last month", "2 months ago", "Dec 15, 2024"

**Favorites Page** (emphasis on milestone):
- **< 7 days**: "Added 2 days ago", "Added yesterday"
- **< 30 days**: "Added last week", "Added 3 weeks ago"
- **< 365 days**: "Added in December", "Added 3 months ago"
- **> 365 days**: "Added Dec 2023", "Added in 2022"

### Implementation Specifications

```typescript
// Recent page timestamp utility
function formatRecentTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 5) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
  }
  
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

// Favorites page timestamp utility  
function formatFavoriteTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return diffDays === 0 ? "Added today" : 
           diffDays === 1 ? "Added yesterday" : 
           `Added ${diffDays} days ago`;
  }
  
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Added last week" : `Added ${weeks} weeks ago`;
  }
  
  return `Added ${date.toLocaleDateString(undefined, { 
    month: 'long', 
    year: 'numeric' 
  })}`;
}
```

---

## 8. Accessibility & Performance Considerations

### WCAG 2.1 AA Compliance

**Color Contrast**:
- All text meets 4.5:1 contrast ratio minimum
- Interactive elements meet 3:1 contrast for non-text content
- Status indicators include non-color methods (icons, text)

**Keyboard Navigation**:
```typescript
// Keyboard shortcuts
const shortcuts = {
  'f': 'Focus search input',
  'Escape': 'Clear search/filters',
  'Enter': 'Select focused recipe',
  'Space': 'Toggle favorite status (when focused)',
  'Delete': 'Remove from favorites (with confirmation)'
};
```

**Screen Reader Support**:
```typescript
// Aria labels for timestamps
<time 
  dateTime={recipe.viewedAt.toISOString()}
  aria-label={`Last viewed on ${recipe.viewedAt.toLocaleDateString()}`}
>
  {formatRecentTime(recipe.viewedAt)}
</time>

// Favorite status announcement
<button 
  aria-label={`Remove ${recipe.title} from favorites`}
  aria-pressed={true}
>
  <Heart className="sr-only" />
</button>
```

### Performance Optimizations

**Data Loading Strategy**:
- Initial load: Fetch first 12 recipes
- Pagination: Load 12 more on scroll/button click
- Search debouncing: 300ms delay on search input

**Image Optimization**:
- Use Next.js Image component with appropriate sizes
- Lazy loading for below-the-fold content
- WebP format with fallbacks

**Bundle Size Considerations**:
- Share components between Favorites and Recent pages
- Lazy load confirmation modals
- Use existing RecipeCard component without modifications

---

## 9. Implementation Guidelines & Development Handoff

### Component Architecture

**File Structure**:
```
src/app/(dashboard)/recipes/
├── favorites/
│   └── page.tsx                 # Favorites page
├── recent/ 
│   └── page.tsx                 # Recent page
│   
src/components/lists/
├── recipe-favorites-list.tsx    # Favorites list component
├── recipe-recent-list.tsx       # Recent list component  
└── recipe-time-badge.tsx        # Reusable time badge

src/components/skeletons/
├── recipe-favorites-skeleton.tsx
└── recipe-recent-skeleton.tsx

src/lib/utils/
└── time-formatting.ts          # Time formatting utilities
```

**Server Actions Integration**:
```typescript
// Page components use existing server actions
import { getUserFavoriteRecipes } from '@/lib/server-actions/recipe-favorites-actions';
import { getRecentlyViewedRecipes } from '@/lib/server-actions/recipe-tracking-actions';

// Both pages follow Suspense pattern
<Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
  <RecipeFavoritesList />
</Suspense>
```

### Step-by-Step Implementation Approach

1. **Create Page Files** (30 min):
   - `/src/app/(dashboard)/recipes/favorites/page.tsx`
   - `/src/app/(dashboard)/recipes/recent/page.tsx`
   - Follow existing recipes page pattern with DashboardLayout

2. **Build List Components** (2 hours):
   - `RecipeFavoritesList` - fetches and displays favorites
   - `RecentRecipesList` - fetches and displays recent
   - Use existing RecipeCard component
   - Add timestamp display utilities

3. **Create Skeleton Components** (30 min):
   - Extend existing `RecipeCardGridSkeleton`
   - Add time indicator skeleton placeholders

4. **Implement Empty States** (1 hour):
   - Design empty state components
   - Add appropriate call-to-action buttons
   - Include proper accessibility attributes

5. **Add Time Formatting** (45 min):
   - Create time utility functions  
   - Add proper datetime attributes for accessibility
   - Test with various time ranges

6. **Testing & Polish** (1 hour):
   - Test empty states and loading states
   - Verify keyboard navigation
   - Check responsive design
   - Test with screen reader

### Code Implementation Examples

**Favorites Page** (`/src/app/(dashboard)/recipes/favorites/page.tsx`):
```typescript
import { Suspense } from 'react';
import { Heart } from 'lucide-react';
import { RecipeFavoritesList } from '@/components/lists/recipe-favorites-list';
import { RecipeCardGridSkeleton } from '@/components/skeletons/recipe-card-skeleton';

export const metadata = {
  title: 'Favorite Recipes | Tastebase',
  description: 'Your collection of go-to recipes and family favorites',
};

export default function FavoritesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-chart-2" />
            <h1 className="text-2xl font-semibold text-foreground">
              Favorite Recipes
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your collection of go-to recipes and family favorites
          </p>
        </div>
      </div>

      <Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
        <RecipeFavoritesList />
      </Suspense>
    </div>
  );
}
```

**Recent Page** (`/src/app/(dashboard)/recipes/recent/page.tsx`):
```typescript
import { Suspense } from 'react';
import { Clock } from 'lucide-react';
import { RecentRecipesList } from '@/components/lists/recipe-recent-list';
import { RecipeCardGridSkeleton } from '@/components/skeletons/recipe-card-skeleton';

export const metadata = {
  title: 'Recently Viewed | Tastebase',
  description: 'Recipes you\'ve looked at recently, ordered by last viewed',
};

export default function RecentPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-chart-3" />
            <h1 className="text-2xl font-semibold text-foreground">
              Recently Viewed
            </h1>
          </div>
          <p className="text-muted-foreground">
            Recipes you've looked at recently, ordered by last viewed
          </p>
        </div>
      </div>

      <Suspense fallback={<RecipeCardGridSkeleton count={6} />}>
        <RecentRecipesList />
      </Suspense>
    </div>
  );
}
```

### A/B Testing Opportunities

1. **Grid Layout**: Test 2-column vs 3-column on desktop
2. **Timestamp Position**: Test above vs below recipe cards  
3. **Empty State CTAs**: Test "Browse Recipes" vs "Add Recipe" priority
4. **Clear History**: Test button placement and confirmation pattern

### Success Metrics

**User Engagement**:
- Click-through rate from Favorites → Recipe details (target: >60%)
- Click-through rate from Recent → Recipe details (target: >45%)
- Time spent on each page (target: >30 seconds average)

**Feature Adoption**:
- % of users who access Favorites page (target: >70% of active users)
- % of users who access Recent page (target: >40% of active users)
- Average number of favorites per user (target: 5-15 recipes)

**Task Completion**:
- Successful navigation to target recipe (target: >90%)
- User retention after using these features (target: +15% monthly retention)

---

## Implementation Roadmap

This design specification provides the main development agent with all necessary context to implement both the Favorites and Recent pages following TasteBase's established patterns. The approach leverages existing components (`RecipeCard`, `RecipeList` pattern) while adding page-specific enhancements for temporal context and user actions.

**Key Implementation Decisions**:
1. **Reuse existing components** to maintain consistency and reduce development time
2. **Follow Suspense pattern** established in the main recipes page
3. **Use existing server actions** without modification
4. **Add minimal new utilities** for time formatting and empty states
5. **Maintain accessibility** standards throughout the implementation

The specification prioritizes user mental models (favorites as "recipe box", recent as "cooking journal") while ensuring the interface feels like a natural extension of the existing TasteBase experience.