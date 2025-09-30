# Recipe Search Page Design Specifications
*TasteBase • Recipe Discovery & Search Experience*  
**Created:** September 7, 2025, 14:51

## Executive Summary

This specification defines the comprehensive design for a dedicated recipe search page (`/recipes/search`) in TasteBase, focusing on powerful discovery capabilities while maintaining the application's clean, minimal design principles. The design leverages existing search infrastructure and follows established dashboard layout standards.

---

## 1. User Experience Analysis & Requirements

### Primary User Personas

**The Recipe Explorer** - Active home cooks who enjoy discovering new recipes
- Wants to find recipes by ingredients they have on hand
- Values advanced filtering to narrow down options quickly
- Prefers visual browsing with recipe images
- Needs quick access to recipe details (time, difficulty, servings)

**The Organized Cook** - Methodical users who like structured recipe management
- Uses specific search criteria (cuisine, cooking time, difficulty)
- Values detailed filtering and sorting options
- Prefers list views with comprehensive information
- Needs efficient workflow integration with personal recipe collection

**The Quick Searcher** - Busy users looking for immediate results
- Wants fast, relevant search results
- Values simple search with smart suggestions
- Prefers card views for quick visual scanning
- Needs mobile-optimized experience

### User Journey Mapping

1. **Entry Points**
   - Direct navigation to `/recipes/search`
   - Search icon/button from any dashboard page
   - Quick search from recipe header components
   - External recipe management workflows

2. **Search Interaction Flow**
   - Initial page load with empty state
   - Search query input with real-time suggestions
   - Filter application with immediate results update
   - View toggling between cards/grid/list
   - Recipe selection and detail navigation

3. **Discovery Pattern**
   - Browse available filters (cuisines, tags, difficulty)
   - Apply multiple filter combinations
   - Sort results by relevance, time, or rating
   - Pagination through large result sets
   - Save or bookmark interesting recipes

### Accessibility Requirements

- **WCAG 2.1 AA Compliance**: All interactive elements meet contrast and size requirements
- **Keyboard Navigation**: Full keyboard accessibility for search, filters, and results
- **Screen Reader Support**: Proper ARIA labels and semantic markup throughout
- **Progressive Enhancement**: Core functionality works without JavaScript

---

## 2. Design Philosophy & Approach

### Core Design Principles

**Effortless Discovery**
- Search should feel intuitive and responsive
- Filters should be discoverable but not overwhelming
- Results should load progressively with clear feedback
- Empty states should guide users toward successful searches

**Visual Clarity**
- Clean separation between search controls and results
- Consistent information hierarchy in recipe cards
- Strategic use of white space for cognitive ease
- Subtle animations that enhance, never distract

**Flexible Interaction**
- Multiple search approaches (text, filters, browse)
- Adaptable result presentation (cards/grid/list)
- Responsive design that works on all device sizes
- Quick actions that fit into existing workflows

### Bold Simplicity Guidelines

- **Single-Purpose Focus**: Each section serves one clear function
- **Progressive Disclosure**: Advanced filters revealed only when needed
- **Minimal Cognitive Load**: No more than 3-4 filter options visible initially
- **Immediate Feedback**: Search results update without full page reloads

---

## 3. Visual Design System & ShadCN Color Integration

### Primary Color Palette
```css
/* Search Interface */
.search-container {
  background: bg-background;
  border: border-border;
}

.search-input {
  background: bg-input;
  border: border-border;
  color: text-foreground;
}

.search-input:focus {
  border-color: ring;
  box-shadow: 0 0 0 3px ring/20;
}
```

### Filter System Colors
```css
/* Filter Controls */
.filter-active {
  background: bg-primary;
  color: text-primary-foreground;
}

.filter-inactive {
  background: bg-secondary;
  color: text-secondary-foreground;
  border: border-border;
}

.filter-badge {
  background: bg-accent/20;
  color: text-accent-foreground;
  border: border-accent/30;
}
```

### Result Display Colors
```css
/* Recipe Cards */
.recipe-card {
  background: bg-card;
  border: border-border;
  color: text-card-foreground;
}

.recipe-card:hover {
  border-color: border-primary/50;
  box-shadow: 0 4px 12px bg-primary/10;
}

/* Status Indicators */
.difficulty-easy { color: text-chart-2; }
.difficulty-medium { color: text-chart-3; }
.difficulty-hard { color: text-destructive; }
```

### Themed Gradients
```css
/* Hero Section */
.search-hero {
  background: linear-gradient(135deg, bg-gradient-to-br from-accent/10 via-background to-primary/5);
}

/* Loading States */
.skeleton-gradient {
  background: linear-gradient(90deg, bg-muted/50, bg-muted, bg-muted/50);
}
```

---

## 4. User Flow & Interaction Design

### Primary Search Flow

```
[Search Page Load] → [Empty State with Suggestions] → [User Input Query] → 
[Real-time Results] → [Apply Filters] → [Refined Results] → [Recipe Selection]
```

### Filter Interaction Pattern

```
[Initial Filters Visible] → [More Filters Toggle] → [Advanced Options] → 
[Apply Combinations] → [Clear All Option] → [Reset to Defaults]
```

### View Toggle Behavior

```
[Cards View Default] ↔ [Grid View (4-column)] ↔ [List View (Detailed)]
```

### State Transitions

**Loading States**
- Initial page: Show skeleton with search input ready
- Search query: Show skeleton cards while fetching
- Filter changes: Subtle loading indicator, maintain existing results until new ones load

**Error States**
- No results: Friendly message with search suggestions
- Search error: Clear error message with retry option
- Network issues: Offline indicator with cached results if available

**Success States**
- Results found: Smooth transition with count display
- Filter applied: Visual confirmation of active filters
- View changed: Seamless layout transition with maintained scroll position

---

## 5. Interface Layout & Component Specifications

### Page Structure (Mobile-First)

```
┌─────────────────────────────────────┐
│ DashboardLayout                     │
├─────────────────────────────────────┤
│ RecipeHeader (Search Focused)       │
│ ├─ Search Input (Full Width)        │
│ ├─ Quick Filters (Horizontal Scroll)│
│ └─ View Toggle + Sort              │
├─────────────────────────────────────┤
│ Active Filters (if any)             │
├─────────────────────────────────────┤
│ Results Count + Status             │
├─────────────────────────────────────┤
│ Recipe Results Grid                 │
│ ├─ Cards (1-2-3 columns)          │
│ ├─ Grid (2-3-4 columns)           │
│ └─ List (1 column, detailed)       │
├─────────────────────────────────────┤
│ Pagination / Load More             │
└─────────────────────────────────────┘
```

### Desktop Layout Enhancements

```
┌──────────┬─────────────────────────────┐
│ Sidebar  │ Search Header (Compact)     │
│ (240px)  ├─────────────────────────────┤
│          │ Filters Bar (Horizontal)    │
│          ├─────────────────────────────┤
│          │ Results (Multi-column)      │
│          │ ├─ Cards: 3-4 columns      │
│          │ ├─ Grid: 4-6 columns       │
│          │ └─ List: 2 columns          │
│          ├─────────────────────────────┤
│          │ Pagination                  │
└──────────┴─────────────────────────────┘
```

### Component Dimensions

**Search Input**
- Mobile: `height: 44px` (touch-friendly)
- Desktop: `height: 40px`
- Full width with 16px padding
- Icon left-aligned with 12px margin

**Filter Buttons**
- Minimum height: `32px`
- Horizontal padding: `12px`
- Border radius: `6px`
- Gap between filters: `8px`

**Recipe Cards**
- Aspect ratio: `4:3` for image area
- Minimum height: `280px` (cards view)
- Maximum width: `400px`
- Border radius: `8px`

---

## 6. Accessibility & Performance Considerations

### Accessibility Implementation

**Keyboard Navigation**
- Tab order: Search → Filters → View Toggle → Results → Pagination
- Arrow keys for filter navigation
- Enter/Space for filter activation
- Escape to clear search or close filter panels

**Screen Reader Support**
```html
<div role="search" aria-label="Recipe search">
  <input 
    type="search" 
    aria-label="Search recipes by name, ingredient, or cuisine"
    aria-describedby="search-help"
  />
  <div id="search-help" class="sr-only">
    Enter keywords to search your recipe collection
  </div>
</div>

<div role="region" aria-label="Search results" aria-live="polite">
  <p id="results-summary">
    Found {count} recipes matching "{query}"
  </p>
</div>
```

**Focus Management**
- Search input receives focus on page load
- Focus returns to triggering element after filter panels close
- Clear focus indicators throughout interface

### Performance Optimization

**Progressive Loading**
- Initial 20 results load immediately
- Additional results load on scroll (infinite scroll) or pagination
- Images use Next.js optimization with proper `sizes` attributes
- Skeleton states prevent layout shift

**Search Optimization**
- 300ms debounce on search input to reduce API calls
- Cache recent searches for faster repeat access
- Full-text search with FTS indexing for performance
- Fallback to LIKE queries for broader matching

**Bundle Considerations**
- Lazy load filter components until needed
- Code splitting for advanced search features
- Image lazy loading with intersection observer
- Minimize JavaScript bundle for core search functionality

---

## 7. Implementation Guidelines & Development Handoff

### Page Implementation Structure

```typescript
// /src/app/(dashboard)/recipes/search/page.tsx
export default async function RecipeSearchPage() {
  // Authentication check (fast ~50ms)
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="space-y-6">
        <Suspense fallback={<RecipeHeaderSkeleton showSearch showViewToggle showFilters />}>
          <RecipeSearchHeader />
        </Suspense>
        
        <div className="px-6 pb-6">
          <Suspense fallback={<RecipeSearchResultsSkeleton />}>
            <RecipeSearchResults />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Component Architecture

**RecipeSearchHeader Component** (`/src/components/forms/recipe-search-header.tsx`)
```typescript
interface RecipeSearchHeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  onViewChange: (view: ViewType) => void;
  onSortChange: (sort: SortOption) => void;
  availableFilters: AvailableFilters;
  activeFilters: SearchFilters;
  resultsCount: number;
  isLoading: boolean;
}
```

**RecipeSearchResults Component** (`/src/components/lists/recipe-search-results.tsx`)
```typescript
interface RecipeSearchResultsProps {
  results: RecipeWithDetails[];
  view: 'cards' | 'grid' | 'list';
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}
```

**RecipeSearchFilters Component** (`/src/components/forms/recipe-search-filters.tsx`)
```typescript
interface RecipeSearchFiltersProps {
  availableFilters: AvailableFilters;
  activeFilters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}
```

### Server Actions Integration

```typescript
// /src/lib/server-actions/recipe-search-actions.ts
export async function searchRecipesAction(
  searchParams: RecipeSearchInput
): Promise<ActionResult<RecipeSearchResult>> {
  try {
    const session = await auth.api.getSession();
    if (!session) {
      return { success: false, error: "Authentication required" };
    }

    const results = await searchRecipes(session.user.id, searchParams);
    return { success: true, data: results };
  } catch (error) {
    logError(logger, "Recipe search action failed", error, { searchParams });
    return { success: false, error: "Search failed. Please try again." };
  }
}
```

### Search State Management

```typescript
// Client-side search state with URL sync
const [searchState, setSearchState] = useState<SearchState>({
  query: '',
  filters: {},
  view: 'cards',
  sort: 'relevance',
  page: 1
});

// Sync with URL parameters
useEffect(() => {
  const params = new URLSearchParams(searchParams);
  // Update URL without navigation
  router.replace(`/recipes/search?${params.toString()}`, { scroll: false });
}, [searchState]);
```

### Skeleton Components

**RecipeSearchResultsSkeleton** (`/src/components/skeletons/recipe-search-results-skeleton.tsx`)
```typescript
export function RecipeSearchResultsSkeleton({ 
  view = 'cards',
  count = 12 
}: RecipeSearchResultsSkeletonProps) {
  return (
    <div className={cn(
      "gap-4",
      view === "cards" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      view === "grid" && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      view === "list" && "flex flex-col space-y-2"
    )}>
      {Array.from({ length: count }, (_, i) => (
        <RecipeCardSkeleton 
          key={`recipe-search-skeleton-${i + 1}`}
          variant={view}
        />
      ))}
    </div>
  );
}
```

### Mobile Responsiveness

**Breakpoint Strategy**
- `sm: 640px` - Stack search controls vertically
- `md: 768px` - 2-column recipe cards, horizontal filters
- `lg: 1024px` - 3-column cards, full desktop layout
- `xl: 1280px` - 4-column grid view, expanded filters

**Touch Optimization**
- Minimum 44px touch targets
- Swipe gestures for filter panels
- Pull-to-refresh on mobile
- Optimized keyboard for search input

### Performance Metrics & Success Criteria

**Loading Performance**
- Initial page load: < 1.5s
- Search results: < 500ms
- Filter application: < 300ms
- View switching: < 100ms (local state)

**User Experience Metrics**
- Search success rate: > 85%
- Filter usage rate: > 40%
- View toggle engagement: > 25%
- Recipe click-through rate: > 60%

**Technical Requirements**
- Core Web Vitals compliance
- Keyboard navigation coverage: 100%
- Screen reader compatibility tested
- Mobile performance score: > 90

---

## Implementation Roadmap

### Phase 1: Core Search Infrastructure (Week 1)
1. Create page route and basic layout structure
2. Implement RecipeSearchHeader with search input and basic filters
3. Integrate with existing searchRecipes server action
4. Add basic result display with cards view
5. Implement skeleton loading states

### Phase 2: Advanced Features (Week 2)
1. Add comprehensive filter system (cuisine, difficulty, time, tags)
2. Implement view toggle (cards/grid/list) with state persistence
3. Add sorting options (relevance, time, rating, alphabetical)
4. Implement pagination or infinite scroll
5. Add URL state synchronization

### Phase 3: Enhancement & Polish (Week 3)
1. Add advanced search features (ingredient search, tag combinations)
2. Implement search suggestions and autocomplete
3. Add empty states and error handling
4. Performance optimization and caching
5. Comprehensive testing and accessibility audit

### Phase 4: Integration & Testing (Week 4)
1. Integration with existing recipe management workflows
2. Mobile optimization and touch interactions
3. Analytics integration for search behavior
4. A/B test different search interface approaches
5. Documentation and user guidance

This comprehensive design specification provides the foundation for implementing a powerful, intuitive recipe search experience that aligns with TasteBase's design principles while leveraging all available backend infrastructure for optimal performance and user satisfaction.