# Dashboard Page Layout Standards

This document outlines the standardized patterns and best practices for creating user-facing dashboard pages using the DashboardLayout component system. These standards provide consistency across all user dashboard pages in Tastebase.

## Overview

Based on the need for consistent user dashboard experiences, this guide provides the definitive structure for user-facing dashboard pages. The system uses a comprehensive dashboard layout with sidebar navigation and mobile-responsive design.

## Reference Implementation

The main dashboard page (`/src/app/page.tsx`) serves as the **canonical reference implementation** of these standards. It demonstrates:

- Proper use of `DashboardLayout` wrapper component
- Server action integration with authentication
- Suspense boundaries with skeleton loading states
- Mobile-responsive design with ShadCN components
- TypeScript path aliases for all imports and exports

## Required Imports

```typescript
import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout";
import { DashboardLayoutSkeleton } from "@/components/layout";
```

## Standard Page Structure

### 1. Route Protection
Always start with user authentication check:

```typescript
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function DashboardExamplePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }
  // ... rest of component
}
```

### 2. Suspense + Streaming Pattern (REQUIRED)
**ALWAYS use Suspense streaming for locally hosted apps like Tastebase:**

```typescript
export default async function DashboardPage() {
  // ONLY do authentication on server (fast ~50ms)
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="p-6 space-y-4">
        <h1>Welcome back, {session.user.name}!</h1>
        
        {/* Database queries stream in progressively */}
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStats />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

// Separate data component for streaming
async function DashboardStats() {
  const statsResult = await getDashboardStats(); // Database queries happen here
  const stats = statsResult.success ? statsResult.data : null;
  
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Render stats */}
    </div>
  );
}
```

**Performance Benefits:**
- Page shell loads in ~50ms vs ~250ms (80% faster)
- Users see layout immediately, data streams in progressively
- Better development experience with instant feedback

### 3. Layout Wrapper
Always wrap the entire page content in `DashboardLayout`:

```typescript
return (
  <DashboardLayout user={session.user}>
    {/* All page content goes here */}
  </DashboardLayout>
);
```

### 4. Page Header Structure
Use `RecipeHeader` component for recipe-specific pages with search, filters, and view options:

```typescript
<Suspense fallback={<RecipeHeaderSkeleton showSearch showViewToggle showFilters showActions />}>
  <RecipeHeader
    title="My Recipes"
    subtitle="Your personal recipe collection"
    showSearch
    showViewToggle
    showFilters
    showActions
    view={view}
    onViewChange={setView}
    onSearch={handleSearch}
    recipeCount={recipes?.length}
  />
</Suspense>
```

### 5. Content Areas
Organize content within the main area of DashboardLayout:

```typescript
{/* Simple content */}
<div className="p-6 space-y-8">
  <Suspense fallback={<ComponentSkeleton />}>
    <ComponentContent />
  </Suspense>
</div>

{/* Recipe-specific content with header */}
<div className="space-y-6">
  <RecipeHeader {...headerProps} />
  <div className="px-6 pb-6">
    <Suspense fallback={<RecipeListSkeleton />}>
      <RecipeList recipes={recipes} />
    </Suspense>
  </div>
</div>
```

## Component Architecture

### DashboardLayout Component
The main layout wrapper that provides:
- **Sidebar Navigation**: Collapsible sidebar with recipe-focused navigation items
- **Mobile Responsiveness**: Sheet overlay for mobile with hamburger menu
- **User Context**: Integrated user avatar and profile information
- **Consistent Structure**: Fixed header and scrollable main content area

### RecipeHeader Component  
Flexible header component for recipe pages that supports:
- **Search Functionality**: Built-in search input with form submission
- **View Toggle**: Switch between cards, grid, and list views
- **Filter Controls**: Cuisine and difficulty dropdowns with more filters option
- **Action Buttons**: Add recipe and export/import actions
- **Recipe Count**: Dynamic display of filtered recipe counts

### ShadCN Integration
All components utilize ShadCN components:
- **Button** - All interactive elements with proper variants
- **Input** - Form inputs with consistent styling
- **Select** - Dropdown menus for filters
- **Avatar** - User profile display
- **Sheet** - Mobile navigation overlay
- **Badge** - Recipe count and status indicators
- **ScrollArea** - Smooth scrolling areas

## Complete Example Template

```typescript
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { Plus, Heart, Clock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardLayout, DashboardLayoutSkeleton } from "@/components/layout";
import { RecipeHeader, RecipeHeaderSkeleton } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { users, recipes } from "@/db/schema";
import { getRecipeStats } from "@/lib/auth/auth-actions";

export const metadata: Metadata = {
  title: "Recipe Dashboard - Tastebase",
  description: "Your personal recipe collection and cooking dashboard",
};

export default async function RecipeDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Fetch data with error handling
  const [dbUser, recipeStats, recentRecipes] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.user.id)).limit(1).then(r => r[0]).catch(() => undefined),
    getRecipeStats(session.user.id).catch(() => undefined),
    db.select().from(recipes).where(eq(recipes.userId, session.user.id)).limit(5).catch(() => undefined),
  ]);

  if (!dbUser) {
    redirect("/auth/sign-in");
  }

  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardLayout user={session.user}>
        <div className="p-6 space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {session.user.name || "Chef"}!
            </h1>
            <p className="text-muted-foreground">
              Here's your recipe collection overview
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recipeStats?.totalRecipes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Your recipe collection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recipeStats?.favoriteRecipes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Your starred recipes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recipeStats?.recentRecipes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Recipes added recently
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="/recipes/new">Add Recipe</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/recipes">Browse Recipes</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/recipes/favorites">View Favorites</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </Suspense>
  );
}
```

## Dashboard Layout Components

### DashboardLayout

Main layout wrapper that provides the complete dashboard structure with sidebar navigation:

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <SidebarContent pathname={pathname} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with mobile menu */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent pathname={pathname} />
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            {/* User section */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} alt={user.name || user.email} />
                <AvatarFallback>
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### RecipeHeader

Specialized header component for recipe-related pages with search, filtering, and view controls:

```typescript
interface RecipeHeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  onSearch?: (query: string) => void;
  recipeCount?: number;
  className?: string;
}

export function RecipeHeader({
  title,
  subtitle,
  showSearch = false,
  showViewToggle = false,
  showFilters = false,
  showActions = false,
  view = ViewMode.CARDS,
  onViewChange,
  onSearch,
  recipeCount,
  className,
}: RecipeHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="px-6 py-4 space-y-4">
        {/* Title and Actions */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
              {recipeCount !== undefined && (
                <Badge variant="secondary" className="text-sm w-fit">
                  {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Link>
              </Button>

              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Recipes
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export Recipes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Search, Filters, and View Toggle */}
        {(showSearch || showViewToggle || showFilters) && (
          <div className="space-y-4">
            {showSearch && (
              <form onSubmit={(e) => { e.preventDefault(); onSearch?.(searchQuery); }} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="mexican">Mexican</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showViewToggle && (
                <div className="flex items-center border rounded-lg p-1">
                  {[
                    { value: ViewMode.CARDS, icon: LayoutGrid, label: "Cards" },
                    { value: ViewMode.GRID, icon: Grid3X3, label: "Grid" },
                    { value: ViewMode.LIST, icon: List, label: "List" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={view === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onViewChange?.(option.value)}
                      className="h-8 px-3"
                    >
                      <option.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Mobile-Responsive Design Patterns

### Responsive Navigation
- **Desktop**: Fixed sidebar navigation (240px wide)
- **Mobile**: Collapsible sheet overlay triggered by hamburger menu
- **Tablet**: Maintains mobile behavior until lg breakpoint (1024px)

### Header Adaptations
- **Desktop**: Full action buttons with text labels
- **Mobile**: Icon-only buttons with screen reader labels
- **Responsive Spacing**: Automatic stacking on smaller screens

### Content Layout
- **Grid Systems**: Uses CSS Grid with responsive breakpoints (1-2-3 columns)
- **Card Components**: Full-width on mobile, multi-column on larger screens
- **Typography**: Responsive text sizing (text-xl sm:text-2xl pattern)

### Interactive Elements
- **Touch Targets**: Minimum 44px touch targets on mobile
- **Form Controls**: Full-width inputs on mobile with appropriate keyboard types
- **Dropdown Menus**: Convert to sheets or drawers on mobile when needed

## Skeleton Loading Components

### DashboardLayoutSkeleton

Loading state for the entire dashboard layout:

```typescript
export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              <Skeleton className="h-3 w-16 mx-3 mb-4" />
              
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={`nav-item-${index + 1}`} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t">
            <div className="text-center space-y-2">
              <Skeleton className="h-3 w-32 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            <Skeleton className="h-8 w-8 rounded lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded hidden sm:block" />
              <Skeleton className="h-8 w-8 rounded" />
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={`dashboard-card-${index + 1}`} className="space-y-3 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### RecipeHeaderSkeleton

Loading state for recipe headers with optional features:

```typescript
interface RecipeHeaderSkeletonProps {
  showSearch?: boolean;
  showViewToggle?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export function RecipeHeaderSkeleton({
  showSearch = false,
  showViewToggle = false,
  showFilters = false,
  showActions = false,
}: RecipeHeaderSkeletonProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <Skeleton className="h-6 w-48 sm:h-8" />
              <Skeleton className="h-5 w-16 rounded-full w-fit" />
            </div>
            <Skeleton className="h-3 w-64 sm:h-4" />
          </div>

          {showActions && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-8 sm:hidden" />
              <Skeleton className="h-8 w-8" />
            </div>
          )}
        </div>

        {(showSearch || showViewToggle || showFilters) && (
          <div className="space-y-4">
            {showSearch && (
              <Skeleton className="h-9 w-full" />
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-9 w-[140px]" />
                  <Skeleton className="h-9 w-[120px]" />
                  <Skeleton className="h-8 w-24 hidden sm:block" />
                  <Skeleton className="h-8 w-8 sm:hidden" />
                </div>
              )}

              {showViewToggle && (
                <div className="flex items-center border rounded-lg p-1 self-start sm:self-auto">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={`view-toggle-${index + 1}`} className="h-8 w-11 m-0.5" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Responsive Grid Patterns

### Stats Grid Layout
```typescript
// 1-2-3 responsive stats grid for recipe dashboard
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {recipeStats.map((stat) => (
    <Card key={stat.label}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        <stat.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground">{stat.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

### Recipe Cards Layout
```typescript
// Responsive recipe cards with view toggle support
<div className={cn(
  "gap-4",
  view === ViewMode.CARDS && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  view === ViewMode.GRID && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  view === ViewMode.LIST && "flex flex-col space-y-2"
)}>
  {recipes.map((recipe) => (
    <RecipeCard 
      key={recipe.id} 
      recipe={recipe}
      variant={view}
    />
  ))}
</div>
```

### Dashboard Content Layout
```typescript
// Main dashboard content with responsive spacing
<div className="p-6 space-y-8">
  {/* Welcome section */}
  <div className="space-y-2">
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
      Welcome back, {user.name}!
    </h1>
    <p className="text-muted-foreground">
      Here's your recipe collection overview
    </p>
  </div>
  
  {/* Stats cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Card components */}
  </div>
  
  {/* Action cards */}
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2">
      {/* Action buttons */}
    </CardContent>
  </Card>
</div>
```

## File Organization

### Component Structure
```
src/components/layout/
├── dashboard-layout.tsx           # Main layout with sidebar
├── dashboard-layout-skeleton.tsx  # Loading state for layout
├── recipe-header.tsx             # Recipe page header with controls
├── recipe-header-skeleton.tsx    # Loading state for recipe header
└── index.ts                      # Exports all layout components
```

### Export Pattern
```typescript
// src/components/layout/index.ts
export { DashboardLayout } from "./dashboard-layout";
export { DashboardLayoutSkeleton } from "./dashboard-layout-skeleton";
export { RecipeHeader } from "./recipe-header";
export { RecipeHeaderSkeleton } from "./recipe-header-skeleton";
```

### Import Pattern in Pages
```typescript
// In page components
import { Suspense } from "react";
import { DashboardLayout, DashboardLayoutSkeleton } from "@/components/layout";
import { RecipeHeader, RecipeHeaderSkeleton } from "@/components/layout";
```

## Authentication Integration

### User Context Pattern
```typescript
// Always pass authenticated user to DashboardLayout
export default async function RecipePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <DashboardLayout user={session.user}>
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### User-Specific Data Fetching
```typescript
// Fetch user-specific recipe data with error handling
const [recipeStats, recentRecipes] = await Promise.all([
  getRecipeStats(session.user.id).catch(() => undefined),
  getRecentRecipes(session.user.id).catch(() => undefined),
]);
```

## Metadata Standards

### Recipe Page Metadata
```typescript
import type { Metadata } from "next";

// Standard metadata for recipe-focused pages
export const metadata: Metadata = {
  title: "My Recipes - Tastebase",
  description: "Your personal recipe collection and cooking dashboard",
  keywords: ["recipes", "cooking", "personal", "collection", "tastebase"],
};

// Dynamic metadata for specific recipe pages
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const recipe = await getRecipeBySlug(params.slug);
  
  if (!recipe) {
    return {
      title: "Recipe Not Found - Tastebase",
      description: "The requested recipe could not be found",
    };
  }
  
  return {
    title: `${recipe.title} - Tastebase`,
    description: recipe.description || `${recipe.title} recipe from your personal collection`,
    keywords: [`${recipe.title}`, "recipe", "cooking", ...(recipe.tags || [])],
  };
}
```

## Migration Guidelines

When updating existing pages to use these standards:

1. **Replace custom layouts** with `DashboardLayout` wrapper component
2. **Add authentication checks** with proper redirect handling
3. **Implement Suspense boundaries** with skeleton loading states  
4. **Use ShadCN components** throughout (Card, Button, Avatar, etc.)
5. **Add responsive design** with proper mobile breakpoints
6. **Include proper metadata** for SEO and accessibility
7. **Organize content** with proper spacing and hierarchy
8. **Add error handling** in data fetching with `.catch(() => undefined)`

## Current Implementation Status

Pages that follow these standards:
- `/page.tsx` - Main dashboard with DashboardLayout and recipe stats
- `/profile/page.tsx` - Profile page with DashboardLayout wrapper

Components that implement the standards:
- `DashboardLayout` - Complete layout with sidebar and mobile navigation
- `DashboardLayoutSkeleton` - Comprehensive loading state
- `RecipeHeader` - Feature-rich header with search/filters/view toggle
- `RecipeHeaderSkeleton` - Matching skeleton component

## Benefits of This Pattern

- **Consistency**: Uniform look and feel across all dashboard pages
- **User Experience**: Intuitive recipe-focused navigation and functionality
- **Mobile Responsiveness**: Touch-friendly design with proper mobile patterns
- **Accessibility**: ARIA labels, semantic HTML, and keyboard navigation
- **Performance**: Proper loading states and Suspense boundaries
- **Maintainability**: Centralized layout logic and reusable components
- **ShadCN Integration**: Consistent design system with proper theming
- **Recipe-Focused**: Specialized components for recipe management workflows

When creating new pages or refactoring existing ones, always reference this guide and implement the standardized DashboardLayout and RecipeHeader components as shown in the examples above.