# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tastebase is a local-first recipe management application designed for shared instances where multiple users want to collect, organize, and manage their recipes together on the same server. Built for Docker deployment with local SQLite storage - no cloud dependencies, no subscriptions, just your group's recipe collection stored securely on your machine.

**Shared Instance Model**: Each user can create both public recipes (visible to all instance users) and private recipes (visible only to themselves). Users see all public recipes from other instance users plus all of their own recipes. Perfect for families, roommates, cooking clubs, restaurants, or any group sharing recipes.

The architecture is component-based with all components organized in `/src/components/` with appropriate subdirectories, making it easy to extend functionality.

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

The codebase includes comprehensive health monitoring and build verification integrated into GitHub Actions workflows for automated quality gates:

### GitHub Actions Workflows

**Codebase Health** (`.github/workflows/codebase-health.yml`):
The health check workflow provides:

- **Matrix Strategy**: Parallel execution of all health checks for fast feedback
- **Critical vs Non-Critical**: Distinguishes between blocking and informational issues
- **Smart Caching**: Optimized pnpm and dependency caching for performance
- **Multi-Trigger**: Runs on push, PR, schedule, and manual dispatch
- **Artifact Generation**: Comprehensive health reports uploaded as CI artifacts
- **PR Comments**: Automated health report comments on pull requests

**Docker Build Verification** (`.github/workflows/docker-build-verify.yml`):
Verifies Docker builds on every PR and main branch push:

- **Fast Verification**: Single platform build (amd64) for quick feedback
- **No Registry Push**: Builds locally without polluting Docker Hub
- **Build Caching**: GitHub Actions cache for faster subsequent builds
- **PR Protection**: Prevents merging PRs with broken Docker builds
- **Triggers**: Runs on PRs to main, pushes to main, and manual dispatch

**Docker Release** (`.github/workflows/docker-build.yml`):
Builds and publishes production Docker images on version tags:

- **Multi-Platform**: Builds for linux/amd64 and linux/arm64
- **Semantic Versioning**: Automatically tags images based on version tags
- **Docker Hub**: Pushes to reecerose/tastebase registry
- **Metadata Updates**: Syncs README.md to Docker Hub description
- **Triggers**: Only runs on version tags (v1.0.0, v2.1.3, etc.) and manual dispatch

### Workflow Jobs

**Codebase Health Jobs:**
1. **health-check**: Matrix job running all health monitors in parallel
2. **health-report**: Generates comprehensive health report artifacts
3. **quick-health**: Fast critical-only checks for immediate PR feedback
4. **security-health**: Security and dependency analysis

**Docker Build Jobs:**
1. **verify-build**: Verifies Docker build succeeds (PRs and main)
2. **build**: Builds and pushes multi-platform images (version tags only)

### Quality Gates

**Critical Checks (Block CI/Deployment):**
- Code Quality: Debug code (console.log, debugger statements)
- Architecture: Relative imports, route structure violations
- Import Issues: Circular dependencies, import violations
- Docker Build: Container build must succeed

**Non-Critical Checks (Informational):**
- Performance: Optimization opportunities
- Test Coverage: Missing tests and coverage gaps
- Unused Code: Dead code and unused exports

### Local CI Testing

**Health Checks:**
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

**Docker Build Verification:**
```bash
# Test Docker build locally (matches CI verification)
docker build -t tastebase:test .

# Test with buildx (matches CI exactly)
docker buildx build --platform linux/amd64 -t tastebase:test .

# Full multi-platform test (matches release build)
docker buildx build --platform linux/amd64,linux/arm64 -t tastebase:test .
```

### CI Integration Benefits

- **Fast Feedback**: Quick checks run in <5 minutes for PR feedback
- **Parallel Execution**: All checks run simultaneously for efficiency
- **Docker Verification**: Catches broken builds before merging
- **Smart Failure Handling**: Critical vs non-critical failure distinction
- **Rich Reporting**: Detailed health reports with actionable insights
- **Artifact Storage**: 30-day retention of health reports for analysis
- **PR Integration**: Automated health report comments on pull requests
- **Release Automation**: Tag-based releases with multi-platform Docker builds

## Architecture Patterns

### Component-Based Structure
Components are organized in `/src/components/` with generic subdirectories by purpose:

```
src/components/
├── ui/                      # ShadCN base UI components
├── layout/                  # Dashboard layout components
├── auth/                    # Authentication forms and components
├── forms/                   # All form components (recipe forms, user forms, etc.)
├── lists/                   # List and table components
├── cards/                   # Card components for displaying data
├── modals/                  # Modal and dialog components
├── navigation/              # Navigation components
└── skeletons/               # All loading state components

src/lib/
├── auth/                   # Authentication logic and server actions
├── server-actions/         # Server Actions for CRUD operations
├── types/                  # TypeScript type definitions
├── validations/           # Zod schemas
└── utils/                 # Helper functions and utilities

src/hooks/                 # Global custom React hooks
└── use-<hook-name>.ts
```

### Database Schema Organization
- `db/schema.base.ts` - Base auth schema (BetterAuth tables)
- `db/schema.recipes.ts` - Recipe-specific tables and relationships
- `db/schema.ts` - Main export combining all schemas
- `db/migrations/` - Auto-generated migration files

### Route Structure
- `src/app/(public)/` - Unauthenticated pages (sign-in, sign-up, landing)
- `src/app/(dashboard)/` - Protected dashboard pages (should ONLY contain page.tsx files)
- `src/app/api/` - API routes (primarily webhooks)

**Important**: Route directories should be kept minimal and only contain page.tsx files. All components should live in `/src/components/` organized by generic purpose (forms, lists, cards, etc.), and server actions should live in `/src/lib/server-actions/` or `/src/lib/auth/`.

### Shared Code Organization
- `src/components/ui/` - ShadCN base UI components
- `src/components/layout/` - Shared dashboard layout components
- `src/lib/` - Shared utilities organized by category:
  - `src/lib/auth/` - Authentication configuration, client, and server actions
  - `src/lib/config/` - Environment variables and configuration
  - `src/lib/logging/` - Structured logging utilities with Pino
  - `src/lib/utils/` - General utilities (cn, date formatting, error handling)
- `src/middleware/` - Authentication and route protection
- `src/hooks/` - Global custom React hooks

## Recipe Management Features

Tastebase provides comprehensive recipe management capabilities for shared instances:

### Core Recipe Features
- **Recipe Storage**: Create, edit, and organize recipes with instance-wide sharing
- **Ingredient Management**: Track ingredients with quantities and units
- **Recipe Categories**: Organize recipes by cuisine, meal type, or custom tags
- **Recipe Images**: Upload and store recipe photos locally
- **Recipe Notes**: Add personal notes and modifications to recipes
- **Recipe Search**: Find recipes by name, ingredients, or tags across all accessible recipes
- **Privacy Controls**: Public recipes (shared with all instance users) or private recipes (personal only)

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
- Simple email/password authentication for shared instance recipe management
- User profile management integrated with custom database schema
- Session management with secure cookie handling
- Multi-user instance features with privacy controls

### Database (SQLite + Drizzle)
- Local SQLite database with better-sqlite3 driver
- Type-safe queries with Drizzle ORM
- Modular schema approach - recipe schema in `schema.recipes.ts`
- Database connection and migrations in `db/index.ts` and `db/migrate.ts`
- Persistent local storage for recipes, ingredients, and user data
- **Troubleshooting**: If better-sqlite3 fails to install, manually build with: `cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && pnpm run build-release`

### Recipe Management Features
- **Recipe Storage**: Create, edit, and organize recipes with public/private sharing
- **Ingredient Management**: Track ingredients with quantities and units
- **Recipe Categories**: Organize recipes by cuisine, meal type, or custom tags
- **Recipe Images**: Upload and store recipe photos locally
- **Recipe Notes**: Add personal notes and modifications to recipes
- **Recipe Search**: Find recipes by name, ingredients, or tags across shared instance collection
- **Privacy Controls**: Mark recipes as public (visible to all instance users) or private (personal only)

### UI Components (ShadCN)
- Base components in `src/components/ui/`
- Components organized by purpose: `src/components/forms/`, `src/components/lists/`, `src/components/cards/`, etc.
- **ALWAYS use official ShadCN components when adding new UI** - install via `npx shadcn@latest add <component-name>`
- **ALWAYS create Skeleton components for any dynamic data** in `src/components/skeletons/`
- Consistent theming via CSS variables
- Responsive design with Tailwind CSS

## Design System

**📖 [Complete Design System Documentation](./docs/design-system.md)**

TasteBase follows a comprehensive design system for consistent, maintainable UI development:

### Core Design Principles
- **Clean & Minimal**: No heavy borders, generous white space, focused content
- **Theme-Aware**: All colors via CSS variables, automatic light/dark mode adaptation
- **ShadCN-First**: Always use official ShadCN components, extend with className
- **Consistent Interactions**: 200ms transitions, predictable behavior patterns

### Quick Reference
```tsx
// ✅ Correct color usage
<Badge variant="outline">Private</Badge>
<div className="bg-muted text-foreground border-border">Content</div>
<Button className="hover:bg-primary/90">Action</Button>

// ❌ Never use hard-coded colors
<Badge className="bg-red-600 text-white">Status</Badge>
<div className="border-blue-500 text-green-800">Content</div>
```

### Key Guidelines
- **Colors**: Only CSS variables (`bg-muted`, `text-foreground`, `border-border`)
- **Spacing**: `p-6` for main areas, `p-4` for cards, `space-y-8` between sections
- **Typography**: `text-sm` default, `text-muted-foreground` for secondary text
- **Icons**: `h-4 w-4` standard, `h-5 w-5` for headers, consistent with text color

**📋 [Design Patterns & Examples](./docs/design-patterns.md)**

Common implementation patterns for forms, lists, cards, loading states, and interactive components.

## Environment Variables

Required variables (see `.env.example`):
```bash
# Database
DATABASE_URL=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# API Key Encryption (Required for AI features)
ENCRYPTION_SECRET=           # 64-character secret for encrypting AI API keys
CURRENT_ENCRYPTION_VERSION=  # Version for key rotation (default: 1)
```

### Generating Secure Encryption Keys

For production deployment, generate a secure encryption key:

```bash
# Generate 64-character encryption secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use the built-in helper (once app is running)
node -e "console.log(require('./src/lib/crypto/encryption').generateSecureSecret(64))"
```

**Security Requirements:**
- `ENCRYPTION_SECRET` must be different from `BETTER_AUTH_SECRET`
- Must be exactly 64 characters with good entropy
- Must include uppercase, lowercase, numbers, AND special characters
- Use quotes around the value in .env files to handle special characters
- Store securely and never commit to version control

## Adding New Features

Follow this step-by-step process to add new features consistently:

1. **Create Component Directories (as needed):**
   ```bash
   mkdir -p src/components/forms
   mkdir -p src/components/lists
   mkdir -p src/components/cards
   mkdir -p src/components/skeletons
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
   // src/lib/server-actions/<feature>-actions.ts
   "use server";
   import { headers } from "next/headers";
   import { auth } from "@/lib/auth/auth";
   // ... implement CRUD operations
   ```

6. **Create Components with Skeletons:**
   ```typescript
   // src/components/forms/recipe-form.tsx
   // src/components/lists/recipe-list.tsx
   // src/components/cards/recipe-card.tsx
   // src/components/skeletons/recipe-form-skeleton.tsx
   ```

7. **Add Types and Validations:**
   ```typescript
   // src/lib/types/<feature>-types.ts
   // src/lib/validations/<feature>-schemas.ts
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
- **Minimal runtime**: Optimized Alpine-based image with Node.js 24 for best performance
- **Local SQLite**: Database stored in Docker volumes for persistence (`/app/data`)
- **Image uploads**: Recipe images stored in separate volume (`/app/uploads`)
- **No cloud dependencies**: Everything runs on your local machine
- **Data ownership**: Your recipes stay on your computer
- **Persistent storage**: Docker volumes ensure data survives container restarts
- **Simple updates**: Pull new versions without losing data

### Docker Image Optimization

The Dockerfile uses multi-stage builds for maximum efficiency:
- **Base stage**: Node.js 24 Alpine (minimal base image)
- **Dependencies**: Separate dev and production dependency stages
- **Builder**: Compiles application with all build tools
- **Runtime**: Minimal production image with only necessary files
- **Security**: Non-root user, proper signal handling with dumb-init
- **Volumes**: Persistent mounts for database (`/app/data`) and uploads (`/app/uploads`)

### Release Process

**Tastebase uses Git tags for releases** (not branches). This provides immutable version history and integrates seamlessly with Docker Hub.

**Creating a Release:**

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Create and push a version tag (triggers Docker build)
git tag -a v1.0.0 -m "Release v1.0.0: Description of changes"
git push origin v1.0.0

# 3. GitHub Actions automatically:
#    - Builds multi-platform Docker image (amd64, arm64)
#    - Pushes to Docker Hub with tags: v1.0.0, 1.0, 1, latest
#    - Updates Docker Hub description from README.md
```

**Version Tag Format:**
- Use semantic versioning: `v1.0.0`, `v2.1.3`, etc.
- Tags must start with `v` to trigger the workflow
- Major releases: `v1.0.0`, `v2.0.0` (breaking changes)
- Minor releases: `v1.1.0`, `v1.2.0` (new features)
- Patch releases: `v1.0.1`, `v1.0.2` (bug fixes)

**Docker Image Tags Generated:**
```bash
# For tag v1.2.3, these images are created:
reecerose/tastebase:v1.2.3    # Full version
reecerose/tastebase:1.2        # Minor version
reecerose/tastebase:1          # Major version
reecerose/tastebase:latest     # Latest release
reecerose/tastebase:sha-abc123 # Git commit SHA
```

**Manual Workflow Trigger:**
The Docker build can also be triggered manually from GitHub Actions if needed.

## Common Workflows

**Adding a CRUD resource:**
1. Follow the "Adding New Features" process above
2. Create server actions with Zod validation in `src/lib/server-actions/<resource>-actions.ts`
3. Build UI components organized by purpose: forms in `src/components/forms/`, lists in `src/components/lists/`, etc.
4. Create skeleton components in `src/components/skeletons/`
5. Add routes (ONLY page.tsx files) and navigation
6. Write tests for the new functionality

**Key Principles:**
- Keep route directories minimal (only page.tsx files)
- Components go in `/src/components/` organized by generic purpose (forms, lists, cards, etc.)
- Server actions go in `/src/lib/server-actions/`
- Shared utilities go in `/src/lib/`
- Always create skeleton components for loading states in `/src/components/skeletons/`
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

**CRITICAL**: Never run dev server (`pnpm run dev`) or build commands (`pnpm run build`) automatically. Only run these if explicitly requested by the user. Focus on implementing functionality and let the user control when to start/build the server.

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
- **NEVER use TypeScript `any`, `unknown`, or `undefined` types** - This is absolutely forbidden. Always define proper types, interfaces, or use specific union types. Use `null` for nullable values, not `undefined`. This is a critical requirement for type safety and code quality.
- **NEVER use inline union types with string literals** - This is absolutely forbidden. Always use enums or type aliases from `/src/lib/types/index.ts`. Examples of what to NEVER do:
  ```typescript
  // ❌ FORBIDDEN - Inline union types
  type Status = "pending" | "approved" | "rejected";
  interface Props { variant: "primary" | "secondary" | "destructive"; }
  const theme: "light" | "dark" | "system" = "light";
  
  // ✅ REQUIRED - Use enums or type aliases
  enum Status { PENDING = "pending", APPROVED = "approved", REJECTED = "rejected" }
  interface Props { variant: ButtonVariant; }
  const theme: Theme = Theme.LIGHT;
  ```
- **ALWAYS create enums for business logic values** - Any set of string literal values used in business logic must be defined as an enum in `/src/lib/types/index.ts`:
  ```typescript
  // ✅ Correct approach for any string literal values
  export enum RecipeStatus {
    DRAFT = "draft",
    PUBLISHED = "published", 
    ARCHIVED = "archived"
  }
  
  // ✅ Then use throughout codebase
  interface Recipe { status: RecipeStatus; }
  const recipe = { status: RecipeStatus.PUBLISHED };
  ```
- **ALWAYS create type aliases for Pick/Omit patterns** - Never use inline Pick/Omit types. Create reusable type aliases:
  ```typescript
  // ❌ FORBIDDEN - Inline Pick/Omit
  function updateUser(data: Pick<User, "name" | "email">) {}
  function createPost(data: Omit<Post, "id" | "createdAt">) {}
  
  // ✅ REQUIRED - Type aliases in /src/lib/types/index.ts
  export type UserUpdateData = Pick<User, "name" | "email">;
  export type PostCreateData = Omit<Post, "id" | "createdAt">;
  
  // ✅ Then use throughout codebase
  function updateUser(data: UserUpdateData) {}
  function createPost(data: PostCreateData) {}
  ```
- **NEVER use static methods on classes** - This causes biome linting issues. Use regular exported functions instead of class static methods
- **NEVER ADD ANY COMMENTS IN UI/JSX CODE** - This is a strict requirement. No comments in JSX, components, or UI code.
- **NO COMMENTS IN COMPONENTS** - Do not add explanatory comments like `{/* Header */}` or `{/* Main content */}` in React components
- **ALWAYS use Suspense for data loading** - For locally hosted apps, prioritize Suspense + streaming over server-side rendering for better perceived performance and user experience. Wrap every dynamic data loading component in a Suspense component with a Skeleton fallback.
- When creating a fixed size of elements in the UI, use [0,1,..] instead of Array.from()
- Always check the @src/components/ui/ folder before installing new ShadCN components
- **Error Handling**: Always use `.catch(() => undefined)` on Promise.all calls to ensure graceful failure handling:
```typescript
const [data1, data2] = await Promise.all([
  getData1().catch(() => undefined),
  getData2().catch(() => undefined),
]);
```
- **parseInt Usage**: Always include a radix parameter of 10 when using parseInt to avoid unexpected behavior with leading zeros or hex values:
```typescript
// ✅ Correct
const num = parseInt(value, 10);

// ❌ Incorrect - may cause unexpected behavior
const num = parseInt(value);
```
- **ALWAYS use React useId() for dynamic IDs** - NEVER use static string IDs in React components. This prevents DOM ID conflicts when components are used multiple times:
```typescript
// ✅ Correct - Dynamic IDs with useId()
import { useId } from "react";

function MyComponent() {
  const nameId = useId();
  const emailId = useId();
  
  return (
    <div>
      <Label htmlFor={nameId}>Name</Label>
      <Input id={nameId} />
      <Label htmlFor={emailId}>Email</Label>
      <Input id={emailId} />
    </div>
  );
}

// ❌ Incorrect - Static IDs cause conflicts
function BadComponent() {
  return (
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" />
      <Label htmlFor="email">Email</Label>
      <Input id="email" />
    </div>
  );
}
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

## Suspense + Streaming Pattern (REQUIRED)

**For locally hosted apps like TasteBase, ALWAYS prefer Suspense streaming over full server-side rendering.**

### ✅ Correct Suspense Pattern

**Page Structure:**
```typescript
// src/app/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardStats } from "@/components/cards/dashboard-stats";
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton";

export default async function DashboardPage() {
  // Only do AUTH on server (fast ~50ms)
  const session = await auth.api.getSession();
  if (!session) redirect("/auth/sign-in");

  return (
    <DashboardLayout user={session.user}>
      <h1>Welcome back, {session.user.name}!</h1>
      
      {/* Database queries stream in progressively */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </DashboardLayout>
  );
}
```

**Data Component (Async Server Component):**
```typescript
// src/components/cards/dashboard-stats.tsx
import { getDashboardStats } from "@/lib/server-actions";

async function DashboardStats() {
  // Database query happens here (~200ms)
  const statsResult = await getDashboardStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Render stats */}
    </div>
  );
}

export { DashboardStats };
```

**Skeleton Component:**
```typescript
// src/components/skeletons/dashboard-stats-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <div key={`dashboard-stat-skeleton-${index}`} className="p-4 border rounded-lg">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
```

### Performance Benefits:
- **Faster perceived performance**: Page shell loads in ~50ms vs ~250ms
- **Better UX**: Users see content immediately, data streams in
- **Development friendly**: Easier debugging, instant feedback
- **Scalable**: Add more dashboard widgets without blocking initial render

### When to Use Each Pattern:
- **✅ Suspense + Streaming**: Local apps, dashboards, admin interfaces, development
- **❌ Full SSR**: Public websites (SEO critical), slow networks, simple single-fetch pages

## File Organization Rules

### ✅ DO - Correct Patterns
```
✅ Route files (minimal):
src/app/profile/page.tsx

✅ Components organized by purpose:
src/components/forms/profile-form.tsx
src/components/forms/password-form.tsx
src/components/cards/user-card.tsx
src/components/lists/user-list.tsx
src/components/skeletons/profile-form-skeleton.tsx

✅ Server actions:
src/lib/server-actions/profile-actions.ts
src/lib/auth/auth-actions.ts

✅ Types and validations:
src/lib/types/profile-types.ts
src/lib/validations/profile-schemas.ts
```

### ❌ DON'T - Anti-Patterns  
```
❌ Components in route directories:
src/app/profile/components/profile-form.tsx

❌ Business logic in route files:
src/app/profile/lib/utils.ts
src/app/profile/server/actions.ts

❌ Feature-based component organization:
src/components/profile/profile-form.tsx (should be src/components/forms/profile-form.tsx)
src/components/recipes/recipe-list.tsx (should be src/components/lists/recipe-list.tsx)

❌ Wrong categorization:
src/lib/profile-form.tsx (should be in components/forms/)
src/components/profile-actions.ts (should be in lib/server-actions/)
```

### Directory Decision Tree
**When adding new code, ask:**

1. **Is this a reusable UI component?** → `src/components/ui/`
2. **Is this dashboard layout related?** → `src/components/layout/`
3. **Is this an authentication component?** → `src/components/auth/`
4. **Is this a form component?** → `src/components/forms/`
5. **Is this a list or table component?** → `src/components/lists/`
6. **Is this a card component?** → `src/components/cards/`
7. **Is this a modal or dialog?** → `src/components/modals/`
8. **Is this a navigation component?** → `src/components/navigation/`
9. **Is this a skeleton/loading component?** → `src/components/skeletons/`
10. **Is this a server action?** → `src/lib/server-actions/`
11. **Is this auth/user related?** → `src/lib/auth/`
12. **Is this a type definition?** → `src/lib/types/`
13. **Is this a validation schema?** → `src/lib/validations/`
14. **Is this configuration?** → `src/lib/config/`
15. **Is this logging related?** → `src/lib/logging/`
16. **Is this a general utility?** → `src/lib/utils/`
17. **Is this a route?** → `src/app/<route>/page.tsx` or `src/app/(public)/<route>/page.tsx` (ONLY)

### Import Examples
```typescript
// ✅ Correct imports
import { ProfileForm } from "@/components/forms/profile-form";
import { RecipeCard } from "@/components/cards/recipe-card";
import { RecipeList } from "@/components/lists/recipe-list";
import { ProfileFormSkeleton } from "@/components/skeletons/profile-form-skeleton";
import { updateUserProfile } from "@/lib/server-actions/profile-actions";
import type { ProfileFormData } from "@/lib/types/profile-types";
import { profileSchema } from "@/lib/validations/profile-schemas";

// ❌ Incorrect imports  
import { ProfileForm } from "../components/forms/profile-form";
import { ProfileForm } from "./profile-form";
import { RecipeCard } from "@/components/recipes/recipe-card"; // Should be cards/
```