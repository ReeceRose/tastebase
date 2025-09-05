# Phase 1: Core Infrastructure

**Duration:** 5-7 days  
**Priority:** Critical  
**Prerequisites:** Phase 0 (Foundation & Cleanup) completed  
**Dependencies:** Foundation for Phases 2-6

---

## Overview

Establish the core infrastructure for the recipe management application, including database schema, authentication flows, file storage, base UI components, and testing infrastructure. This phase creates the solid foundation upon which all recipe features will be built.

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
- [ ] Design normalized recipe schema following project conventions
- [ ] Implement `src/db/schema.recipes.ts` with all recipe tables
- [ ] Create proper indexes for performance
- [ ] Set up database relationships and constraints
- [ ] Add full-text search capabilities for recipes

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
- [ ] Create indexes for search performance (title, tags, ingredients)
- [ ] Add foreign key constraints with proper cascade rules
- [ ] Implement unique constraints where appropriate
- [ ] Set up composite indexes for complex queries
- [ ] Add check constraints for data validation

#### 1.4 Migration and Seeding
- [ ] Generate and test database migrations
- [ ] Create seed data for development
- [ ] Set up database reset/rebuild scripts
- [ ] Test migration rollback procedures
- [ ] Create sample recipe data for testing

### 2. Authentication System Enhancement (Day 2)

#### 2.1 BetterAuth Configuration Optimization
- [ ] Configure BetterAuth for optimal recipe app performance
- [ ] Set up proper session management for recipe access
- [ ] Configure password reset functionality
- [ ] Set up email verification (if needed)
- [ ] Implement proper logout and session cleanup

#### 2.2 Auth Server Actions
- [ ] Create `src/lib/auth-actions.ts` with recipe-specific auth functions
- [ ] Implement user registration with recipe preferences
- [ ] Add user profile management for recipe settings
- [ ] Create auth middleware for recipe routes
- [ ] Set up auth guards for recipe operations

#### 2.3 Auth UI Components
- [ ] Create clean sign-in/sign-up forms using ShadCN
- [ ] Implement auth layout components
- [ ] Add password reset flow UI
- [ ] Create auth error handling components
- [ ] Design auth loading states and skeletons

### 3. File Storage System (Day 3)

#### 3.1 Local File Storage Setup
- [ ] Configure local file system storage for recipe images
- [ ] Implement file upload validation (types, sizes, security)
- [ ] Create image processing pipeline (resize, optimize)
- [ ] Set up file serving with proper security headers
- [ ] Implement file cleanup and management

#### 3.2 File Storage API
- [ ] Create `src/lib/file-storage.ts` utility module
- [ ] Implement secure file upload handling
- [ ] Add image processing capabilities (sharp integration)
- [ ] Create file deletion and cleanup functions
- [ ] Add file metadata extraction

#### 3.3 Upload Components
- [ ] Create reusable image upload component
- [ ] Implement drag-and-drop functionality
- [ ] Add upload progress indicators
- [ ] Create image preview and editing interface
- [ ] Design upload error handling and retry logic

### 4. Base UI Infrastructure (Day 4)

#### 4.1 Layout System
- [ ] Create main dashboard layout for recipe app
- [ ] Implement responsive navigation system
- [ ] Design header with recipe-specific actions
- [ ] Create sidebar with recipe categories and quick access
- [ ] Set up mobile-optimized navigation

#### 4.2 Theme and Design System
- [ ] Configure dark/light mode for recipe viewing
- [ ] Set up recipe-specific color palette
- [ ] Create typography scales for recipe content
- [ ] Implement consistent spacing and layout grids
- [ ] Design recipe-focused component variants

#### 4.3 Base Components
- [ ] Create recipe card component foundation
- [ ] Implement search and filter components
- [ ] Design loading states and skeleton components
- [ ] Create error boundary and fallback components
- [ ] Build notification and toast system

#### 4.4 Recipe-Specific UI Components
- [ ] Create ingredient list component
- [ ] Design instruction steps component
- [ ] Implement tag display and management
- [ ] Build image gallery component
- [ ] Create recipe metadata display

### 5. API Infrastructure (Day 5)

#### 5.1 Server Actions Foundation
- [ ] Set up server action structure following project conventions
- [ ] Create base server action utilities with error handling
- [ ] Implement authentication validation for server actions
- [ ] Set up logging for server actions using pino
- [ ] Create server action response types and validation

#### 5.2 Core API Routes
- [ ] Implement health check endpoints
- [ ] Create file upload/download API routes
- [ ] Set up image serving with optimization
- [ ] Add search API endpoints foundation
- [ ] Implement proper API error handling

#### 5.3 Validation and Types
- [ ] Create Zod schemas for all recipe data types
- [ ] Implement validation utilities for recipe inputs
- [ ] Set up TypeScript types for all recipe entities
- [ ] Create form validation schemas
- [ ] Add API response type definitions

### 6. Testing Infrastructure (Day 6)

#### 6.1 Test Environment Setup
- [ ] Configure Vitest for recipe app testing
- [ ] Set up test database with cleanup
- [ ] Create test utilities for recipe data
- [ ] Implement authentication testing helpers
- [ ] Set up file upload testing infrastructure

#### 6.2 Core Test Suites
- [ ] Write unit tests for database schema operations
- [ ] Test authentication flows and server actions
- [ ] Create file upload and storage tests
- [ ] Implement UI component testing framework
- [ ] Add integration tests for core workflows

#### 6.3 Testing Utilities
- [ ] Create recipe data factories for testing
- [ ] Implement database seeding for tests
- [ ] Set up mock services for external dependencies
- [ ] Create test helpers for auth and permissions
- [ ] Add performance testing utilities

### 7. Development Workflow (Day 7)

#### 7.1 Development Scripts Enhancement
- [ ] Optimize database development workflow
- [ ] Create recipe data seeding scripts
- [ ] Set up development data reset utilities
- [ ] Add recipe-specific health check scripts
- [ ] Implement development debugging tools

#### 7.2 Documentation Setup
- [ ] Create API documentation foundation
- [ ] Document database schema and relationships
- [ ] Add development setup instructions
- [ ] Create troubleshooting guides
- [ ] Document testing procedures

#### 7.3 Code Quality Integration
- [ ] Configure linting rules for recipe app patterns
- [ ] Set up pre-commit hooks for recipe-specific validations
- [ ] Add code coverage requirements
- [ ] Implement architectural linting rules
- [ ] Set up continuous integration foundations

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
- [ ] All recipe schema tables created and properly related
- [ ] Database migrations execute successfully
- [ ] Seed data populates correctly for development
- [ ] Full-text search works on recipe content
- [ ] All indexes perform within acceptable limits (<100ms for common queries)

#### Authentication
- [ ] User registration, login, logout flows work perfectly
- [ ] Session management is secure and persistent
- [ ] Auth guards protect recipe operations correctly
- [ ] Password reset functionality is operational
- [ ] Auth UI is responsive and accessible

#### File Storage
- [ ] Image uploads work reliably with progress indication
- [ ] File validation prevents security issues
- [ ] Image processing and optimization functions correctly
- [ ] File serving is secure and performant
- [ ] Cleanup and deletion work properly

#### UI Foundation
- [ ] Dashboard layout is responsive and accessible
- [ ] Dark/light mode switching works throughout
- [ ] Navigation is intuitive for recipe management
- [ ] Loading states and error handling are comprehensive
- [ ] Mobile experience is fully functional

#### Testing
- [ ] Test suite runs successfully with >80% coverage
- [ ] Database operations are thoroughly tested
- [ ] Authentication flows have comprehensive test coverage
- [ ] File operations are tested with various scenarios
- [ ] UI components have proper test coverage

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