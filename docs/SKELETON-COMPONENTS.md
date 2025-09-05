# Skeleton Components Guide

Complete guide to using Skeleton components for loading states in Tastebase.

## Overview

Skeleton components provide visual placeholders while content is loading, improving perceived performance and user experience. This guide covers implementation patterns and best practices for Tastebase.

## Basic Skeleton Component

The base Skeleton component is located at `src/components/ui/skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils/utils;

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

## Basic Usage

### Simple Text Placeholder
```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Single line of text
<Skeleton className="h-4 w-32" />

// Multiple lines with varying widths
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Button Placeholder
```tsx
<Skeleton className="h-10 w-24 rounded-md" />
```

### Image Placeholder
```tsx
<Skeleton className="h-32 w-32 rounded-lg" />
```

## Common Skeleton Patterns

### User Profile Skeleton
```tsx
export function UserProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
```

### Card Skeleton
```tsx
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
```

### Table Skeleton
```tsx
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      
      <div className="flex space-x-4 pb-4 border-b">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
```

## Feature-Specific Skeletons

### Organization Member Skeleton
```tsx
export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Dashboard Stats Skeleton
```tsx
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
```

### Project List Skeleton
```tsx
export function ProjectListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Using with Suspense

### Page-Level Loading
```tsx
import { Suspense } from "react";
import { DashboardStatsSkeleton } from "./dashboard-stats-skeleton";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
```

### Component-Level Loading
```tsx
export function UserProfile({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfileData userId={userId} />
    </Suspense>
  );
}

async function UserProfileData({ userId }: { userId: string }) {
  const user = await getUserById(userId);
  
  return (
    <div className="flex items-center space-x-4">
      <Avatar>
        <AvatarImage src={user.imageUrl} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{user.name}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Match Content Structure
Skeleton layouts should closely match the final content structure:

```tsx
// Good - matches actual content layout
export function ArticleSkeleton() {
  return (
    <article className="space-y-4">
      <Skeleton className="h-8 w-3/4" />  
      <Skeleton className="h-4 w-1/3" />  
      <div className="space-y-2">         
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </article>
  );
}
```

### 2. Use Appropriate Dimensions
```tsx
// Text skeletons
<Skeleton className="h-4 w-32" />     // Single line text
<Skeleton className="h-6 w-48" />     // Heading
<Skeleton className="h-3 w-24" />     // Small text

// Interactive elements
<Skeleton className="h-10 w-24" />    // Button
<Skeleton className="h-9 w-full" />   // Input field

// Images and avatars
<Skeleton className="h-32 w-32" />    // Square image
<Skeleton className="h-10 w-10 rounded-full" /> // Avatar
```

### 3. Loading State Management
```tsx
"use client";

import { useEffect, useState } from "react";

export function DataWithSkeleton() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);
  
  if (isLoading) {
    return <DataSkeleton />;
  }
  
  return <DataDisplay data={data} />;
}
```

### 4. Responsive Skeletons
```tsx
export function ResponsiveSkeleton() {
  return (
    <div className="space-y-4">
      
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <Skeleton className="h-32 w-full md:w-48" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
```

## Animation Customization

### Custom Pulse Animation
```tsx
// In your global CSS or component styles
.skeleton-slow {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-fast {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

// Usage
<Skeleton className="h-4 w-32 skeleton-slow" />
```

### Wave Animation (Optional Enhancement)
```tsx
// Custom wave skeleton component
export function WaveSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted rounded-md",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
};
```

## Common Patterns by Page Type

### Dashboard Page
```tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />  
      
      <DashboardStatsSkeleton /> 
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <TableSkeleton rows={5} />
        </div>
      </div>
    </div>
  );
}
```

### Settings Page
```tsx
export function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      
      
      <div className="lg:col-span-3 space-y-6">
        <Skeleton className="h-8 w-32" />
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
        
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

## Testing Skeleton Components

### Visual Testing
```tsx
// Create a skeleton showcase page for visual testing
export default function SkeletonShowcase() {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <UserProfileSkeleton />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Dashboard Stats</h2>
        <DashboardStatsSkeleton />
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Project List</h2>
        <ProjectListSkeleton />
      </section>
    </div>
  );
}
```

### Unit Testing
```tsx
import { render } from "@testing-library/react";
import { UserProfileSkeleton } from "./user-profile-skeleton";

test("renders skeleton with correct structure", () => {
  const { container } = render(<UserProfileSkeleton />);
  
  // Check for skeleton elements
  const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
  expect(skeletons).toHaveLength(3); // Avatar + name + email
  
  // Check for proper classes
  expect(skeletons[0]).toHaveClass("rounded-full");
});
```

## Performance Considerations

1. **Avoid Over-Skeletonization**: Don't create skeletons that are more complex than necessary
2. **Reuse Components**: Create reusable skeleton components for common patterns
3. **Lazy Load Skeletons**: For complex skeletons, consider lazy loading them
4. **CSS Animations**: Prefer CSS animations over JavaScript for better performance

This guide ensures consistent, professional loading states throughout your recipe management application while maintaining good performance and user experience.