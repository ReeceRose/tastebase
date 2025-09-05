# Refactoring Guide: SaaS Template to Recipe App

**Purpose:** Detailed guide for transforming the inherited SaaS template into a focused recipe management application  
**Target Audience:** Developers working on Phase 0 (Foundation & Cleanup)  
**Prerequisites:** Understanding of the current codebase structure and project conventions

---

## Overview

This guide provides specific instructions for refactoring the inherited SaaS template to create a clean foundation for the recipe management application. The refactoring focuses on removing unnecessary features, updating authentication patterns, and establishing proper database schema organization.

## Current State Analysis

### ✅ Keep and Enhance
- **Next.js 15+ App Router** - Already optimized for the project
- **BetterAuth** - Already integrated, needs configuration refinement  
- **Drizzle ORM with SQLite** - Core technology, needs schema restructuring
- **ShadCN/UI Components** - Perfect for recipe interfaces
- **Pino Logging System** - Production-ready logging infrastructure
- **Feature-based Architecture** - Excellent for modular recipe features
- **Comprehensive Development Scripts** - Valuable for code quality

### ❌ Remove Completely
- **Stripe Integration** - Not needed for single-user recipe app
- **Organization/Team Features** - Recipe app is single-user focused
- **Billing/Subscription Logic** - No monetization in MVP
- **Multi-tenant Architecture** - Single-user simplification
- **Payment Webhooks** - No payment processing needed

### 🔧 Refactor and Adapt
- **Authentication System** - Simplify for single-user usage
- **Database Schema** - Move recipes to proper modular structure
- **Navigation Components** - Update for recipe-focused workflows
- **User Management** - Simplify without organizations/billing

---

## Detailed Refactoring Instructions

### 1. Remove SaaS Features

#### 1.1 Stripe/Billing Removal
```bash
# Files to delete (if they exist):
rm -rf src/features/billing/
rm -rf src/features/subscriptions/
rm -rf src/app/api/webhooks/stripe/
rm -rf src/components/billing/
rm -rf src/lib/stripe*

# Search for and remove Stripe references:
grep -r "stripe" src/ --exclude-dir=node_modules
grep -r "billing" src/ --exclude-dir=node_modules
grep -r "subscription" src/ --exclude-dir=node_modules
```

#### 1.2 Organization Features Removal
```bash
# Files to delete (if they exist):
rm -rf src/features/organizations/
rm -rf src/app/api/webhooks/clerk/
rm -rf src/components/organization/
rm -rf src/lib/organizations*

# Remove organization references:
grep -r "organization" src/ --exclude-dir=node_modules
grep -r "team" src/ --exclude-dir=node_modules
grep -r "member" src/ --exclude-dir=node_modules
```

#### 1.3 Clean Package.json Dependencies
```json
// Remove these dependencies if present:
"stripe": "...",
"@clerk/nextjs": "...",
"@stripe/stripe-js": "...",

// Keep these key dependencies:
"better-auth": "1.3.7",
"@libsql/client": "0.15.14",
"drizzle-orm": "0.44.5",
"next": "15.5.2"
```

### 2. Database Schema Refactoring

#### 2.1 Current Schema Issues
```typescript
// Current problematic structure in schema.base.ts:
export const recipes = sqliteTable("recipes", {
  // This belongs in a separate recipes schema file
});
```

#### 2.2 Proper Schema Organization
```typescript
// Create: src/db/schema.recipes.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./schema.base";

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  servings: integer("servings"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }),
  cuisine: text("cuisine"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),
  isArchived: integer("is_archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: text("amount"), // Store as string to handle fractions
  unit: text("unit"),
  notes: text("notes"),
  groupName: text("group_name"), // For ingredient sections
  sortOrder: integer("sort_order").notNull(),
  isOptional: integer("is_optional", { mode: "boolean" }).default(false).notNull(),
});

export const recipeInstructions = sqliteTable("recipe_instructions", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  instruction: text("instruction").notNull(),
  timeMinutes: integer("time_minutes"),
  temperature: text("temperature"),
  notes: text("notes"),
  groupName: text("group_name"), // For instruction sections
});

export const recipeTags = sqliteTable("recipe_tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color"),
  category: text("category"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const recipeTagRelations = sqliteTable("recipe_tag_relations", {
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => recipeTags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.recipeId, table.tagId] }),
}));

export const recipeImages = sqliteTable("recipe_images", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  isHero: integer("is_hero", { mode: "boolean" }).default(false).notNull(),
  sortOrder: integer("sort_order").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const recipeNotes = sqliteTable("recipe_notes", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  rating: integer("rating"), // 1-5 stars
  isPrivate: integer("is_private", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// Define relationships
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  ingredients: many(recipeIngredients),
  instructions: many(recipeInstructions),
  tags: many(recipeTagRelations),
  images: many(recipeImages),
  notes: many(recipeNotes),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
}));

// ... other relations
```

#### 2.3 Update Main Schema Export
```typescript
// Update: src/db/schema.ts
// Base schema (auth tables)
export * from "@/db/schema.base";

// Feature schemas
export * from "@/db/schema.recipes";

// Remove the old recipe table from schema.base.ts
```

#### 2.4 Clean Up Base Schema
```typescript
// Update: src/db/schema.base.ts
// Remove the recipe table and keep only auth-related tables:
export const users = sqliteTable("users", {
  // Keep user table for BetterAuth
});

export const accounts = sqliteTable("accounts", {
  // Keep for BetterAuth
});

export const sessions = sqliteTable("sessions", {
  // Keep for BetterAuth
});

export const verificationTokens = sqliteTable("verification_tokens", {
  // Keep for BetterAuth
});

// REMOVE: export const recipes = ... (move to schema.recipes.ts)
```

### 3. BetterAuth Configuration Refinement

#### 3.1 Current Auth Configuration Issues
```typescript
// Current auth.ts may have organization features or complex setup
// Simplify for single-user recipe app
```

#### 3.2 Optimized Auth Configuration
```typescript
// Update: src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/lib/config/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false, // Simplify for single-user
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  // Remove organization/team features
  // socialProviders can be added later if needed
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
});
```

#### 3.3 Simplified Auth Actions
```typescript
// Update: src/lib/auth-actions.ts
"use server";

import { auth } from "@/lib/auth/auth;
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(({ headers }) => headers()),
  });
  
  if (!session) {
    redirect("/auth/sign-in");
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(({ headers }) => headers()),
  });
  
  return session?.user ?? null;
}

// Remove organization-related auth functions
```

### 4. Environment Variables Cleanup

#### 4.1 Updated Environment Variables
```bash
# Update: .env.example
# Database
DATABASE_URL="http://127.0.0.1:8080"

# App Configuration  
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication
BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-chars-long"
BETTER_AUTH_URL="http://localhost:3000"

# AI Services (for Phase 3)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760" # 10MB

# Remove these if present:
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
# CLERK_SECRET_KEY
# CLERK_WEBHOOK_SECRET
```

### 5. Navigation and UI Component Updates

#### 5.1 Dashboard Navigation Refactoring
```typescript
// Update navigation items in dashboard components
// Remove: Billing, Organizations, Subscriptions
// Add: Recipes, Collections, Import, Search

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Recipes",
    href: "/dashboard/recipes",
    icon: BookOpenIcon,
  },
  {
    name: "Collections",
    href: "/dashboard/collections", 
    icon: FolderIcon,
  },
  {
    name: "Import",
    href: "/dashboard/import",
    icon: PlusIcon,
  },
  {
    name: "Search",
    href: "/dashboard/search",
    icon: MagnifyingGlassIcon,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: CogIcon,
  },
];
```

#### 5.2 Settings Page Simplification
```typescript
// Simplify settings to remove billing/organization sections
const settingsSections = [
  {
    name: "Profile",
    description: "Manage your account information",
    href: "/dashboard/settings/profile",
  },
  {
    name: "Preferences", 
    description: "Recipe display and cooking preferences",
    href: "/dashboard/settings/preferences",
  },
  {
    name: "Import Settings",
    description: "AI import and parsing preferences", 
    href: "/dashboard/settings/import",
  },
  {
    name: "Data",
    description: "Export and backup your recipes",
    href: "/dashboard/settings/data",
  },
  // Remove: Billing, Organization, Teams
];
```

### 6. Feature Directory Cleanup

#### 6.1 Remove Unused Features
```bash
# Remove these directories if they exist:
rm -rf src/features/billing/
rm -rf src/features/organizations/
rm -rf src/features/subscriptions/
rm -rf src/features/admin/ # Remove if not needed
```

#### 6.2 Update Existing Features
```bash
# Keep and update these features:
src/features/dashboard/    # Update for recipe-focused dashboard
src/features/profile/      # Keep for user profile management  
src/features/settings/     # Simplify settings pages
```

#### 6.3 Prepare for New Features
```bash
# Create structure for Phase 2:
mkdir -p src/features/recipes/components/forms/
mkdir -p src/features/recipes/components/display/
mkdir -p src/features/recipes/components/management/
mkdir -p src/features/recipes/components/skeletons/
mkdir -p src/features/recipes/server/
mkdir -p src/features/recipes/lib/
mkdir -p src/features/recipes/hooks/
```

### 7. Documentation Updates

#### 7.1 Update CLAUDE.md
```markdown
# Key sections to update in CLAUDE.md:

## Project Overview
- Update description to "recipe management application"
- Remove references to SaaS, billing, organizations

## Tech Stack  
- Update authentication to "BetterAuth (single-user authentication)"
- Remove Stripe, payment references
- Add AI integration references for Phase 3

## Features & Implementation
- Remove billing, subscription, organization sections
- Add recipe management, AI import, search sections
- Update authentication section for single-user patterns

## Architecture Patterns
- Update feature examples to include recipes
- Remove billing/organization feature examples
- Update route structure for recipe app patterns
```

#### 7.2 Update README.md
```markdown
# Update main sections:
- Project description: recipe management focus
- Features list: recipe CRUD, AI import, search
- Setup instructions: simplified without billing setup
- Tech stack: remove payment/organization mentions
```

### 8. Database Migration Strategy

#### 8.1 Migration Plan
```sql
-- Step 1: Create new recipe schema tables
-- (Generated by drizzle-kit from new schema)

-- Step 2: If existing recipe data, migrate it
-- (Custom migration script if needed)

-- Step 3: Remove old tables
-- DROP TABLE old_recipe_table; (if exists)

-- Step 4: Clean up auth tables
-- Remove organization/billing related columns from users table
```

#### 8.2 Migration Commands
```bash
# Generate migration for new schema:
pnpm run db:generate

# Review generated migration files in src/db/migrations/

# Run migrations:
pnpm run db:migrate

# Verify with database studio:
pnpm run db:studio
```

---

## Refactoring Checklist

### ✅ Phase 0 Cleanup Complete When:

#### Code Removal
- [ ] All Stripe/billing code removed
- [ ] Organization/team features deleted  
- [ ] Payment webhooks and API routes removed
- [ ] Unused dependencies removed from package.json
- [ ] Dead code and imports cleaned up

#### Database Refactoring
- [ ] Recipe schema moved to proper modular structure
- [ ] Database relationships properly defined
- [ ] Migration generated and tested
- [ ] Old schema elements removed
- [ ] Database indexes created for performance

#### Authentication Simplification  
- [ ] BetterAuth optimized for single-user usage
- [ ] Organization features removed from auth
- [ ] Auth actions simplified and cleaned
- [ ] Session management optimized
- [ ] Auth UI updated for recipe app context

#### Configuration Updates
- [ ] Environment variables cleaned and documented
- [ ] Docker configuration updated for recipe app
- [ ] Next.js config optimized for single-user app
- [ ] Development scripts updated
- [ ] Production configuration prepared

#### UI/UX Updates
- [ ] Navigation updated for recipe workflows
- [ ] Dashboard updated for recipe management
- [ ] Settings simplified (no billing/org)
- [ ] Landing pages updated for recipe context
- [ ] Error pages and empty states updated

#### Documentation
- [ ] CLAUDE.md updated for recipe app
- [ ] README.md reflects new project focus
- [ ] Environment variables documented
- [ ] Setup instructions simplified
- [ ] Architecture documentation updated

### Testing Validation
- [ ] Application starts successfully after refactoring
- [ ] Authentication flows work correctly
- [ ] Database operations function properly
- [ ] No broken imports or references remain
- [ ] Development scripts execute successfully
- [ ] Docker deployment works (if applicable)

---

## Common Issues and Solutions

### Issue: Database Migration Errors
```bash
# Solution: Reset database and regenerate
rm -f *.db *.db-shm *.db-wal
pnpm run db:generate
pnpm run db:migrate
```

### Issue: Import Errors After File Removal
```bash
# Solution: Search for broken imports
grep -r "import.*from.*billing" src/
grep -r "import.*from.*organization" src/
# Fix each import by removing or updating the path
```

### Issue: TypeScript Errors from Removed Types
```bash
# Solution: Find and remove type references
grep -r "BillingType\|OrganizationType" src/
# Remove or replace with appropriate recipe types
```

### Issue: Runtime Errors from Missing Components
```bash
# Solution: Search for component usage
grep -r "BillingComponent\|OrganizationComponent" src/
# Remove or replace with appropriate components
```

---

## Validation Commands

```bash
# After refactoring, run these commands to validate:

# 1. Check for build errors
pnpm run build

# 2. Run linting
pnpm run lint

# 3. Check types
pnpm run type-check

# 4. Test database
pnpm run db:studio

# 5. Start development server
pnpm run dev

# 6. Run health checks
pnpm run health-check

# 7. Check for unused code
pnpm run unused-code

# 8. Verify architecture
pnpm run architecture
```

**Next Step:** Once refactoring is complete, proceed to Phase 1 (Core Infrastructure) to build the recipe management features on this clean foundation.