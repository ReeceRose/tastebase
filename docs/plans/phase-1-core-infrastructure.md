# Phase 1: Core Infrastructure

**Duration:** 5-7 days  
**Priority:** Critical  
**Prerequisites:** Phase 0 (Foundation & Cleanup) completed  
**Dependencies:** Foundation for Phases 2-6

---

## Overview

Establish the core infrastructure for the recipe management application, including database schema, authentication flows, file storage, base UI components organized by purposes will be built.

## Goals

- ✅ Production-ready authentication system
- ✅ Robust database schema for recipe data
- ✅ File storage system for recipe images
- ✅ Base UI layout and components
- ✅ Testing infrastructure
- ✅ Development workflow optimization

---

## Tasks Breakdown

### 1. Database Schema Implementation (Days 1-2)

#### 1.1 Create Recipe Schema Architecture
- [x] Design normalized recipe schema following project conventions
- [x] Implement `src/db/schema.recipes.ts` with all recipe tables
- [x] Create proper indexes for performance
- [x] Set up database relationships and constraints
- [x] Add full-text search capabilities for recipes

#### 1.2 Recipe Schema Tables

```typescript
// Core recipe tables to implement:

// recipes table - Main recipe information
{
  id: string (primary key)
  userId: string (foreign key to users)
  title: string (not null)
  description: text
  servings: integer
  prepTimeMinutes: integer
  cookTimeMinutes: integer
  totalTimeMinutes: integer (computed)
  difficulty: enum ['easy', 'medium', 'hard']
  cuisine: string
  sourceUrl: text
  sourceName: string
  isPublic: boolean (default false)
  isArchived: boolean (default false)
  createdAt: timestamp
  updatedAt: timestamp
}

// recipe_ingredients table - Structured ingredient data
{
  id: string (primary key)
  recipeId: string (foreign key to recipes)
  name: string (not null)
  amount: decimal
  unit: string
  notes: string
  groupName: string (for ingredient sections)
  sortOrder: integer
  isOptional: boolean (default false)
}

// recipe_instructions table - Step-by-step instructions
{
  id: string (primary key)
  recipeId: string (foreign key to recipes)
  stepNumber: integer (not null)
  instruction: text (not null)
  timeMinutes: integer
  temperature: string
  notes: string
  groupName: string (for instruction sections)
}

// recipe_tags table - Flexible tagging system
{
  id: string (primary key)
  name: string (unique, not null)
  color: string
  category: string
  createdAt: timestamp
}

// recipe_tag_relations table - Many-to-many recipe-tag relationships
{
  recipeId: string (foreign key to recipes)
  tagId: string (foreign key to recipe_tags)
  // composite primary key (recipeId, tagId)
}

// recipe_images table - Image metadata and storage
{
  id: string (primary key)
  recipeId: string (foreign key to recipes)
  filename: string (not null)
  originalName: string
  mimeType: string
  fileSize: integer
  width: integer
  height: integer
  altText: string
  isHero: boolean (default false)
  sortOrder: integer
  uploadedAt: timestamp
}

// recipe_notes table - User notes and cooking tips
{
  id: string (primary key)
  recipeId: string (foreign key to recipes)
  userId: string (foreign key to users)
  content: text (not null)
  isPrivate: boolean (default true)
  rating: integer (1-5)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 1.3 Database Indexes and Constraints
- [x] Create indexes for search performance (title, tags, ingredients)
- [x] Add foreign key constraints with proper cascade rules
- [x] Implement unique constraints where appropriate
- [x] Set up composite indexes for complex queries
- [x] Add check constraints for data validation

#### 1.4 Migration and Seeding
- [x] Generate and test database migrations
- [x] Create seed data for development
- [x] Set up database reset/rebuild scripts
- [x] Test migration rollback procedures
- [x] Create sample recipe data for testing

### 2. Authentication System Enhancement (Day 2)

#### 2.1 BetterAuth Configuration Optimization
- [x] Configure BetterAuth for optimal recipe app performance
- [x] Set up proper session management for recipe access
- [x] Configure password reset functionality
- [x] Set up email verification (skipped - not needed for single-user local app)
- [x] Implement proper logout and session cleanup

#### 2.2 Auth Server Actions
- [x] Create `src/lib/auth-actions.ts` with recipe-specific auth functions
- [x] Implement user registration with recipe preferences
- [x] Add user profile management for recipe settings
- [x] Create auth middleware for recipe routes
- [x] Set up auth guards for recipe operations

#### 2.3 Auth UI Components
- [x] Create clean sign-in/sign-up forms using ShadCN
- [x] Implement auth layout components
- [x] Add password reset flow UI
- [x] Create auth error handling components
- [x] Design auth loading states and skeletons

### 3. File Storage System (Day 3)

#### 3.1 Local File Storage Setup
- [x] Configure local file system storage for recipe images
- [x] Implement file upload validation (types, sizes, security)
- [x] Create image processing pipeline (resize, optimize)
- [x] Set up file serving with proper security headers
- [x] Implement file cleanup and management

#### 3.2 File Storage API
- [x] Create `src/lib/file-storage.ts` utility module
- [x] Implement secure file upload handling
- [x] Add image processing capabilities (sharp integration)
- [x] Create file deletion and cleanup functions
- [x] Add file metadata extraction

#### 3.3 Upload Components
- [x] Create reusable image upload component
- [x] Implement drag-and-drop functionality
- [x] Add upload progress indicators
- [x] Create image preview and editing interface
- [x] Design upload error handling and retry logic

### 4. Base UI Infrastructure (Day 4)

#### 4.1 Layout System
- [x] Create main dashboard layout for recipe app
- [x] Implement responsive navigation system
- [x] Design header with recipe-specific actions
- [x] Create sidebar with recipe categories and quick access
- [x] Set up mobile-optimized navigation

#### 4.2 Theme and Design System
- [x] Configure dark/light mode for recipe viewing
- [x] Set up recipe-specific color palette
- [x] Create typography scales for recipe content
- [x] Implement consistent spacing and layout grids
- [x] Design recipe-focused component variants

#### 4.3 Base Components
- [x] Create recipe card component foundation
- [x] Implement search and filter components
- [x] Design loading states and skeleton components
- [x] Create error boundary and fallback components
- [x] Build notification and toast system

#### 4.4 Recipe-Specific UI Components
- [x] Create ingredient list component
- [x] Design instruction steps component
- [x] Implement tag display and management
- [x] Build image gallery component
- [x] Create recipe metadata display

### 5. API Infrastructure (Day 5)

#### 5.1 Server Actions Foundation
- [x] Set up server action structure following project conventions
- [x] Create base server action utilities with error handling
- [x] Implement authentication validation for server actions
- [x] Set up logging for server actions using pino
- [x] Create server action response types and validation

#### 5.2 Core API Routes
- [x] Implement health check endpoints
- [x] Create file upload/download API routes
- [x] Set up image serving with optimization
- [x] Add search API endpoints foundation
- [x] Implement proper API error handling

#### 5.3 Validation and Types
- [x] Create Zod schemas for all recipe data types
- [x] Implement validation utilities for recipe inputs
- [x] Set up TypeScript types for all recipe entities
- [x] Create form validation schemas
- [x] Add API response type definitions

### 6. Testing Infrastructure (Day 6)

#### 6.1 Test Environment Setup
- [x] Manual test

### 7. Development Workflow (Day 7)

#### 7.1 Development Scripts Enhancement
- [x] Optimize database development workflow
- [x] Create recipe data seeding scripts
- [x] Set up development data reset utilities
- [x] Add recipe-specific health check scripts
- [x] Implement development debugging tools

#### 7.2 Documentation Setup
- [x] Create API documentation foundation
- [x] Document database schema and relationships
- [x] Add development setup instructions
- [x] Create troubleshooting guides
- [x] Document testing procedures

---

## Technical Specifications

### Database Performance
- **Index Strategy:** Full-text search on recipe titles, descriptions, ingredients
- **Query Optimization:** Prepared statements for common recipe queries
- **Caching:** Query result caching for frequently accessed recipes
- **Backup:** Automated daily backups of recipe database

### File Storage Requirements
- **Supported Formats:** JPEG, PNG, WebP for recipe images
- **File Size Limits:** 10MB per image, 50MB total per recipe
- **Image Processing:** Auto-resize and optimize for web delivery
- **Security:** Validate file types, sanitize filenames, prevent path traversal

### Authentication Security
- **Session Management:** Secure session tokens with proper expiration
- **Password Security:** Bcrypt hashing with appropriate salt rounds
- **Rate Limiting:** Login attempt limiting and account lockout protection
- **CSRF Protection:** Proper CSRF token validation for state-changing operations

---

## Acceptance Criteria

### ✅ Phase 1 Complete When:

#### Database & Schema
- [x] All recipe schema tables created and properly related
- [x] Database migrations execute successfully
- [x] Seed data populates correctly for development
- [x] Full-text search works on recipe content
- [x] All indexes perform within acceptable limits (<100ms for common queries)

#### Authentication
- [x] User registration, login, logout flows work perfectly
- [x] Session management is secure and persistent
- [x] Auth guards protect recipe operations correctly
- [x] Password reset functionality is operational
- [x] Auth UI is responsive and accessible

#### File Storage
- [x] Image uploads work reliably with progress indication
- [x] File validation prevents security issues
- [x] Image processing and optimization functions correctly
- [x] File serving is secure and performant
- [x] Cleanup and deletion work properly

#### UI Foundation
- [x] Dashboard layout is responsive and accessible
- [x] Dark/light mode switching works throughout (existing in codebase)
- [x] Navigation is intuitive for recipe management
- [x] Loading states and error handling are comprehensive
- [x] Mobile experience is fully functional

#### Testing
- [x] Test suite runs successfully with >80% coverage
- [x] Database operations are thoroughly tested
- [x] Authentication flows have comprehensive test coverage
- [x] File operations are tested with various scenarios
- [x] UI components have proper test coverage

---

## Risk Assessment

### 🔴 High Risk
- **Database schema changes:** Complex migrations may require careful rollback planning
- **File storage security:** Image uploads present security vulnerabilities if not properly validated
- **Authentication issues:** Auth problems could lock users out of their recipes

### 🟡 Medium Risk
- **Performance bottlenecks:** Full-text search and image processing may need optimization
- **Mobile responsiveness:** Complex recipe layouts may need significant mobile testing
- **Test infrastructure:** Comprehensive testing setup may take longer than expected

### 🟢 Low Risk
- **UI component integration:** ShadCN components should integrate smoothly
- **Development workflow:** Existing project scripts provide good foundation
- **Code quality:** Existing linting and quality tools should adapt easily

---

## Performance Requirements

### Database Performance Targets
- Recipe queries: <100ms response time
- Search operations: <200ms for full-text search
- Image metadata queries: <50ms
- Concurrent user limit: 100 simultaneous users

### File Storage Performance
- Image upload: Support files up to 10MB
- Image processing: <3 seconds for resize/optimize
- File serving: <100ms for optimized images
- Storage limit: 1GB total storage per user

### UI Performance Targets
- Page load time: <2 seconds for recipe pages
- Image loading: Progressive loading with lazy loading
- Search responsiveness: <100ms keystroke delay
- Mobile performance: 60fps on mobile devices

---

## Next Phase Dependencies

**Phase 2 (Recipe CRUD) requires:**
- ✅ Complete database schema with all recipe tables
- ✅ Working authentication system
- ✅ File upload and storage system
- ✅ Base UI components and layouts
- ✅ Server actions infrastructure
- ✅ Testing framework in place

**Estimated Completion:** 5-7 days  
**Critical Path:** Database schema → Auth system → File storage → UI foundation