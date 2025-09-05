# Phase 2: Recipe CRUD Operations

**Duration:** 7-10 days  
**Priority:** Critical  
**Prerequisites:** Phase 1 (Core Infrastructure) completed  
**Dependencies:** Foundation for Phase 3 (AI Integration)

---

## Overview

Implement the complete recipe management system with full CRUD (Create, Read, Update, Delete) operations. This phase creates the core functionality that makes this a usable recipe management application, including recipe forms, display components, image management, notes, and basic organization features.

## Goals

- ✅ Complete recipe creation, editing, and deletion
- ✅ Rich recipe display with ingredients, instructions, and images
- ✅ Image upload and management for recipes
- ✅ Recipe notes and personal cooking tips
- ✅ Basic recipe organization and listing
- ✅ Recipe import from manual text entry

---

## Tasks Breakdown

### 1. Recipe Feature Module Setup (Day 1)

#### 1.1 Create Feature Structure
- [ ] Set up `src/features/recipes/` following project conventions
- [ ] Create component directories with skeleton structure
- [ ] Set up server actions directory
- [ ] Create recipe types and validation schemas
- [ ] Set up recipe utilities and helpers

```typescript
src/features/recipes/
├── components/
│   ├── forms/
│   │   ├── recipe-create-form.tsx
│   │   ├── recipe-edit-form.tsx
│   │   ├── ingredient-input-form.tsx
│   │   └── instruction-input-form.tsx
│   ├── display/
│   │   ├── recipe-card.tsx
│   │   ├── recipe-detail-view.tsx
│   │   ├── recipe-list.tsx
│   │   └── recipe-hero-section.tsx
│   ├── management/
│   │   ├── recipe-image-manager.tsx
│   │   ├── recipe-notes-section.tsx
│   │   ├── recipe-actions-menu.tsx
│   │   └── recipe-delete-dialog.tsx
│   └── skeletons/
│       ├── recipe-card-skeleton.tsx
│       ├── recipe-detail-skeleton.tsx
│       ├── recipe-form-skeleton.tsx
│       └── recipe-list-skeleton.tsx
├── server/
│   ├── recipe-actions.ts
│   ├── recipe-queries.ts
│   └── recipe-validation.ts
├── lib/
│   ├── recipe-types.ts
│   ├── recipe-utils.ts
│   └── recipe-constants.ts
└── hooks/
    ├── use-recipe-form.ts
    ├── use-recipe-images.ts
    └── use-recipe-notes.ts
```

#### 1.2 Core Types and Validation
- [ ] Create comprehensive recipe TypeScript types
- [ ] Implement Zod validation schemas for all recipe operations
- [ ] Set up form validation schemas
- [ ] Create recipe constants and enums
- [ ] Define API response types

### 2. Recipe Server Actions (Days 2-3)

#### 2.1 Core CRUD Server Actions
- [ ] `createRecipe(data: CreateRecipeInput)` - Create new recipe
- [ ] `getRecipe(id: string)` - Get single recipe with all relations
- [ ] `updateRecipe(id: string, data: UpdateRecipeInput)` - Update recipe
- [ ] `deleteRecipe(id: string)` - Soft delete recipe with cleanup
- [ ] `getUserRecipes(userId: string, options)` - Get user's recipe list

#### 2.2 Recipe Component Actions
- [ ] `addRecipeIngredient(recipeId, ingredient)` - Add ingredient to recipe
- [ ] `updateRecipeIngredient(id, updates)` - Update specific ingredient
- [ ] `removeRecipeIngredient(id)` - Remove ingredient from recipe
- [ ] `reorderRecipeIngredients(recipeId, order)` - Reorder ingredients
- [ ] `addRecipeInstruction(recipeId, instruction)` - Add instruction step
- [ ] `updateRecipeInstruction(id, updates)` - Update instruction
- [ ] `removeRecipeInstruction(id)` - Remove instruction
- [ ] `reorderRecipeInstructions(recipeId, order)` - Reorder instructions

#### 2.3 Recipe Image Actions
- [ ] `uploadRecipeImage(recipeId, file)` - Upload and process recipe image
- [ ] `setRecipeHeroImage(recipeId, imageId)` - Set main recipe image
- [ ] `updateRecipeImageMetadata(imageId, metadata)` - Update image info
- [ ] `deleteRecipeImage(imageId)` - Remove image and file cleanup
- [ ] `reorderRecipeImages(recipeId, order)` - Change image order

#### 2.4 Recipe Notes Actions
- [ ] `addRecipeNote(recipeId, content, rating)` - Add personal note
- [ ] `updateRecipeNote(noteId, updates)` - Update existing note
- [ ] `deleteRecipeNote(noteId)` - Remove recipe note
- [ ] `getRecipeNotes(recipeId)` - Get all notes for recipe

#### 2.5 Server Action Implementation Details
```typescript
// Example server action structure
"use server";

import { auth } from "@/lib/auth/auth;
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { createOperationLogger } from "@/lib/logging/logger";
import { validateRecipeData } from "./recipe-validation";

export async function createRecipe(data: CreateRecipeInput) {
  const logger = createOperationLogger("create-recipe");
  
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const validatedData = validateRecipeData(data);
    
    const recipe = await db.transaction(async (tx) => {
      // Create recipe
      const [newRecipe] = await tx.insert(recipes).values({
        id: nanoid(),
        userId: session.user.id,
        ...validatedData
      }).returning();

      // Add ingredients
      if (validatedData.ingredients?.length) {
        await tx.insert(recipeIngredients).values(
          validatedData.ingredients.map((ing, index) => ({
            id: nanoid(),
            recipeId: newRecipe.id,
            sortOrder: index,
            ...ing
          }))
        );
      }

      // Add instructions
      if (validatedData.instructions?.length) {
        await tx.insert(recipeInstructions).values(
          validatedData.instructions.map((inst, index) => ({
            id: nanoid(),
            recipeId: newRecipe.id,
            stepNumber: index + 1,
            ...inst
          }))
        );
      }

      return newRecipe;
    });

    logger.info({ recipeId: recipe.id }, "Recipe created successfully");
    return { success: true, recipe };
    
  } catch (error) {
    logError(logger, "Failed to create recipe", error);
    return { success: false, error: "Failed to create recipe" };
  }
}
```

### 3. Recipe Forms and Input (Days 3-4)

#### 3.1 Recipe Creation Form
- [ ] Design comprehensive recipe creation form
- [ ] Implement multi-step form with validation
- [ ] Add real-time validation and error handling
- [ ] Create dynamic ingredient input with auto-complete
- [ ] Build dynamic instruction input with reordering
- [ ] Add recipe metadata inputs (time, servings, difficulty)
- [ ] Implement tag input with suggestions
- [ ] Add image upload within the form

#### 3.2 Recipe Editing Form
- [ ] Create edit form with pre-populated data
- [ ] Implement in-place editing for quick updates
- [ ] Add save/cancel functionality with unsaved changes warning
- [ ] Create ingredient and instruction editing interface
- [ ] Implement image replacement and management
- [ ] Add form state management and auto-save

#### 3.3 Specialized Input Components
- [ ] `IngredientInput` - Smart ingredient parsing and entry
- [ ] `InstructionInput` - Rich text instruction editor
- [ ] `RecipeTimeInput` - Time input with validation
- [ ] `RecipeTagInput` - Tag selection with autocomplete
- [ ] `RecipeDifficultySelect` - Difficulty level selector
- [ ] `RecipeCuisineInput` - Cuisine type input with suggestions

#### 3.4 Form Validation and User Experience
- [ ] Real-time validation with helpful error messages
- [ ] Progressive disclosure for advanced options
- [ ] Auto-save drafts functionality
- [ ] Form submission with loading states
- [ ] Success/error feedback with next actions
- [ ] Keyboard shortcuts for power users

### 4. Recipe Display Components (Days 4-5)

#### 4.1 Recipe List View
- [ ] Create grid layout for recipe cards
- [ ] Implement recipe card with image, title, and metadata
- [ ] Add quick actions (edit, delete, favorite)
- [ ] Create list view option for dense display
- [ ] Add sorting options (date, name, cook time, rating)
- [ ] Implement infinite scroll or pagination
- [ ] Add recipe status indicators (new, recently edited)

#### 4.2 Recipe Detail View
- [ ] Design hero section with main image and metadata
- [ ] Create ingredients section with measurements and notes
- [ ] Build instructions section with step-by-step display
- [ ] Add image gallery for additional recipe photos
- [ ] Implement notes and ratings display
- [ ] Add recipe actions (edit, delete, share, print)
- [ ] Create related recipes suggestions section

#### 4.3 Recipe Card Components
- [ ] `RecipeCard` - Compact recipe display for lists
- [ ] `RecipeHeroCard` - Featured recipe display
- [ ] `RecipeGridCard` - Grid view optimized card
- [ ] `RecipeListCard` - List view optimized card
- [ ] `RecipeMiniCard` - Small card for related recipes

#### 4.4 Recipe Content Components
- [ ] `RecipeIngredientsList` - Formatted ingredients display
- [ ] `RecipeInstructionsList` - Step-by-step instructions
- [ ] `RecipeMetadata` - Time, servings, difficulty display
- [ ] `RecipeImageGallery` - Multi-image display with lightbox
- [ ] `RecipeTagsList` - Recipe tags with filtering
- [ ] `RecipeNotesSection` - Personal notes and ratings

### 5. Recipe Image Management (Day 5-6)

#### 5.1 Image Upload System
- [ ] Create multi-image upload component
- [ ] Implement drag-and-drop image upload
- [ ] Add image preview with editing options
- [ ] Create image cropping and resizing interface
- [ ] Add progress indicators for upload operations
- [ ] Implement upload error handling and retry

#### 5.2 Image Management Interface
- [ ] Build image gallery management view
- [ ] Create image reordering interface
- [ ] Add hero image selection functionality
- [ ] Implement image metadata editing (alt text, captions)
- [ ] Create image deletion with confirmation
- [ ] Add bulk image operations

#### 5.3 Image Display Components
- [ ] `RecipeImageUploader` - Upload interface with preview
- [ ] `RecipeImageGallery` - Display multiple images
- [ ] `RecipeHeroImage` - Main recipe image display
- [ ] `RecipeImageCard` - Individual image management
- [ ] `RecipeImageLightbox` - Full-screen image viewing

#### 5.4 Image Processing Features
- [ ] Auto-resize images for web optimization
- [ ] Generate thumbnails for fast loading
- [ ] Image format conversion (JPEG, WebP)
- [ ] Add image compression settings
- [ ] Implement progressive image loading
- [ ] Create responsive image serving

### 6. Recipe Notes and Personal Features (Day 6)

#### 6.1 Notes System
- [ ] Create rich text note editor
- [ ] Implement note categories (cooking tips, modifications, ratings)
- [ ] Add date tracking for notes
- [ ] Create note search and filtering
- [ ] Implement private vs shared notes
- [ ] Add note templates for common use cases

#### 6.2 Rating and Review System
- [ ] Implement 5-star rating system
- [ ] Add review categories (taste, difficulty, time accuracy)
- [ ] Create rating history and trends
- [ ] Add quick rating interface
- [ ] Implement rating-based recipe recommendations

#### 6.3 Personal Recipe Features
- [ ] Recipe favorites/bookmarking system
- [ ] Recently viewed recipes tracking
- [ ] Recipe modification history
- [ ] Personal recipe collections/folders
- [ ] Recipe sharing preparation (for future phases)

### 7. Recipe Organization and Basic Search (Day 7)

#### 7.1 Recipe Listing and Filtering
- [ ] Create comprehensive recipe list page
- [ ] Implement basic text search across recipes
- [ ] Add filtering by tags, difficulty, time
- [ ] Create sorting options (name, date, rating, time)
- [ ] Add recipe status filters (favorites, recent, archived)
- [ ] Implement search result highlighting

#### 7.2 Basic Search Implementation
- [ ] Set up full-text search on recipe content
- [ ] Create search suggestions and autocomplete
- [ ] Implement search history for users
- [ ] Add search filters and faceted search
- [ ] Create search result ranking algorithm
- [ ] Add search performance optimization

#### 7.3 Recipe Collection Features
- [ ] Create basic recipe collections/folders
- [ ] Implement collection management interface
- [ ] Add recipes to collections functionality
- [ ] Create collection sharing preparation
- [ ] Add collection-based filtering and navigation

### 8. Recipe Import from Text (Day 8)

#### 8.1 Manual Text Import
- [ ] Create text input interface for recipe import
- [ ] Implement basic recipe text parsing
- [ ] Add structured data extraction from free text
- [ ] Create import preview with manual correction
- [ ] Add common recipe format recognition
- [ ] Implement import validation and cleanup

#### 8.2 Import Processing
- [ ] Parse ingredients with quantities and units
- [ ] Extract cooking instructions and steps
- [ ] Identify recipe metadata (time, servings)
- [ ] Detect and extract recipe tags
- [ ] Handle multiple recipe formats and structures
- [ ] Create import success/failure reporting

#### 8.3 Import User Interface
- [ ] Design intuitive import workflow
- [ ] Add import progress indicators
- [ ] Create manual correction interface
- [ ] Implement import preview and confirmation
- [ ] Add import history and management
- [ ] Create import tips and help documentation

---

## Technical Specifications

### Database Operations
- **Transaction Management:** All recipe operations use database transactions
- **Data Integrity:** Foreign key constraints maintain data relationships
- **Performance:** Optimized queries for recipe listing and search
- **Backup:** Recipe operations logged for audit and recovery

### Form Validation
- **Client-Side:** Real-time validation with Zod schemas
- **Server-Side:** Double validation for security
- **User Experience:** Progressive validation with helpful error messages
- **Data Sanitization:** All inputs sanitized and validated

### Image Handling
- **File Types:** Support JPEG, PNG, WebP formats
- **Size Limits:** 10MB per image, 50MB total per recipe
- **Processing:** Auto-resize, compress, and optimize images
- **Storage:** Organized file structure with cleanup procedures

---

## Acceptance Criteria

### ✅ Recipe CRUD Complete When:

#### Recipe Creation
- [ ] Users can create recipes with all required fields
- [ ] Multi-step form validation works perfectly
- [ ] Images upload and display correctly
- [ ] Ingredients and instructions can be dynamically added/removed
- [ ] Recipe saves successfully with proper data relationships

#### Recipe Display
- [ ] Recipe list displays all user recipes with proper pagination
- [ ] Recipe detail view shows complete recipe information
- [ ] Images display correctly with proper optimization
- [ ] Recipe metadata (time, servings, difficulty) displays accurately
- [ ] Notes and ratings display and function correctly

#### Recipe Editing
- [ ] All recipe fields can be edited in-place or via forms
- [ ] Changes save correctly with proper validation
- [ ] Image management (upload, delete, reorder) works seamlessly
- [ ] Ingredient and instruction editing preserves order and data
- [ ] Edit operations maintain data integrity

#### Recipe Management
- [ ] Recipes can be deleted with proper confirmation
- [ ] Deleted recipes don't break references or leave orphaned data
- [ ] Recipe search finds relevant results quickly
- [ ] Basic filtering and sorting work correctly
- [ ] Import from text creates valid, editable recipes

### 🧪 Testing Requirements
- [ ] All CRUD operations have comprehensive test coverage
- [ ] Form validation is thoroughly tested
- [ ] Image upload and processing have integration tests
- [ ] Database operations are tested with various scenarios
- [ ] User workflows are tested end-to-end

---

## Risk Assessment

### 🔴 High Risk
- **Data integrity issues:** Complex recipe relationships require careful transaction management
- **Image upload security:** File uploads present security vulnerabilities if not properly validated
- **Performance bottlenecks:** Recipe lists and search may be slow with large datasets

### 🟡 Medium Risk
- **Form complexity:** Multi-step recipe forms may have complex state management issues
- **Text import accuracy:** Manual recipe parsing may have inconsistent results
- **Mobile usability:** Complex recipe forms may need significant mobile optimization

### 🟢 Low Risk
- **UI component integration:** Building on Phase 1 foundation should be smooth
- **Basic search functionality:** Simple text search is well-understood
- **Recipe display:** Straightforward data display with established patterns

---

## Performance Requirements

### Recipe Operations
- Recipe creation: <2 seconds end-to-end
- Recipe loading: <500ms for single recipe
- Recipe list: <1 second for paginated results
- Recipe search: <200ms for basic text search

### Image Operations
- Image upload: <5 seconds for 10MB file
- Image processing: <3 seconds for resize/optimize
- Image display: <100ms for optimized images
- Gallery loading: Progressive loading with lazy loading

### Form Performance
- Form validation: <100ms for real-time validation
- Auto-save: <1 second for draft saves
- Form submission: <3 seconds for complete recipe
- Dynamic updates: <50ms for adding/removing items

---

## Next Phase Dependencies

**Phase 3 (AI Integration) requires:**
- ✅ Complete recipe CRUD system
- ✅ Recipe text import functionality as foundation
- ✅ Image management system for AI-processed images
- ✅ Recipe validation and preview system
- ✅ Structured recipe data format
- ✅ Error handling and user feedback systems

**Estimated Completion:** 7-10 days  
**Critical Path:** Recipe schema → CRUD actions → Forms → Display components → Image management