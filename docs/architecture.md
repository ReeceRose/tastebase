# Architecture Guide

This document outlines the file organization patterns and architectural decisions for Tastebase.

## File Organization Principles

### ✅ Correct Pattern: Component & Lib Organization

```
src/
├── components organized by purpose
│   ├── ui/                      # ShadCN base components  
│   ├── auth/                    # Authentication components
│   ├── profile/                 # Profile management components
│   └── theme/                   # Theme/layout components
├── lib/                         # Shared utilities organized by category
│   ├── auth/                    # Authentication & user management
│   │   ├── auth.ts              # BetterAuth configuration
│   │   ├── auth-client.ts       # Client-side auth instance
│   │   └── auth-actions.ts      # Server actions (auth + profile)
│   ├── config/                  # Configuration files
│   │   └── env.ts               # Environment validation
│   ├── logging/                 # Logging utilities
│   │   └── logger.ts            # Pino logger setup
│   └── utils/                   # General utilities
│       └── utils.ts             # Shared helpers (cn, date utils, etc.)
├── middleware/                  # Next.js middleware
└── app/                         # App router - route definitions ONLY
    ├── (public)/                # Public routes (auth, landing)
    │   └── auth/
    │       └── page.tsx
    ├── api/                     # API routes
    └── <route>/                 # Protected routes (profile, etc.)
        └── page.tsx             # ONLY page components
```

### ❌ Anti-Patterns to Avoid

```
❌ DON'T: Business logic in route directories
src/app/profile/
├── components/           # ← Should be in /src/components/profile/
├── lib/                  # ← Should be in /src/lib/
└── server/               # ← Should be in /src/lib/auth/

❌ DON'T: Wrong categorization in lib
src/lib/
├── profile-form.tsx      # ← Should be in /src/components/profile/
├── auth-config.ts        # ← Should be in /src/lib/auth/
└── date-utils.ts         # ← Should be in /src/lib/utils/

❌ DON'T: Relative imports
import { Component } from "../components/Component";  # ❌
import { Component } from "@/components/profile/Component";  # ✅
```

## Decision Tree: Where Should Code Live?

When adding new code, ask these questions in order:

### 1. Is this a route/page?
**→ `src/app/<route>/page.tsx`** (protected routes)
**→ `src/app/(public)/<route>/page.tsx`** (public routes)
- Only contains the page component
- Imports from components and lib
- Minimal business logic

### 2. Is this a UI component?
**→ `src/components/ui/`** (ShadCN base components)
**→ `src/components organized by purpose>/`** (Feature-specific components)

### 3. Is this authentication/user related?
**→ `src/lib/auth/`** (Auth config, client, server actions)

### 4. Is this configuration?
**→ `src/lib/config/`** (Environment variables, app config)

### 5. Is this logging related?
**→ `src/lib/logging/`** (Logger setup and utilities)

### 6. Is this a general utility?
**→ `src/lib/utils/`** (Shared helpers, types, validations)

## Current Implementation

Tastebase uses a simplified structure focused on individual user recipe management:

### Component Organization
```
src/components/
├── ui/                      # ShadCN base components
├── auth/                    # Authentication components
│   ├── sign-in-form.tsx
│   ├── sign-up-form.tsx
│   └── user-menu.tsx
├── profile/                 # Profile management
│   ├── profile-form.tsx
│   └── password-form.tsx
└── theme/                   # Theme components
    ├── theme-provider.tsx
    └── theme-toggle.tsx
```

### Lib Organization  
```
src/lib/
├── auth/                    # Authentication & user management
│   ├── auth.ts              # BetterAuth configuration
│   ├── auth-client.ts       # Client-side auth instance  
│   └── auth-actions.ts      # Server actions (sign in/out, profile)
├── config/
│   └── env.ts               # Environment validation
├── logging/
│   └── logger.ts            # Pino structured logging
└── utils/
    └── utils.ts             # General utilities (cn, dates, etc.)
```

## Import Patterns

### ✅ Correct Import Examples

```typescript
// Feature components
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";

// Server actions
import { updateProfile, updatePassword } from "@/lib/auth/auth-actions";

// Configuration and utilities
import { env } from "@/lib/config/env";
import { createOperationLogger } from "@/lib/logging/logger";
import { cn, dateUtils } from "@/lib/utils/utils";

// UI components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
```

### ❌ Incorrect Import Examples

```typescript
// ❌ Relative imports
import { ProfileForm } from "../components/profile-form";

// ❌ Wrong lib structure (old paths)
import { auth } from "@/lib/auth"; // Should be "@/lib/auth/auth"
import { env } from "@/lib/config/env"; // Should be "@/lib/config/env"
import { logger } from "@/lib/logging/logger"; // Should be "@/lib/logging/logger"

// ❌ Missing type-only imports  
import { User } from "@/lib/utils/types"; // Should use "import type"
```

## Server Actions Organization

### Authentication & User Management
```typescript
// src/lib/auth/auth-actions.ts
"use server";

// Authentication actions
export async function signUpAction(formData: FormData) {
  // User registration
}

export async function signInAction(formData: FormData) {
  // User login
}

// Profile management actions
export async function updateProfile(formData: FormData) {
  // Update user profile
}

export async function getCurrentUser() {
  // Get current authenticated user
}
```

### Recipe Management (Future)
```typescript
// src/lib/recipes/recipe-actions.ts (when implemented)
"use server";

export async function createRecipe(data: RecipeFormData) {
  // Implementation
}

export async function updateRecipe(id: string, data: RecipeFormData) {
  // Implementation  
}
```

## Component Organization

### Feature Components
- Located in `src/components organized by purpose>/`
- Feature-specific business logic and UI
- Imports from shared components and lib utilities

### Shared UI Components  
- Located in `src/components/ui/` (ShadCN base components)
- Reusable across multiple features
- No feature-specific business logic

### Skeleton Components & Suspense Pattern
- **ALWAYS use Suspense + streaming** for locally hosted apps like Tastebase
- **Create skeleton components** in `src/components/skeletons/` for all dynamic data
- **Separate data components** from page components to enable streaming
- **Page pattern**: Auth only → Suspense wrapper → Data component + Skeleton

### ✅ Correct Page Structure Pattern
```typescript
// src/app/dashboard/page.tsx - ONLY auth, layout, Suspense
export default async function DashboardPage() {
  const session = await auth.api.getSession(); // Fast ~50ms
  if (!session) redirect("/auth/sign-in");

  return (
    <DashboardLayout user={session.user}>
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </DashboardLayout>
  );
}

// src/components/cards/dashboard-stats.tsx - Data fetching component
async function DashboardStats() {
  const data = await getDashboardData(); // Database query ~200ms
  return <div>{/* Render data */}</div>;
}

// src/components/skeletons/dashboard-stats-skeleton.tsx - Loading state
export function DashboardStatsSkeleton() {
  return <div>{/* Skeleton UI matching real component */}</div>;
}
```

## Database Schema Organization

```
db/
├── schema.base.ts              # Core user/auth tables
├── schema.<feature>.ts         # Feature-specific tables
├── schema.ts                   # Main export
└── migrations/                 # Auto-generated
    ├── 0001_initial.sql
    └── meta/
```

## Testing Organization

```
src/
├── __tests__/                  # Global test utilities
├── components/
│   └── profile/
│       └── __tests__/          # Component tests
└── lib/
    ├── auth/
    │   └── __tests__/          # Auth-related tests
    └── utils/
        └── __tests__/          # Utility tests
```

## Benefits of This Architecture

1. **Simplicity** - Clear, intuitive file organization
2. **Categorization** - Lib utilities grouped by purpose (auth, config, logging, utils)
3. **Maintainability** - Clear separation of concerns
4. **Discoverability** - Easy to find related functionality
5. **Developer Experience** - Logical structure that scales with the application
6. **Import Clarity** - Organized import paths that indicate file purpose

## Key Rules Summary

1. **Route directories** contain ONLY `page.tsx` files
2. **Components** are organized by components organized by purpose organized by purpose>/`
3. **Lib utilities** are categorized: `auth/`, `config/`, `logging/`, `utils/`
4. **Always use @/ imports** - never relative imports
5. **Create skeleton components** for all dynamic data
6. **Use TypeScript path aliases** for all imports and exports
7. **Follow the decision tree** when deciding where code belongs

This simplified architecture ensures consistency, maintainability, and easy navigation for individual user recipe management applications.