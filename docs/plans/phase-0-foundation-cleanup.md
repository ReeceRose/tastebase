# Phase 0: Foundation & Cleanup

**Duration:** 3-4 days  
**Priority:** Critical (Must complete before Phase 1)  
**Prerequisites:** None  
**Dependencies:** Sets foundation for all subsequent phases

---

## Overview

This phase focuses on cleaning up the inherited SaaS template and establishing the proper foundation for a recipe management application. We need to remove unnecessary features, refactor existing code to match project standards, and set up the correct infrastructure.

## Current State Analysis

### ✅ Already Working
- Next.js 15+ with App Router and Server Actions
- BetterAuth integration (needs refactoring)
- Drizzle ORM with SQLite/libSQL
- ShadCN/UI components
- Tailwind CSS
- Pino logging system
- Feature-based architecture structure
- Comprehensive development scripts

### ❌ Needs Removal/Refactoring
- Clerk references in documentation and comments
- Stripe billing and subscription features
- Organization/team management features
- Payment-related components and logic
- SaaS-specific database schema elements
- Multi-tenant architecture patterns
- Billing-related API routes and webhooks

### 🔧 Needs Refactoring
- Recipe schema currently in schema.base.ts (should be modular)
- BetterAuth configuration (not optimized for single-user)
- Environment variables setup
- Database configuration for proper local development
- Docker setup for deployment

---

## Tasks Breakdown

### 1. Remove SaaS Features (Day 1)

#### 1.1 Remove Stripe/Billing Components
- [x] Delete billing-related components in `/src/features/`
- [x] Remove subscription management components
- [x] Remove payment-related server actions
- [x] Remove Stripe webhook handlers
- [x] Clean up billing references in navigation

#### 1.2 Remove Organization Features
- [x] Delete organization management components (N/A - already removed)
- [x] Remove team/member management features (N/A - already removed)
- [x] Clean up organization-related database schema
- [x] Remove organization server actions and queries (N/A - already removed)

#### 1.3 Remove API Routes
- [x] Delete `/src/app/api/webhooks/stripe/` routes (N/A - already removed)
- [x] Remove payment processing routes (N/A - already removed)
- [x] Clean up organization-related API endpoints (N/A - already removed)
- [x] Keep only health check and auth routes

#### 1.4 Clean Documentation References
- [x] Update CLAUDE.md to remove Clerk references
- [x] Update authentication section to reflect BetterAuth only
- [x] Remove billing/subscription sections
- [x] Update tech stack description

### 2. Refactor Database Schema (Day 2)

#### 2.1 Modularize Recipe Schema
- [x] Create `src/db/schema.recipes.ts` following project conventions
- [x] Move recipe-related tables from schema.base.ts
- [x] Implement proper relationships for recipe components
- [x] Add recipe-specific indexes for performance

#### 2.2 Create Proper Recipe Schema Structure
```typescript
// Tables to create:
// - recipes (main recipe data)
// - recipe_ingredients (structured ingredients)
// - recipe_instructions (step-by-step instructions)  
// - recipe_tags (tagging system)
// - recipe_images (image metadata)
// - recipe_notes (user notes)
```

#### 2.3 Clean Up Auth Schema
- [x] Remove organization-related fields from users table
- [x] Remove subscription/billing fields
- [x] Simplify to single-user authentication model
- [x] Update schema.base.ts to reflect changes

### 3. Refactor BetterAuth Setup (Day 2)

#### 3.1 Optimize for Single-User Recipe App
- [x] Update auth configuration for recipe app use case
- [x] Remove organization/team features from auth
- [x] Configure proper session management
- [x] Set up password reset functionality (if needed)

#### 3.2 Update Auth Actions and Client
- [x] Refactor auth server actions for recipe app
- [x] Update auth client configuration
- [x] Remove organization-related auth methods
- [x] Simplify auth flow for recipe management

### 4. Environment and Configuration (Day 3)

#### 4.1 Update Environment Variables
- [x] Create proper `.env.example` for recipe app
- [x] Remove Stripe/billing environment variables
- [x] Add AI service configuration variables
- [x] Add file storage configuration variables
- [x] Update SQLite configuration

#### 4.2 Update Database Configuration  
- [x] Configure proper local SQLite setup with better-sqlite3
- [x] Update drizzle.config.ts for recipe app needs
- [x] Set up proper migration workflow
- [x] Configure database seeding for recipe data

#### 4.3 Update Package.json Scripts
- [x] Remove billing/subscription related scripts
- [x] Add recipe-specific development scripts
- [x] Update build and deployment scripts
- [x] Add AI service testing scripts

### 5. Clean Up Features Directory (Day 3)

#### 5.1 Remove Unused Features
- [x] Delete `/src/features/billing/` (N/A - already removed)
- [x] Delete `/src/features/organizations/` (N/A - already removed)
- [x] Delete `/src/features/subscriptions/` (N/A - already removed)
- [x] Keep `/src/features/dashboard/`, `/src/features/profile/`, `/src/features/settings/`

#### 5.2 Refactor Existing Features
- [x] Clean dashboard feature of billing references
- [x] Update profile feature for recipe app context
- [x] Simplify settings feature (remove billing/org settings)
- [x] Update all imports and references

### 6. Update UI Components (Day 4)

#### 6.1 Remove SaaS-Specific Components
- [x] Delete billing/subscription components (N/A - already removed)
- [x] Remove organization management components (N/A - already removed)
- [x] Clean up upload limit guards (if billing-related) (N/A - already removed)
- [x] Remove payment-related dialogs and forms (N/A - already removed)

#### 6.2 Update Navigation and Layout
- [x] Update dashboard navigation for recipe app
- [x] Remove billing/subscription menu items
- [x] Update header and sidebar components
- [x] Clean up layout components

#### 6.3 Update Landing/Auth Pages
- [x] Update sign-in/sign-up pages for recipe context
- [x] Remove billing/subscription messaging
- [x] Update app homepage for recipe management
- [x] Clean up error pages

### 7. Docker and Deployment Setup (Day 4)

#### 7.1 Create Docker Configuration
- [x] Create Dockerfile optimized for recipe app
- [x] Set up docker-compose for local development
- [x] Configure volume mounting for SQLite database
- [x] Set up file storage volumes for recipe images

#### 7.2 Update Deployment Configuration
- [x] Update next.config.ts for recipe app deployment
- [x] Configure environment for Docker deployment
- [x] Set up proper build process
- [x] Create deployment documentation

---

## Acceptance Criteria

### ✅ Cleanup Complete When:
- [x] No references to Stripe, Clerk, organizations, or billing remain
- [x] All unused components and features are removed
- [x] Recipe schema is properly modularized following project conventions
- [x] BetterAuth is optimized for single-user recipe management
- [x] Environment variables are configured for recipe app needs
- [x] Docker setup works for local development and deployment
- [x] All existing tests pass
- [x] Documentation is updated to reflect current state

### 🧪 Testing Requirements
- [x] All removed features don't break existing functionality
- [x] Database migrations work correctly
- [x] BetterAuth authentication flows work
- [x] Docker containers start successfully
- [x] No broken imports or references remain

---

## Risk Assessment

### 🔴 High Risk
- **Database migration issues:** Ensure proper backup and migration testing
- **Authentication breaks:** Test all auth flows thoroughly after refactoring
- **Missing dependencies:** Verify no critical code depends on removed features

### 🟡 Medium Risk  
- **Build process changes:** Docker and deployment changes may need debugging
- **Environment variable misconfigurations:** Test all environment setups

### 🟢 Low Risk
- **UI component cleanup:** Mostly isolated changes
- **Documentation updates:** Non-breaking changes

---

## Migration Notes

### Database Migration Strategy
1. Create new recipe schema files
2. Generate migration for new structure
3. Test migration with sample data
4. Remove old schema elements
5. Clean up unused tables and columns

### Code Migration Strategy  
1. Remove features in order of dependencies (billing → organizations → auth cleanup)
2. Update imports and references as you go
3. Test after each major removal
4. Update documentation continuously

### Testing Strategy
1. Run health checks after each major change
2. Test authentication flows frequently
3. Verify database operations work
4. Test Docker setup early and often

---

## Next Phase Dependencies

Phase 1 (Core Infrastructure) requires:
- ✅ Clean recipe schema structure (COMPLETED)
- ✅ Working BetterAuth setup (COMPLETED)
- ✅ Proper database configuration (COMPLETED)
- ✅ Docker deployment working (COMPLETED)
- ✅ Cleaned codebase with no SaaS remnants (COMPLETED)

**Estimated Completion:** 3-4 days ✅ **COMPLETED**  
**Critical Path:** Database schema refactoring → Auth cleanup → Docker setup ✅ **COMPLETED**

---

## ✅ **PHASE 0 COMPLETED SUCCESSFULLY** 

**Completion Date:** September 4, 2025  
**Status:** All acceptance criteria met and validated  
**Next Phase:** Ready to proceed to Phase 1 - Core Recipe Infrastructure

### Final Validation Results:
- ✅ All tests passing (10/10 tests)
- ✅ Health checks: EXCELLENT status  
- ✅ Development server running without errors
- ✅ Database migrations working correctly
- ✅ BetterAuth integration complete and functional
- ✅ Recipe schema deployed with comprehensive relationships
- ✅ Docker deployment ready
- ✅ Documentation updated and accurate

**Phase 1 Dependencies:** All critical requirements satisfied ✅