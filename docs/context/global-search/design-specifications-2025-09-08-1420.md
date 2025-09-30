# Global Search Modal Design Specifications

**Project**: TasteBase Recipe Management  
**Feature**: Mac Spotlight-like Global Search Modal (Cmd/Ctrl+K)  
**Date**: 2025-09-08  
**Status**: Design Specifications for Implementation

## Executive Summary

This document outlines the comprehensive design strategy for TasteBase's global search modal - a Mac Spotlight-inspired quick search interface that provides instant recipe access from anywhere in the application. The modal serves as a hybrid solution, offering quick results while seamlessly connecting users to the full-featured search page when needed.

**Key Design Principles:**
- **Instant Access**: Cmd/Ctrl+K from anywhere triggers immediate search
- **Progressive Enhancement**: Quick results → full search page when needed  
- **Cooking-Friendly**: Optimized for hands-on kitchen use scenarios
- **Theme-Aware**: Consistent with TasteBase's clean, minimal design system

---

## 1. User Experience Analysis & Requirements

### Target User Personas

**Primary Persona: "The Active Cook"**
- Currently cooking, needs quick recipe lookups
- Hands may be messy, prefers keyboard shortcuts
- Values speed over comprehensive filtering
- Mental model: "Like Mac Spotlight but for recipes"

**Secondary Persona: "The Recipe Browser"** 
- Exploring recipe collection while planning meals
- Wants quick navigation between recipes
- Appreciates the ability to escalate to full search
- Mental model: "Quick launcher for recipe exploration"

### User Journey Mapping

**Scenario 1: Quick Recipe Lookup While Cooking**
```
Trigger: Cmd+K → Type "chicken curry" → See 3-4 quick results → Enter on desired recipe → Modal closes, navigate to recipe
```

**Scenario 2: No Results Found**
```
Trigger: Cmd+K → Type "obscure ingredient" → See "No results found" → Cmd+Enter to open full search → Modal closes, navigate to search page with query pre-filled
```

**Scenario 3: Exploration Mode**
```
Trigger: Cmd+K → Type "Italian" → See various Italian recipes → Use arrow keys to preview → Click "See all results" → Navigate to full search with filters applied
```

### Friction Points & Solutions

**Friction Point**: Messy hands while cooking  
**Solution**: Full keyboard navigation, large click targets, Escape to close

**Friction Point**: Limited screen real estate on tablets  
**Solution**: Responsive sizing, mobile-optimized interaction patterns

**Friction Point**: Overwhelming results for common searches  
**Solution**: Limit to 8-10 most relevant results, clear "See all" escape hatch

---

## 2. Design Philosophy & Approach

### Core Design Principles

**Bold Simplicity**
- Clean search input with subtle but clear visual hierarchy  
- Results displayed as scannable cards with essential information only
- No overwhelming options or complex filtering in modal

**Intuitive Interaction Patterns**
- Familiar keyboard shortcuts (Cmd+K, Escape, Arrow keys, Enter)
- Hover states that clearly indicate interactivity
- Smooth, purposeful animations that guide user attention

**Cognitive Load Reduction**
- Auto-search with 300ms debounce - no explicit search button
- Clear visual distinction between recipe types ("Your recipe" vs public)
- Prominent "See all results" action when more exploration is needed

### Accessibility-First Design

**Keyboard Navigation**
- Full keyboard accessibility without mouse dependency
- Clear focus indicators following ShadCN design tokens
- Logical tab order: search input → results → action buttons

**Screen Reader Support**
- Semantic HTML with proper ARIA labels
- Live region announcements for search results
- Clear role definitions for interactive elements

**Motor Accessibility**
- Large click targets (minimum 44px touch targets)
- Generous spacing between interactive elements
- Forgiving interaction patterns (click anywhere on result card)

---

## 3. Visual Design System & ShadCN Color Integration

### Color Palette Specifications

**Modal Background & Structure**
```css
/* Modal backdrop */
backdrop: rgba(0, 0, 0, 0.5) /* Semi-transparent overlay */

/* Modal container */
background: hsl(var(--background))
border: hsl(var(--border))
shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Search input */
background: hsl(var(--background))
border: hsl(var(--border))
text: hsl(var(--foreground))
placeholder: hsl(var(--muted-foreground))
focus-ring: hsl(var(--ring))
```

**Result Cards & Interactive States**
```css
/* Default result card */
background: hsl(var(--card))
border: hsl(var(--border))
text: hsl(var(--card-foreground))

/* Hover state */
background: hsl(var(--muted/50))
border: hsl(var(--chart-1/30))

/* Selected/focused state */
background: hsl(var(--chart-1/10))
border: hsl(var(--chart-1))
```

**Semantic Colors for Recipe Metadata**
```css
/* Recipe ownership indicators */
your-recipe: hsl(var(--chart-2)) /* Green for owned recipes */
public-recipe: hsl(var(--chart-3)) /* Blue for public recipes */
private-badge: hsl(var(--muted-foreground))

/* Time and difficulty indicators */
time-indicator: hsl(var(--chart-4)) /* Warm color for time */
difficulty-easy: hsl(var(--chart-2))
difficulty-medium: hsl(var(--chart-3))  
difficulty-hard: hsl(var(--chart-5))
```

**Empty States & Messaging**
```css
/* No results state */
empty-icon: hsl(var(--muted-foreground/60))
empty-text: hsl(var(--muted-foreground))
suggestion-text: hsl(var(--foreground/80))

/* Loading state */
skeleton-base: hsl(var(--muted/30))
skeleton-shimmer: hsl(var(--muted/60))
```

### Typography Hierarchy

**Search Input**
- Font: `text-base` (16px) for accessibility and mobile usability
- Weight: `font-normal` 
- Placeholder: `text-muted-foreground`

**Result Titles**
- Font: `text-sm font-medium` (14px, 500 weight)
- Color: `text-foreground`
- Line height: Generous for readability

**Metadata Text**
- Font: `text-xs` (12px) for secondary information
- Color: `text-muted-foreground`
- Weight: `font-normal`

**Action Buttons**
- Font: `text-sm font-medium`
- Consistent with ShadCN Button component standards

---

## 4. User Flow & Interaction Design

### Keyboard Shortcuts & Navigation Flow

**Primary Shortcuts**
```
Cmd/Ctrl + K       → Open modal (from anywhere)
Escape             → Close modal
Enter              → Navigate to selected recipe
Cmd/Ctrl + Enter   → Go to full search page with current query
Arrow Up/Down      → Navigate between results
Tab                → Navigate through interactive elements
```

**Search Interaction Flow**
```
1. User presses Cmd+K
2. Modal opens with search input focused
3. User types query (300ms debounce triggers search)
4. Results appear with first result auto-selected
5. User navigates with arrows or clicks
6. Enter navigates to recipe, Escape closes modal
```

### State Management & Transitions

**Loading States**
- Search input shows subtle loading indicator during debounce
- Results area displays skeleton cards during API calls
- Smooth transitions prevent jarring content shifts

**Error Handling**
- Network errors show retry option within modal
- Malformed queries gracefully degrade to empty state  
- API timeouts provide clear feedback with suggested alternatives

**Empty States**
- No query: Show recent searches or popular recipes
- No results: Clear messaging with "See all results" suggestion
- Search suggestions based on available recipes and ingredients

### Micro-Interactions & Animation Specifications

**Modal Entry Animation**
```css
/* Modal backdrop fade-in */
@keyframes backdrop-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
duration: 200ms
easing: ease-out

/* Modal scale-in */  
@keyframes modal-scale-in {
  from { 
    opacity: 0;
    scale: 0.95;
    transform: translateY(-10px);
  }
  to { 
    opacity: 1;
    scale: 1;
    transform: translateY(0);
  }
}
duration: 250ms
easing: cubic-bezier(0.16, 1, 0.3, 1)
```

**Result Card Interactions**
```css
/* Hover transition */
transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)
hover: {
  transform: translateY(-1px)
  box-shadow: enhanced
}

/* Selection indicator */  
selection-border-transition: 150ms ease-in-out
focus-ring-animation: subtle pulse effect
```

---

## 5. Interface Layout & Component Specifications

### Modal Sizing & Positioning

**Desktop Layout**
```
Width: 600px (fixed)
Max-height: 400px (scrollable results)
Position: Centered horizontally, 20vh from top
Padding: 24px
Border-radius: 12px (matching ShadCN card radius)
```

**Tablet Layout (768px - 1024px)**  
```
Width: 90vw (max 500px)
Max-height: 60vh
Position: Centered horizontally, 15vh from top
Padding: 20px
```

**Mobile Layout (< 768px)**
```
Width: 95vw
Max-height: 70vh  
Position: Centered horizontally, 10vh from top
Padding: 16px
Border-radius: 8px (reduced for mobile)
```

### Search Input Specifications

**Layout Structure**
```
┌─────────────────────────────────────────┐
│  🔍  Search recipes, ingredients...    │
│                                         │  
└─────────────────────────────────────────┘
Height: 48px
Icon size: 20px (positioned 12px from left)
Text padding: 16px from icon
```

**Input Behaviors**
- Auto-focus on modal open
- Clear button appears when text is entered  
- Search triggers after 300ms of no typing
- Enter key navigates to first result if available

### Result Item Layout Specifications

**Card Structure**
```
┌────────────────────────────────────────────────────────┐
│  [IMG]  Recipe Title                    Your recipe    │
│         Brief description               ⏱ 30m  👥 4    │  
│         🍝 Italian • 📊 Medium                         │
└────────────────────────────────────────────────────────┘
```

**Detailed Measurements**
```
Card height: 72px (fixed for consistent layout)
Image size: 56x56px with 8px border radius
Content padding: 12px horizontal, 8px vertical
Title font: text-sm font-medium, line-clamp-1
Description: text-xs text-muted-foreground, line-clamp-1
Metadata: text-xs with appropriate semantic colors
```

**Recipe Image Handling**
- Hero image displayed at 56x56px
- Fallback to recipe type icon if no image
- Lazy loading for performance
- Proper alt text for accessibility

### Action Button Specifications

**"See All Results" Button**
```
Position: Bottom of modal, full width
Height: 44px (touch-friendly)
Style: Secondary button variant
Text: "See all results (X)" where X is total count
Keyboard: Focusable via Tab, activated with Enter
```

**Quick Action Hints**
```
Bottom right corner: "Cmd+Enter for full search"
Font: text-xs text-muted-foreground  
Position: Absolute bottom-right with 12px padding
```

---

## 6. Responsive Design & Mobile Considerations

### Breakpoint Strategy

**Large Screens (≥1024px)**
- Full desktop experience with hover states
- Generous spacing and larger click targets
- Keyboard shortcuts prominently displayed

**Medium Screens (768px - 1023px)**  
- Tablet-optimized sizing
- Touch-friendly interactions
- Slightly reduced content density

**Small Screens (<768px)**
- Mobile-first approach
- Larger touch targets (minimum 44px)
- Simplified metadata display
- Swipe gestures for result navigation

### Mobile-Specific Optimizations

**Touch Interactions**
- Increased tap target sizes for all interactive elements
- Proper touch feedback with subtle haptic-like visual responses  
- Swipe left/right to navigate between results (bonus feature)

**Keyboard Behavior**
- Virtual keyboard doesn't overlap modal content
- Search input behavior optimized for mobile keyboards
- Auto-capitalization and spell-check disabled for recipe searches

**Performance Considerations**
- Reduced animation complexity on lower-end devices
- Optimized image loading and caching strategies
- Minimal JavaScript bundle size for fast loading

---

## 7. Integration Points with Existing Search Page

### Data Consistency & API Integration

**Shared Search Logic**
- Leverage existing `searchRecipes` function from `/src/lib/search/recipe-search.ts`
- Use same FTS (Full-Text Search) strategy with multiple fallbacks
- Maintain consistent search ranking and relevance scoring

**Query Parameter Handling**
```typescript
// Modal search params (limited)
interface GlobalSearchParams {
  query: string;
  limit: 10; // Fixed limit for quick results
  userId: string;
}

// Full search page params (comprehensive)
interface FullSearchParams extends GlobalSearchParams {
  cuisine?: string[];
  difficulty?: string[];
  tags?: string[];
  view?: ViewMode;
  sort?: string;
  offset?: number;
}
```

### Navigation & State Management

**Modal to Full Search Transition**
```
User action: Cmd+Enter or "See all results" click
Behavior: 
1. Close modal
2. Navigate to /recipes/search?q={query}
3. Full search page receives query and shows results
4. No page reload, smooth transition
```

**Shared Components & Logic**
- Reuse `RecipeCard` component with `compact` variant
- Leverage existing search result formatting logic
- Share loading states and skeleton components where appropriate

### URL State & Browser History

**Modal Search (No URL Updates)**
- Modal interactions don't update browser history
- Closing modal returns to exact previous state
- No interference with back/forward navigation

**Transition to Full Search (URL Updates)**
- Navigating to full search properly updates URL
- Browser back button returns to previous page (not modal)
- Search query preserved in URL for sharing/bookmarking

---

## 8. Accessibility & Performance Specifications

### WCAG 2.1 AA Compliance

**Color Contrast Validation**
- All text meets minimum 4.5:1 contrast ratio
- Interactive elements meet 3:1 contrast ratio for focus states
- Color is never the sole indicator of information

**Keyboard Navigation Requirements**
```
Tab order: Search input → Results → Action buttons → Close
Focus management: Trap focus within modal when open
ESC behavior: Always closes modal from any focusable element
Arrow keys: Navigate results without losing focus
```

**Screen Reader Support**
```html
<!-- Modal structure with proper ARIA -->
<div role="dialog" aria-labelledby="search-title" aria-describedby="search-help">
  <h1 id="search-title">Recipe Search</h1>
  <input aria-label="Search recipes and ingredients" aria-describedby="search-help" />
  <div id="search-help">Search your recipe collection</div>
  <div role="listbox" aria-label="Search results">
    <div role="option" aria-selected="false">Recipe item</div>
  </div>
</div>
```

### Performance Optimization Strategy

**Search Performance**
- 300ms debounce prevents excessive API calls
- Results cached client-side for repeat queries  
- Maximum 10 results limit ensures fast rendering
- Search cancellation for rapid typing

**Bundle Size Considerations**
- Modal component code-split for on-demand loading
- Shared dependencies with existing search functionality
- Minimal third-party dependencies

**Animation Performance**
- CSS transforms over layout-triggering properties
- GPU acceleration for smooth animations
- Reduced motion support for accessibility preferences

---

## 9. Component Architecture & Development Guidelines

### React Component Structure

```
src/components/modals/
├── global-search-modal.tsx          # Main modal component
├── global-search-input.tsx          # Search input with debouncing  
├── global-search-results.tsx        # Results container
├── global-search-result-card.tsx    # Individual result item
└── global-search-empty-state.tsx    # No results / empty state

src/hooks/
├── use-global-search.ts             # Search logic and state management
├── use-keyboard-shortcuts.ts        # Cmd+K and modal keyboard handling
└── use-debounced-search.ts          # Search debouncing logic

src/lib/server-actions/
└── global-search-actions.ts         # Server actions for quick search
```

### Hook Implementation Guidelines

**useGlobalSearch Hook**
```typescript
interface UseGlobalSearchReturn {
  isOpen: boolean;
  query: string;
  results: QuickSearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  openModal: () => void;
  closeModal: () => void;
  setQuery: (query: string) => void;
  selectResult: (index: number) => void;
  navigateToResult: () => void;
  navigateToFullSearch: () => void;
}
```

**useKeyboardShortcuts Hook**
```typescript
interface UseKeyboardShortcutsProps {
  onOpenSearch: () => void;
  disabled?: boolean;
}

// Handles global Cmd+K detection
// Manages focus trapping within modal
// Provides modal-specific keyboard navigation
```

### Server Action Specifications  

**Quick Search Server Action**
```typescript
export async function quickSearchRecipes(
  userId: string,
  query: string
): Promise<QuickSearchResult[]> {
  // Limit: 10 results maximum
  // Fields: id, title, description, prepTime, cookTime, difficulty, cuisine, heroImage, isPublic, userId
  // Performance: <200ms response time target
  // Caching: 5-minute cache for popular queries
}
```

### Type Definitions

```typescript
interface QuickSearchResult {
  id: string;
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number; 
  difficulty?: RecipeDifficulty;
  cuisine?: string;
  heroImage?: {
    filename: string;
    altText?: string;
  };
  isPublic: boolean;
  userId: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}
```

---

## 10. Implementation Roadmap

### Phase 1: Core Modal Infrastructure (Week 1)
1. **Create modal component structure**
   - Basic modal with search input
   - Keyboard shortcut detection (Cmd+K)  
   - Focus management and ESC to close
   - Responsive sizing and positioning

2. **Implement search input with debouncing**
   - 300ms debounce logic
   - Loading states during search
   - Clear button functionality
   - Mobile keyboard optimizations

3. **Basic styling and animations**
   - Modal enter/exit animations
   - ShadCN color integration
   - Responsive breakpoints
   - Theme compatibility

### Phase 2: Search Integration (Week 2)
1. **Server action for quick search**
   - Leverage existing search infrastructure
   - Limit results to 10 items maximum  
   - Optimize for <200ms response time
   - Error handling and fallbacks

2. **Result display and interaction**
   - Recipe result card component
   - Hover and selection states
   - Keyboard navigation between results
   - Click and Enter to navigate

3. **Empty states and error handling**
   - No query state with suggestions
   - No results state with full search option
   - Network error recovery
   - Graceful degradation

### Phase 3: Enhanced Features (Week 3)  
1. **Full search integration**
   - "See all results" functionality
   - Cmd+Enter to open full search
   - Query parameter passing
   - Smooth navigation transitions

2. **Advanced interactions**
   - Arrow key navigation
   - Result preview on hover
   - Recent searches memory
   - Search query suggestions

3. **Performance optimizations**
   - Client-side result caching
   - Image lazy loading
   - Animation performance tuning
   - Bundle size optimization

### Phase 4: Polish & Accessibility (Week 4)
1. **Accessibility audit and improvements**
   - Screen reader testing
   - Keyboard navigation refinement  
   - Color contrast validation
   - ARIA label optimization

2. **Mobile experience optimization**
   - Touch interaction improvements
   - Virtual keyboard handling
   - Swipe navigation (bonus)
   - Performance on slower devices

3. **Testing and quality assurance**
   - Unit tests for hooks and utilities
   - Integration tests for modal behavior
   - Cross-browser compatibility  
   - Performance benchmarking

### Success Metrics & Testing Criteria

**Performance Targets**
- Modal open time: <100ms
- Search response time: <200ms
- Bundle size impact: <50KB additional
- Accessibility score: WCAG 2.1 AA compliant

**User Experience Validation**  
- Keyboard navigation without mouse: 100% functional
- Mobile touch interactions: Smooth and responsive
- Screen reader compatibility: Full announcement coverage
- Cross-browser support: Chrome, Firefox, Safari, Edge

**Integration Testing**
- Search results match full search page consistency
- Navigation transitions preserve application state
- Error states provide clear recovery paths
- Performance scales with recipe collection size

---

## Conclusion

This comprehensive design specification provides the foundation for implementing TasteBase's global search modal. The design prioritizes the cooking context, emphasizes accessibility, and maintains consistency with the existing design system while introducing powerful new interaction patterns.

The modal serves as both a standalone quick search tool and an entry point to the comprehensive search experience, creating a hybrid approach that scales from quick lookups to detailed exploration. Implementation should proceed through the phased roadmap, with each phase building upon the previous to ensure a robust, performant, and delightful user experience.

Key success factors include maintaining the 300ms search debounce for performance, ensuring full keyboard accessibility for cooking scenarios, and preserving the clean, minimal aesthetic that defines TasteBase's design philosophy.