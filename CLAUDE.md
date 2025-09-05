# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tastebase is a local-first, personal recipe management application designed for individual users who want to collect, organize, and manage their recipes on their own computer. Built for Docker deployment with local SQLite storage - no cloud dependencies, no subscriptions, just your personal recipe collection stored securely on your machine.

The architecture is feature-based with each feature contained in `/src/features/<feature-name>/` directories, making it easy to extend functionality.

## Tech Stack

- **Framework**: Next.js 15.5+ with App Router and Server Actions
- **Authentication**: BetterAuth (email/password authentication)
- **Database**: Local SQLite + Drizzle ORM with better-sqlite3
- **UI**: Tailwind CSS + ShadCN/UI components
- **Testing**: Vitest for unit/integration tests
- **Environment**: @t3-oss/env-nextjs for type-safe validation
- **Deployment**: Docker with persistent local volumes
- **Logging**: Pino structured logging with context-aware loggers
- **File Storage**: Local filesystem for recipe images and attachments

## Server Logging

Use structured logging with pino for all server-side operations:

```typescript
// Operation logger for general operations
import { createOperationLogger, logError } from "@/lib/logging/logger";
const logger = createOperationLogger("operation-name");

// User-specific logger  
const userLogger = createUserLogger(userId);

// Recipe-specific logger
const recipeLogger = createOperationLogger("recipe-operations");

// Proper pino format: object first, message second
logger.info({ key: "value" }, "Operation completed");
logError(logger, "Error message", error, { context });
```

**Guidelines**: Use pino loggers for server-side code (API routes, server actions, middleware). Keep console.log for client-side React components and development debugging. See `/docs/server-logging-guide.md` for comprehensive examples.

## Development Commands

```bash
# Initial Setup
pnpm install
cp .env.example .env.local  # Then fill in environment variables

# Database Operations
pnpm run db:migrate          # Run pending migrations
pnpm run db:seed            # Seed development data
pnpm run db:generate        # Generate migration from schema changes
pnpm run db:studio          # Open Drizzle Studio

# Development
pnpm run dev                # Start development server
pnpm run build             # Build for production
pnpm run start             # Start production server

# Testing
pnpm run test              # Run unit tests
pnpm run test:coverage     # Run tests with coverage report
pnpm run test:watch        # Run tests in watch mode

# Code Quality
pnpm run lint              # Run ESLint
pnpm run type-check        # Run TypeScript checks
pnpm run unused-code           # Find unused code (quick)
pnpm run unused-code:verbose   # Find unused code (detailed)
pnpm run unused-code:json      # Output results as JSON
pnpm run unused-code:ci        # CI mode (fails if unused code found)
pnpm run large-files           # Find large files (≥5KB)
pnpm run large-files:verbose   # Find large files (detailed)
pnpm run small-files           # Find small files (≤1KB) - detect empty files
pnpm run small-files:verbose   # Find small files (detailed)
pnpm run import-issues         # Find import problems (circular deps, unused imports)
pnpm run import-issues:verbose # Find import problems (detailed output)
pnpm run import-issues:circular # Only check circular dependencies
pnpm run import-issues:relative # Only check relative import violations
pnpm run import-issues:unused  # Only check unused imports
pnpm run import-issues:ci      # CI mode (fails on critical import issues)
pnpm run code-quality          # Find code quality issues (debug code, TODOs, type safety)
pnpm run code-quality:verbose  # Find code quality issues (detailed output)
pnpm run code-quality:debug    # Only check debug code (console.log, debugger)
pnpm run code-quality:todos    # Only check TODO/FIXME comments
pnpm run code-quality:types    # Only check type safety issues (any, @ts-ignore)
pnpm run code-quality:ci       # CI mode (fails on critical quality issues)
pnpm run architecture          # Validate architecture patterns and organization
pnpm run architecture:verbose  # Architecture validation (detailed output)
pnpm run architecture:routes   # Only check route structure violations
pnpm run architecture:imports  # Only check import path violations
pnpm run architecture:features # Only check feature organization issues
pnpm run architecture:size     # Only check file size issues
pnpm run architecture:naming   # Only check naming convention violations
pnpm run architecture:ci       # CI mode (fails on critical architecture violations)
pnpm run test-coverage         # Analyze test coverage and identify gaps
pnpm run test-coverage:verbose # Test coverage analysis (detailed output)
pnpm run test-coverage:untested # Only show untested files
pnpm run test-coverage:critical # Only show critical files without tests
pnpm run test-coverage:components # Only analyze component test coverage
pnpm run test-coverage:actions # Only analyze server action test coverage
pnpm run test-coverage:ci      # CI mode (fails on critical coverage gaps)
pnpm run performance           # Analyze performance bottlenecks and optimization opportunities
pnpm run performance:verbose   # Performance analysis (detailed output with suggestions)
pnpm run performance:blocking  # Only check blocking operations (sync file I/O, crypto)
pnpm run performance:queries   # Only check database query efficiency (N+1, missing limits)
pnpm run performance:render    # Only check React render performance issues
pnpm run performance:bundle    # Only check bundle size optimization opportunities
pnpm run performance:async     # Only check async pattern issues (error handling, parallelization)
pnpm run performance:ci        # CI mode (fails on critical performance issues)

# Comprehensive Health Checks
pnpm run health-check          # Run all codebase health checks
pnpm run health-check:quick    # Quick critical checks only (fast PR feedback)
pnpm run health-check:critical # Only critical health checks
pnpm run health-check:verbose  # Detailed output for all checks
pnpm run health-check:failed   # Show only failed checks in summary
pnpm run health-check:ci       # CI mode with proper exit codes
pnpm run health-check:full-report # Comprehensive detailed report with complete output

# Usage Analysis
pnpm run check-usage           # Analyze usage patterns for files/components
pnpm run check-usage:imports   # Quick file import check (recommended)
pnpm run check-usage:verbose   # Detailed analysis with debug info
pnpm run check-usage:json      # JSON output for automation

# Local Deployment (Docker)
docker-compose up -d      # Start Tastebase locally
docker-compose down       # Stop Tastebase
docker-compose pull       # Update to latest version
```

## CI/CD Integration

The codebase includes comprehensive health monitoring integrated into GitHub Actions workflows for automated quality gates:

### GitHub Actions Workflow

The `.github/workflows/codebase-health.yml` workflow provides:

- **Matrix Strategy**: Parallel execution of all health checks for fast feedback
- **Critical vs Non-Critical**: Distinguishes between blocking and informational issues
- **Smart Caching**: Optimized pnpm and dependency caching for performance
- **Multi-Trigger**: Runs on push, PR, schedule, and manual dispatch
- **Artifact Generation**: Comprehensive health reports uploaded as CI artifacts
- **PR Comments**: Automated health report comments on pull requests

### Workflow Jobs

1. **health-check**: Matrix job running all health monitors in parallel
2. **health-report**: Generates comprehensive health report artifacts
3. **quick-health**: Fast critical-only checks for immediate PR feedback
4. **security-health**: Security and dependency analysis

### Quality Gates

**Critical Checks (Block CI/Deployment):**
- Code Quality: Debug code (console.log, debugger statements)
- Architecture: Relative imports, route structure violations
- Import Issues: Circular dependencies, import violations

**Non-Critical Checks (Informational):**
- Performance: Optimization opportunities
- Test Coverage: Missing tests and coverage gaps  
- Unused Code: Dead code and unused exports

### Local CI Testing

```bash
# Run all health checks (matches CI)
pnpm run health-check:ci

# Quick critical checks (matches PR quick-health job)
pnpm run health-check:quick

# Verbose output for debugging CI failures
pnpm run health-check:verbose

# Only show failed checks
pnpm run health-check:failed
```

### CI Integration Benefits

- **Fast Feedback**: Quick checks run in <5 minutes for PR feedback
- **Parallel Execution**: All checks run simultaneously for efficiency
- **Smart Failure Handling**: Critical vs non-critical failure distinction
- **Rich Reporting**: Detailed health reports with actionable insights
- **Artifact Storage**: 30-day retention of health reports for analysis
- **PR Integration**: Automated health report comments on pull requests

## Architecture Patterns

### Feature-Based Structure
Each feature lives in `/src/features/<feature-name>/` with a standardized structure:

```
src/features/<feature-name>/
├── components/               # Feature-specific React components
│   ├── <feature>-form.tsx   # Form components
│   ├── <feature>-list.tsx   # List/table components  
│   ├── <feature>-detail.tsx # Detail view components
│   └── skeletons/           # Loading state components
│       ├── <feature>-form-skeleton.tsx
│       └── <feature>-list-skeleton.tsx
├── server/                  # Server-side logic
│   ├── actions.ts          # Server Actions for CRUD operations
│   └── queries.ts          # Database queries (if complex)
├── hooks/                   # Custom React hooks (optional)
│   └── use-<feature>.ts
└── lib/                     # Feature-specific utilities (optional)
    ├── validations.ts       # Zod schemas
    └── utils.ts            # Helper functions
```

**Existing Feature Examples:**
- `src/features/dashboard/` - Dashboard overview and navigation
- `src/features/profile/` - User profile management
- `src/features/settings/` - Application settings

### Database Schema Organization
- `db/schema.base.ts` - Base auth schema (BetterAuth tables)
- `db/schema.recipes.ts` - Recipe-specific tables and relationships
- `db/schema.ts` - Main export combining all schemas
- `db/migrations/` - Auto-generated migration files

### Route Structure
- `src/app/(public)/` - Unauthenticated pages (sign-in, sign-up, landing)
- `src/app/(dashboard)/` - Protected dashboard pages (should ONLY contain page.tsx files)
- `src/app/api/` - API routes (primarily webhooks)

**Important**: Route directories should be kept minimal and only contain page.tsx files. All components, server actions, and business logic should live in `/src/features/` or `/src/components/` directories.

### Shared Code Organization
- `src/components/ui/` - ShadCN base UI components
- `src/components/dashboard/` - Shared dashboard layout components
- `src/lib/` - Shared utilities organized by category:
  - `src/lib/auth/` - Authentication configuration, client, and server actions
  - `src/lib/config/` - Environment variables and configuration
  - `src/lib/logging/` - Structured logging utilities with Pino
  - `src/lib/utils/` - General utilities (cn, date formatting, error handling)
- `src/middleware/` - Authentication and route protection
- `src/hooks/` - Global custom React hooks

## Recipe Management Features

Tastebase provides comprehensive recipe management capabilities:

### Core Recipe Features
- **Recipe Storage**: Create, edit, and organize personal recipes
- **Ingredient Management**: Track ingredients with quantities and units
- **Recipe Categories**: Organize recipes by cuisine, meal type, or custom tags
- **Recipe Images**: Upload and store recipe photos locally
- **Recipe Notes**: Add personal notes and modifications to recipes
- **Recipe Search**: Find recipes by name, ingredients, or tags

### Database Schema Structure
```typescript
// Recipe-related tables:
// - recipes (main recipe data)
// - recipe_ingredients (structured ingredients)
// - recipe_instructions (step-by-step instructions)  
// - recipe_tags (tagging system)
// - recipe_images (image metadata)
// - recipe_notes (user notes)
```

### File Storage
- Recipe images stored locally in `./uploads` directory
- Configurable file size limits and supported formats
- Automatic image optimization and thumbnails

## Key Features & Implementation

### Authentication (BetterAuth)
- Middleware in `src/middleware.ts` handles route protection
- Simple email/password authentication for single-user recipe management
- User profile management integrated with custom database schema
- Session management with secure cookie handling
- No organization or multi-user features - designed for personal use

### Database (SQLite + Drizzle)
- Local SQLite database with better-sqlite3 driver
- Type-safe queries with Drizzle ORM
- Modular schema approach - recipe schema in `schema.recipes.ts`
- Database connection and migrations in `db/index.ts` and `db/migrate.ts`
- Persistent local storage for recipes, ingredients, and user data
- **Troubleshooting**: If better-sqlite3 fails to install, manually build with: `cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && pnpm run build-release`

### Recipe Management Features
- **Recipe Storage**: Create, edit, and organize personal recipes
- **Ingredient Management**: Track ingredients with quantities and units
- **Recipe Categories**: Organize recipes by cuisine, meal type, or custom tags
- **Recipe Images**: Upload and store recipe photos locally
- **Recipe Notes**: Add personal notes and modifications to recipes
- **Recipe Search**: Find recipes by name, ingredients, or tags

### UI Components (ShadCN)
- Base components in `src/components/ui/`
- Feature-specific components in `src/features/<feature>/components/`
- **ALWAYS use official ShadCN components when adding new UI** - install via `npx shadcn@latest add <component-name>`
- **ALWAYS create Skeleton components for any dynamic data** to provide loading states
- Consistent theming via CSS variables
- Responsive design with Tailwind CSS

## Environment Variables

Required variables (see `.env.example`):
```bash
# Database
DATABASE_URL=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

## Adding New Features

Follow this step-by-step process to add new features consistently:

1. **Create Feature Directory Structure:**
   ```bash
   mkdir -p src/features/<feature-name>/components/skeletons
   mkdir -p src/features/<feature-name>/server
   ```

2. **Add Database Schema (if needed):**
   ```typescript
   // db/schema.<feature>.ts
   export const <feature>Table = pgTable('<feature>', {
     id: text('id').primaryKey(),
     // ... other fields
   });
   ```

3. **Export Schema:**
   ```typescript
   // db/schema.ts
   export * from './schema.<feature>';
   ```

4. **Generate and Run Migration:**
   ```bash
   pnpm run db:generate && pnpm run db:migrate
   ```

5. **Create Server Actions:**
   ```typescript
   // src/features/<feature>/server/actions.ts
   "use server";
   import { headers } from "next/headers";
   import { auth } from "@/lib/auth/auth";
   // ... implement CRUD operations
   ```

6. **Create Components with Skeletons:**
   ```typescript
   // src/features/<feature>/components/<feature>-form.tsx
   // src/features/<feature>/components/skeletons/<feature>-form-skeleton.tsx
   ```

7. **Add Types and Validations (if shared):**
   ```typescript
   // src/lib/utils/<feature>-types.ts (if used across multiple areas)
   // src/lib/utils/<feature>-validations.ts (if used across multiple areas)
   // OR keep them co-located with related functionality
   ```

8. **Add Route Page:**
   ```typescript
   // src/app/(dashboard)/<feature>/page.tsx (ONLY the page component)
   ```

9. **Update Navigation:**
   Add links to dashboard layout navigation

## Testing Strategy

- Unit tests for server actions and utilities
- Component tests for UI interactions
- Integration tests for full workflows (auth, CRUD)
- Database tests use separate test database
- Mock external services in tests

## Deployment Notes

**Tastebase is designed for local Docker deployment:**

- **Docker-first**: Use `docker-compose up -d` for simple deployment
- **Local SQLite**: Database stored in Docker volumes for persistence
- **No cloud dependencies**: Everything runs on your local machine
- **Data ownership**: Your recipes stay on your computer
- **Persistent storage**: Docker volumes ensure data survives container restarts
- **Simple updates**: Pull new versions without losing data

## Common Workflows

**Adding a CRUD resource:**
1. Follow the "Adding New Features" process above
2. Create server actions with Zod validation in `src/features/<resource>/server/actions.ts`
3. Build UI components (list, form, detail views) in `src/features/<resource>/components/`
4. Create skeleton components in `src/features/<resource>/components/skeletons/`
5. Add routes (ONLY page.tsx files) and navigation
6. Write tests for the new functionality

**Key Principles:**
- Keep route directories minimal (only page.tsx files)
- All business logic goes in `/src/features/`
- Shared utilities go in `/src/lib/`
- Always create skeleton components for loading states
- Use TypeScript path aliases (@/) for all imports

**Modifying recipe management:**
1. Add new recipe fields to database schema
2. Update validation schemas and types
3. Modify UI components for new functionality
4. Test recipe operations and data integrity

**Adding authentication features:**
1. Configure additional providers in BetterAuth configuration
2. Update middleware for new protected routes
3. Extend user schema if additional fields needed
4. Update profile management components

## Development Preferences

**IMPORTANT**: Do not run type checking, linting, formatting, or build commands unless explicitly requested by the user. Focus on implementing functionality and let the user decide when to run quality checks.

### Optimal File Sizes for LLM Processing

To ensure efficient code analysis and minimal context consumption, follow these file size guidelines:

#### **Sweet Spot: 50-200 lines** ⭐
- Best performance for analysis, debugging, and modifications
- Full context visibility - entire file can be processed at once
- Quick processing with minimal context consumption

#### **File Type Specific Recommendations:**

**React Components: 100-300 lines**
```typescript
// Ideal component structure
- Imports/types: 10-30 lines
- Component logic: 50-200 lines  
- Exports: 5-10 lines
```

**Server Actions: 150-400 lines**
```typescript
// Good server action file
- Imports/types: 20-50 lines
- 3-8 related functions: 100-300 lines
- Error handling included
```

**Page Files (Next.js): 50-150 lines**
```typescript
// Ideal Next.js page
- Minimal logic (data fetching only)
- Component composition
- Metadata exports
```

**Utility Files: 50-200 lines**
```typescript
// Perfect utility module
- Single responsibility
- Well-focused functions
- Easy to understand at a glance
```

**Type Definition Files: 20-100 lines**
```typescript
// Focused type definitions
- Related types grouped together
- Clear interfaces and types
```

#### **Performance Guidelines:**
- **200-400 lines**: Still great - may need 2-3 reads for complex files
- **400-800 lines**: Workable but requires multiple reads, higher context usage
- **800+ lines**: Challenging - significant context overhead, risk of missing details

#### **Red Flags (Avoid These):**
- **1000+ lines**: Hard to analyze completely, suggests need for refactoring
- **Complex nested logic in large files**: Multiple responsibilities mixed together
- **Monster components**: Break into smaller, focused components

#### **Best Practices for LLM-Friendly Code:**
1. **Single Responsibility Principle**: Each file should have one clear purpose
2. **Logical Organization**: Consistent structure (imports → types → main logic → exports)
3. **Break Up Large Files**: Use feature directories and component composition

### Critical Requirements
- **ALWAYS create directories before writing files** - Use `mkdir -p` to ensure directory structure exists before creating any files
- **ALWAYS use TypeScript path aliases with @/ prefix** - Never use relative imports (./,../). Always use @/ even in index.ts files, internal exports, and ALL export statements
- **ALWAYS use TypeScript type-only imports** - Use `import type { SomeType } from "@/types/something"` for type-only imports

### Code Standards
- Never use the TypeScript variable any or unknown
- **NEVER use static methods on classes** - This causes biome linting issues. Use regular exported functions instead of class static methods
- **NEVER ADD ANY COMMENTS IN UI/JSX CODE** - This is a strict requirement. No comments in JSX, components, or UI code.
- **NO COMMENTS IN COMPONENTS** - Do not add explanatory comments like `{/* Header */}` or `{/* Main content */}` in React components
- When creating UI, keep components small as possible, use ShadCN, and wrap every dynamic data loading in a Suspense component with a fallback of a Skeleton component. Please separate out server actions to their own files.
- When creating a fixed size of elements in the UI, use [0,1,..] instead of Array.from()
- When refactoring an admin dashboard page, use the @src/app/(dashboard)/dashboard/admin/security/page.tsx as a reference for the UI.
- Always check the @src/components/ui/ folder before installing new ShadCN components
- **Error Handling**: Always use `.catch(() => undefined)` on Promise.all calls to ensure graceful failure handling:
```typescript
const [data1, data2] = await Promise.all([
  getData1().catch(() => undefined),
  getData2().catch(() => undefined),
]);
```

### **CRITICAL: Skeleton Component Key Patterns**
**EXTREMELY IMPORTANT**: When creating skeleton components, use these exact patterns to prevent Biome linting issues:

**Fixed-Size Arrays (Use Direct Array):**
```typescript
// ✅ CORRECT - from billing-history.tsx
{[0, 1, 2].map((index) => (
  <div
    key={`history-item-${index}`}
    className="flex items-center justify-between p-4 border rounded-lg"
  >
    <Skeleton className="h-4 w-24" />
  </div>
))}
```

**Dynamic Arrays (Use Array.from with proper keys):**
```typescript
// ✅ CORRECT - from plan-cards-skeleton.tsx  
{Array.from({ length: count }, (_, i) => (
  <Card key={`plan-skeleton-${i + 1}`} className="border-muted/30">
    <Skeleton className="h-5 w-24" />
  </Card>
))}
```

**Key Requirements:**
- **Fixed arrays**: ALWAYS use `[0, 1, 2]` directly, NEVER `Array.from()` for fixed sizes
- **Dynamic arrays**: ALWAYS use `Array.from({ length: count }, (_, i) =>` with descriptive keys
- **Keys**: ALWAYS use descriptive template literals like `history-item-${index}` or `plan-skeleton-${i + 1}`
- **NEVER use generic keys** like `skeleton-${i}` - be descriptive about what you're skeletoning

## File Organization Rules

### ✅ DO - Correct Patterns
```
✅ Route files (minimal):
src/app/profile/page.tsx

✅ Feature components:
src/components/profile/profile-form.tsx
src/components/profile/password-form.tsx

✅ Server actions:
src/lib/auth/auth-actions.ts

✅ Shared utilities:
src/lib/utils/profile-types.ts
src/lib/utils/profile-validations.ts
```

### ❌ DON'T - Anti-Patterns  
```
❌ Components in route directories:
src/app/profile/components/profile-form.tsx

❌ Business logic in route files:
src/app/profile/lib/utils.ts
src/app/profile/server/actions.ts

❌ Wrong categorization in lib:
src/lib/profile-form.tsx (should be in components)
src/lib/auth-config.ts (should be in lib/auth/)
```

### Directory Decision Tree
**When adding new code, ask:**

1. **Is this a reusable UI component?** → `src/components/ui/`
2. **Is this dashboard layout related?** → `src/components/dashboard/` 
3. **Is this feature-specific?** → `src/components/<feature>/`
4. **Is this auth/user related?** → `src/lib/auth/`
5. **Is this configuration?** → `src/lib/config/`
6. **Is this logging related?** → `src/lib/logging/`
7. **Is this a general utility?** → `src/lib/utils/`
8. **Is this a route?** → `src/app/<route>/page.tsx` or `src/app/(public)/<route>/page.tsx` (ONLY)

### Import Examples
```typescript
// ✅ Correct imports
import { ProfileFormSection } from "@/components/profile/profile-form-section";
import { updateUserProfile } from "@/lib/auth/auth-actions";
import type { ProfileFormData } from "@/lib/utils/profile-types";

// ❌ Incorrect imports  
import { ProfileFormSection } from "../components/profile-form-section";
import { ProfileFormSection } from "./profile-form-section";
```