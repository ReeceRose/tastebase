# Dashboard Page Layout Standards

This document outlines the standardized patterns and best practices for creating user-facing dashboard pages using the DashboardPageLayout component system. These standards provide consistency across all user dashboard pages.

## Overview

Based on the need for consistent user dashboard experiences, this guide provides the definitive structure for user-facing dashboard pages that are distinct from admin pages but equally well-organized.

## Reference Implementation

The billing page (`/src/app/(dashboard)/dashboard/billing/page.tsx`) serves as the **canonical reference implementation** of these standards. It demonstrates:

- Proper use of `DashboardPageLayout` and `DashboardPageHeader`
- Server action extraction to dedicated modules
- Suspense boundaries with skeleton loading states
- Compact card components with optimal spacing
- TypeScript path aliases for all imports and exports

Refer to this implementation when applying these standards to other dashboard pages.

## Required Imports

```typescript
import { Suspense } from "react";
import {
  DashboardPageHeader,
  DashboardPageLayout,
  DashboardSection,
} from "@/components/dashboard/layout";
import {
  DashboardPageHeaderSkeleton,
  DashboardSectionSkeleton,
} from "@/components/dashboard/skeletons";
```

## Standard Page Structure

### 1. Route Protection
Always start with user authentication check:

```typescript
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth;

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

### 2. Data Fetching Pattern
Use Promise.all for parallel data fetching with error handling:

```typescript
const [userStats, recentActivity, subscriptionInfo] = await Promise.all([
  getUserStats(session.user.id).catch(() => undefined),
  getRecentActivity(session.user.id).catch(() => undefined),
  getSubscriptionInfo(session.user.id).catch(() => undefined),
]);
```

### 3. Layout Wrapper
Always wrap the entire page content in `DashboardPageLayout`:

```typescript
return (
  <DashboardPageLayout>
    {/* All page content goes here */}
  </DashboardPageLayout>
);
```

### 4. Page Header Structure
Use `DashboardPageHeader` with user-focused configuration:

```typescript
<Suspense fallback={<DashboardPageHeaderSkeleton />}>
  <DashboardPageHeader
    title="Dashboard"
    description="Your personal overview with key metrics and quick actions."
    actions={[
      { label: "Quick Setup", icon: Zap, href: "/dashboard/settings" },
      { label: "Export Data", icon: Download, onClick: handleExport },
    ]}
    stats={[
      { label: "Days Active", value: daysSinceJoined },
      { label: "Projects", value: projectCount },
      { label: "Plan", value: currentPlan, status: planStatus },
    ]}
  />
</Suspense>
```

### 5. Content Sections
Organize content using `DashboardSection` with optional headers:

```typescript
{/* Simple Section */}
<DashboardSection>
  <Suspense fallback={<ComponentSkeleton />}>
    <ComponentContent />
  </Suspense>
</DashboardSection>

{/* Section with Header */}
<DashboardSection
  title="Recent Activity"
  description="Your latest actions and updates"
  action={{
    label: "View All",
    href: "/dashboard/activity",
    icon: ArrowRight,
  }}
>
  <Suspense fallback={<ActivitySkeleton />}>
    <ActivityList />
  </Suspense>
</DashboardSection>
```

## Component Variants and Patterns

### Action Types
- `primary` - Main call-to-action buttons
- `secondary` - Secondary actions
- `ghost` - Subtle actions
- `link` - Navigation actions

### Stats Display Types
- `metric` - Numerical values (projects, days, etc.)
- `status` - Status indicators (plan, health, etc.) 
- `progress` - Progress indicators with percentages

### Status Indicator Types
- `success` - Green indicator (active, healthy)
- `warning` - Orange indicator (attention needed)
- `info` - Blue indicator (informational)
- `muted` - Gray indicator (inactive, pending)

## Complete Example Template

```typescript
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { ArrowRight, Download, Zap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  DashboardPageHeader,
  DashboardPageLayout,
  DashboardSection,
} from "@/components/dashboard/layout";
import {
  DashboardPageHeaderSkeleton,
  DashboardSectionSkeleton,
} from "@/components/dashboard/skeletons";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatsSkeleton } from "@/components/dashboard/stats-skeleton";
import { auth } from "@/lib/auth/auth;
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { getUserStats } from "@/features/dashboard/server/stats-actions";

export const metadata: Metadata = {
  title: "Dashboard Overview",
  description: "Your personal dashboard with key metrics and quick actions",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Get user from database for subscription info
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser) {
    redirect("/onboarding");
  }

  // Fetch data with error handling
  const [userStats, recentActivity] = await Promise.all([
    getUserStats(session.user.id).catch(() => undefined),
    getRecentActivity(session.user.id).catch(() => undefined),
  ]);

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(session.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  async function handleExport() {
    "use server";
    // Export logic here
  }

  return (
    <DashboardPageLayout>
      {/* Page Header */}
      <Suspense fallback={<DashboardPageHeaderSkeleton />}>
        <DashboardPageHeader
          title="Dashboard"
          description="Your personal overview with key metrics and quick actions."
          actions={[
            { label: "Quick Setup", icon: Zap, href: "/dashboard/settings" },
            { label: "Export Data", icon: Download, onClick: handleExport },
          ]}
          stats={[
            { label: "Days Active", value: daysSinceJoined, type: "metric" },
            { label: "Projects", value: userStats?.projectCount || 0, type: "metric" },
            { 
              label: "Plan", 
              value: dbUser.personalSubscriptionPlan || "Free",
              type: "status",
              status: dbUser.personalSubscriptionPlan ? "success" : "info"
            },
          ]}
        />
      </Suspense>

      {/* Stats Overview */}
      <DashboardSection>
        <Suspense fallback={<StatsSkeleton />}>
          <StatsCards user={dbUser} />
        </Suspense>
      </DashboardSection>

      {/* Recent Activity */}
      <DashboardSection
        title="Recent Activity"
        description="Your latest actions and updates"
        action={{
          label: "View All Activity",
          href: "/dashboard/activity",
          icon: ArrowRight,
        }}
      >
        <Suspense fallback={<DashboardSectionSkeleton />}>
          <ActivityComponent data={recentActivity} />
        </Suspense>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection
        title="Quick Actions"
        description="Common tasks and shortcuts"
      >
        <Suspense fallback={<DashboardSectionSkeleton />}>
          <QuickActionsGrid user={dbUser} />
        </Suspense>
      </DashboardSection>
    </DashboardPageLayout>
  );
}
```

## Dashboard Layout Components

### DashboardPageLayout

Main page wrapper that provides consistent spacing and structure:

```typescript
interface DashboardPageLayoutProps {
  children: React.ReactNode;
  maxWidth?: "4xl" | "6xl" | "7xl";
  padding?: "default" | "compact" | "spacious";
}

export function DashboardPageLayout({
  children,
  maxWidth = "7xl",
  padding = "default",
}: DashboardPageLayoutProps) {
  const maxWidthClass = {
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl", 
    "7xl": "max-w-7xl",
  }[maxWidth];

  const paddingClass = {
    compact: "p-4 space-y-6",
    default: "p-6 space-y-8",
    spacious: "p-8 space-y-10",
  }[padding];

  return (
    <div className={`${maxWidthClass} mx-auto ${paddingClass}`}>
      {children}
    </div>
  );
}
```

### DashboardPageHeader

Rich header component for page titles, descriptions, and actions:

```typescript
interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "ghost" | "link";
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    type: "metric" | "status" | "progress";
    status?: "success" | "warning" | "info" | "muted";
  }>;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function DashboardPageHeader({
  title,
  description,
  actions = [],
  stats = [],
  breadcrumbs = [],
}: DashboardPageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />}
                {crumb.href ? (
                  <Link 
                    href={crumb.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                size="sm"
                asChild={!!action.href}
                onClick={action.onClick}
                className="cursor-pointer"
              >
                {action.href ? (
                  <Link href={action.href} className="flex items-center gap-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{stat.label}:</span>
              <span className={`text-sm font-medium ${
                stat.status === "success" ? "text-green-600" :
                stat.status === "warning" ? "text-yellow-600" :
                stat.status === "info" ? "text-blue-600" :
                "text-foreground"
              }`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### DashboardSection

Content section wrapper with optional headers:

```typescript
interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  spacing?: "compact" | "default" | "spacious";
}

export function DashboardSection({
  children,
  title,
  description,
  action,
  spacing = "default",
}: DashboardSectionProps) {
  const spacingClass = {
    compact: "space-y-3",
    default: "space-y-4",
    spacious: "space-y-6",
  }[spacing];

  return (
    <div className={spacingClass}>
      {(title || description || action) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {action && (
            <Button
              variant="ghost"
              size="sm"
              asChild={!!action.href}
              onClick={action.onClick}
              className="cursor-pointer"
            >
              {action.href ? (
                <Link href={action.href} className="flex items-center gap-2">
                  {action.label}
                  {action.icon && <action.icon className="h-4 w-4" />}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  {action.label}
                  {action.icon && <action.icon className="h-4 w-4" />}
                </span>
              )}
            </Button>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}
```

## Dashboard Card Components

### DashboardStatsCard

For displaying key metrics and statistics:

```typescript
interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number;
    period: string;
  };
  status?: "success" | "warning" | "info" | "muted";
}

export function DashboardStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = "info",
}: DashboardStatsCardProps) {
  const statusColors = {
    success: "text-green-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
    muted: "text-muted-foreground",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <Card className="border-border/50 bg-card hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className={`h-4 w-4 ${statusColors[status]}`} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        
        <div className="flex items-center gap-2">
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 text-xs ${trendColors[trend.direction]}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend.value}%</span>
              <span className="text-muted-foreground">{trend.period}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### DashboardActionCard

For quick actions and feature access:

```typescript
interface DashboardActionCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: {
    label: string;
    variant: "default" | "success" | "warning" | "secondary";
  };
  disabled?: boolean;
  premium?: boolean;
}

export function DashboardActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  badge,
  disabled = false,
  premium = false,
}: DashboardActionCardProps) {
  const cardContent = (
    <Card className={`
      border-border/50 bg-card transition-all cursor-pointer
      ${disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-border"}
      ${premium ? "border-orange-200 bg-orange-50/50" : ""}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${
                premium ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="space-y-1">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant={badge.variant}>
                    {badge.label}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
    </Card>
  );

  if (href && !disabled) {
    return <Link href={href}>{cardContent}</Link>;
  }

  if (onClick && !disabled) {
    return <div onClick={onClick}>{cardContent}</div>;
  }

  return cardContent;
}
```

## Responsive Grid Patterns

### Stats Grid Layout
```typescript
// 1-2-4 responsive stats grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <DashboardStatsCard key={stat.label} {...stat} />
  ))}
</div>
```

### Action Cards Layout
```typescript
// 1-2-3 responsive action cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {actions.map((action, index) => (
    <DashboardActionCard key={index} {...action} />
  ))}
</div>
```

### Main Content with Sidebar
```typescript
// 2:1 ratio main content with sidebar
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2 space-y-6">
    {/* Main content */}
  </div>
  <div className="space-y-6">
    {/* Sidebar content */}
  </div>
</div>
```

## Skeleton Loading Components

### DashboardPageHeaderSkeleton
```typescript
export function DashboardPageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
```

### DashboardSectionSkeleton
```typescript
export function DashboardSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
```

### DashboardStatsCardsSkeleton
```typescript
export function DashboardStatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Subscription Integration Patterns

### Subscription-Aware Sections
```typescript
import { SubscriptionGuard } from "@/components/subscription-guard";

// Basic feature section
<DashboardSection title="Basic Features">
  <div className="grid md:grid-cols-2 gap-4">
    <DashboardActionCard
      title="Profile Settings"
      description="Update your personal information"
      icon={User}
      href="/dashboard/profile"
    />
    
    <SubscriptionGuard user={dbUser} requiredPlan="pro">
      <DashboardActionCard
        title="Advanced Analytics"
        description="View detailed insights and metrics"
        icon={BarChart}
        href="/dashboard/analytics"
        badge={{ label: "Pro", variant: "secondary" }}
        premium
      />
    </SubscriptionGuard>
  </div>
</DashboardSection>
```

### Plan-Based Stats Display
```typescript
const getSubscriptionStats = (user: User) => {
  const basePlan = user.personalSubscriptionPlan || "free";
  
  return [
    {
      title: "Current Plan",
      value: basePlan.charAt(0).toUpperCase() + basePlan.slice(1),
      subtitle: "Your subscription level",
      icon: CreditCard,
      status: basePlan === "free" ? "muted" : "success" as const,
    },
    {
      title: "Features Available",
      value: getFeatureCount(basePlan),
      subtitle: "Active features",
      icon: Zap,
      status: "info" as const,
    },
  ];
};
```

## Metadata Standards

### Page Metadata Pattern
```typescript
import type { Metadata } from "next";

// Static metadata for standard pages
export const metadata: Metadata = {
  title: "Dashboard Overview",
  description: "Your personal dashboard with key metrics and quick actions",
  keywords: ["dashboard", "overview", "personal", "metrics"],
};

// Dynamic metadata for user-specific pages
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    return {
      title: "Dashboard",
      description: "Personal dashboard",
    };
  }
  
  const displayName = session.user.name ? 
    `${session.user.name}'s Dashboard` : 
    "Dashboard";
    
  return {
    title: displayName,
    description: `Personal dashboard for ${session.user.name || "user"}`,
  };
}
```

## Component File Organization

```
src/components/dashboard/
├── layout/
│   ├── dashboard-page-layout.tsx
│   ├── dashboard-page-header.tsx
│   ├── dashboard-section.tsx
│   └── index.ts
├── cards/
│   ├── dashboard-stats-card.tsx
│   ├── dashboard-action-card.tsx
│   └── index.ts
├── skeletons/
│   ├── dashboard-page-skeletons.tsx
│   ├── dashboard-stats-skeletons.tsx
│   └── index.ts
└── index.ts
```

## Migration Guidelines

When updating existing dashboard pages to use these standards:

1. **Replace custom layouts** with `DashboardPageLayout` wrapper
2. **Replace custom headers** with `DashboardPageHeader` component  
3. **Organize content** into `DashboardSection` components
4. **Add Suspense boundaries** with appropriate skeleton components
5. **Implement error handling** in data fetching with `.catch(() => undefined)`
6. **Add proper metadata** for SEO and accessibility
7. **Use standardized cards** for stats and actions
8. **Ensure responsive design** with proper grid patterns

## Pages Requiring Updates

Current dashboard pages that should be migrated to these standards:

- `/dashboard/page.tsx` - Update to use DashboardPageLayout and standardized components
- `/dashboard/profile/page.tsx` - Add proper header and section organization
- `/dashboard/projects/page.tsx` - Convert to card-based layout with DashboardSection
- `/dashboard/settings/page.tsx` - Organize settings into proper sections
- `/dashboard/billing/page.tsx` - Use DashboardPageLayout with sidebar pattern
- `/dashboard/example/page.tsx` - Convert feature examples to use DashboardActionCard

## Benefits of This Pattern

- **Consistency**: Uniform look and feel across all dashboard pages
- **User Experience**: Intuitive navigation and information architecture
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Accessibility**: Built-in ARIA labels and semantic structure
- **Performance**: Proper loading states and error boundaries
- **Maintainability**: Standardized structure reduces development time
- **Subscription Integration**: Seamless plan-based feature gating
- **Scalability**: Easy to add new pages following established patterns

When creating new dashboard pages or refactoring existing ones, always reference this guide and implement the standardized components and patterns outlined above.