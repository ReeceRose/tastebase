# Phase 2: Recipe CRUD Operations

**Duration:** 7-10 days  
**Priority:** Critical  
**Prerequisites:** Phase 1 (Core Infrastructure) completed  
**Dependencies:** Foundation for Phase 3 (AI Integration)

---

## Overview

Implement the complete recipe management system with full CRUD (Create, Read, Update, Delete) operations. This phase creates the core functionality that makes this a usable recipe management application, including recipe forms, display components organized by purposes.

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
- [x] Set up `src/features/recipes/` following project conventions
- [x] Create component directories with skeleton structure
- [x] Set up server actions directory
- [x] Create recipe types and validation schemas
- [x] Set up recipe utilities and helpers

```typescript
# UPDATED: Components organized by purpose (not by feature)
src/
├── components/
│   ├── forms/
│   │   ├── recipe-create-form.tsx     # Recipe creation form
│   │   ├── recipe-edit-form.tsx       # Recipe editing form
│   │   ├── ingredient-input-form.tsx  # Ingredient input component
│   │   └── instruction-input-form.tsx # Instruction input component
│   ├── lists/
│   │   ├── recipe-list.tsx            # Recipe listing component
│   │   └── ingredient-list.tsx        # Recipe ingredients display
│   ├── cards/
│   │   ├── recipe-card.tsx            # Recipe preview card
│   │   ├── recipe-detail-view.tsx     # Full recipe display
│   │   └── recipe-notes-section.tsx   # Recipe notes card
│   ├── modals/
│   │   └── recipe-delete-dialog.tsx   # Recipe deletion confirmation
│   ├── recipes/                       # Recipe-specific display components
│   │   ├── image-gallery.tsx          # Recipe image display
│   │   ├── instruction-steps.tsx      # Recipe instructions display
│   │   ├── recipe-metadata.tsx        # Recipe timing/servings display
│   │   └── recipe-tags.tsx            # Recipe tags display
│   ├── skeletons/                     # REQUIRED: All loading states
│   │   ├── recipe-card-skeleton.tsx
│   │   ├── recipe-detail-skeleton.tsx
│   │   ├── recipe-form-skeleton.tsx
│   │   └── recipe-list-skeleton.tsx
│   └── recipe-images/                 # Image upload components
│       └── image-upload.tsx           # Recipe image upload
├── lib/
│   ├── server-actions/
│   │   ├── recipe-actions.ts          # Recipe CRUD server actions
│   │   ├── recipe-image-actions.ts    # Image upload server actions
│   │   └── recipe-favorites-actions.ts # Favorites server actions
│   ├── types/
│   │   └── recipe-types.ts            # Recipe TypeScript types
│   ├── validations/
│   │   └── recipe-schemas.ts          # Zod validation schemas
│   └── utils/
│       └── recipe-utils.ts            # Recipe utility functions
├── app/
│   └── (dashboard)/
│       └── recipes/
│           ├── page.tsx               # SUSPENSE: Recipe listing page
│           ├── new/page.tsx           # SUSPENSE: Recipe creation page
│           └── [id]/
│               ├── page.tsx           # SUSPENSE: Recipe detail page
│               └── edit/page.tsx      # SUSPENSE: Recipe edit page
└── hooks/
    ├── use-recipe-form.ts             # Recipe form logic
    ├── use-recipe-images.ts           # Image upload logic
    └── use-recipe-notes.ts            # Notes management logic
```

**CRITICAL: All pages MUST use Suspense + streaming pattern:**
- Page handles AUTH only (fast ~50ms)
- Data components stream in with Suspense boundaries
- Skeleton components provide loading states

#### 1.2 Core Types and Validation
- [x] Create comprehensive recipe TypeScript types
- [x] Implement Zod validation schemas for all recipe operations
- [x] Set up form validation schemas
- [x] Create recipe constants and enums
- [x] Define API response types

### 2. Recipe Server Actions (Days 2-3)

#### 2.1 Core CRUD Server Actions
- [x] `createRecipe(data: CreateRecipeInput)` - Create new recipe
- [x] `getRecipe(id: string)` - Get single recipe with all relations
- [x] `updateRecipe(id: string, data: UpdateRecipeInput)` - Update recipe
- [x] `deleteRecipe(id: string)` - Soft delete recipe with cleanup
- [x] `getUserRecipes(userId: string, options)` - Get user's recipe list

#### 2.2 Recipe Component Actions
- [x] `addRecipeIngredient(recipeId, ingredient)` - Add ingredient to recipe
- [x] `updateRecipeIngredient(id, updates)` - Update specific ingredient
- [x] `removeRecipeIngredient(id)` - Remove ingredient from recipe
- [x] `reorderRecipeIngredients(recipeId, order)` - Reorder ingredients
- [x] `addRecipeInstruction(recipeId, instruction)` - Add instruction step
- [x] `updateRecipeInstruction(id, updates)` - Update instruction
- [x] `removeRecipeInstruction(id)` - Remove instruction
- [x] `reorderRecipeInstructions(recipeId, order)` - Reorder instructions

#### 2.3 Recipe Image Actions
- [x] `uploadRecipeImage(recipeId, file)` - Upload and process recipe image (attachImageToRecipe)
- [x] `setRecipeHeroImage(recipeId, imageId)` - Set main recipe image (setHeroImage)
- [x] `updateRecipeImageMetadata(imageId, metadata)` - Update image info (updateRecipeImage)
- [x] `deleteRecipeImage(imageId)` - Remove image and file cleanup (deleteRecipeImage)
- [x] `reorderRecipeImages(recipeId, order)` - Change image order (reorderRecipeImages)

#### 2.4 Recipe Notes Actions
- [x] `addRecipeNote(recipeId, content, rating)` - Add personal note
- [x] `updateRecipeNote(noteId, updates)` - Update existing note
- [x] `deleteRecipeNote(noteId)` - Remove recipe note
- [x] `getRecipeNotes(recipeId)` - Get all notes for recipe

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
- [x] Design comprehensive recipe creation form
- [x] Implement multi-step form with validation
- [x] Add real-time validation and error handling
- [x] Create dynamic ingredient input with auto-complete
- [x] Build dynamic instruction input with reordering
- [x] Add recipe metadata inputs (time, servings, difficulty)
- [x] Implement tag input with suggestions
- [x] Add image upload within the form

#### 3.2 Recipe Editing Form
- [x] Create edit form with pre-populated data
- [x] Implement in-place editing for quick updates
- [x] Add save/cancel functionality with unsaved changes warning
- [x] Create ingredient and instruction editing interface
- [x] Implement image replacement and management
- [x] Add form state management and auto-save

#### 3.3 Specialized Input Components
- [x] `IngredientInput` - Smart ingredient parsing and entry (ingredient-input.tsx)
- [x] `InstructionInput` - Rich text instruction editor (instruction-input.tsx)
- [x] `RecipeTimeInput` - Time input with validation (built into InstructionInput)
- [x] `RecipeTagInput` - Tag selection with autocomplete (recipe-tag-input.tsx)
- [x] `RecipeDifficultySelect` - Difficulty level selector (uses Select component)
- [x] `RecipeCuisineInput` - Cuisine type input with suggestions (uses Input component)

#### 3.4 Form Validation and User Experience
- [x] Real-time validation with helpful error messages
- [x] Progressive disclosure for advanced options
- [x] Auto-save drafts functionality
- [x] Form submission with loading states
- [x] Success/error feedback with next actions
- [x] Keyboard shortcuts for power users

### 4. Recipe Display Components (Days 4-5)

#### 4.1 Recipe List View
- [x] Create grid layout for recipe cards
- [x] Implement recipe card with image, title, and metadata
- [x] Add quick actions (edit, delete, favorite) (recipe-quick-actions.tsx)
- [x] Create list view option for dense display
- [x] Add sorting options (date, name, cook time, rating)
- [x] Implement infinite scroll or pagination
- [x] Add recipe status indicators (new, recently edited) (recipe-status-indicators.tsx)

#### 4.2 Recipe Detail View
- [x] Design hero section with main image and metadata
- [x] Create ingredients section with measurements and notes
- [x] Build instructions section with step-by-step display
- [x] Add image gallery for additional recipe photos
- [x] Implement notes and ratings display
- [x] Add recipe actions (edit, delete, share, print)
- [ ] Create related recipes suggestions section

#### 4.3 Recipe Card Components
- [x] `RecipeCard` - Compact recipe display for lists
- [x] `RecipeHeroCard` - Featured recipe display
- [x] `RecipeGridCard` - Grid view optimized card
- [x] `RecipeListCard` - List view optimized card
- [ ] `RecipeMiniCard` - Small card for related recipes

#### 4.4 Recipe Content Components
- [x] `RecipeIngredientsList` - Formatted ingredients display (IngredientList)
- [x] `RecipeInstructionsList` - Step-by-step instructions (InstructionSteps)
- [x] `RecipeMetadata` - Time, servings, difficulty display
- [x] `RecipeImageGallery` - Multi-image display with lightbox (ImageGallery)
- [x] `RecipeTagsList` - Recipe tags with filtering (RecipeTagsList)
- [x] `RecipeNotesSection` - Personal notes and ratings

### 5. Recipe Image Management (Day 5-6)

#### 5.1 Image Upload System
- [x] Create multi-image upload component (image-upload.tsx)
- [x] Implement drag-and-drop image upload
- [x] Add image preview with editing options
- [x] Create image cropping and resizing interface
- [x] Add progress indicators for upload operations
- [x] Implement upload error handling and retry

#### 5.2 Image Management Interface
- [x] Build image gallery management view (recipe-image-manager.tsx)
- [x] Create image reordering interface (drag-and-drop in image manager)
- [x] Add hero image selection functionality (recipe-image-manager.tsx)
- [x] Implement image metadata editing (alt text, captions) (recipe-image-manager.tsx)
- [x] Create image deletion with confirmation (recipe-image-manager.tsx)
- [x] Add bulk image operations

#### 5.3 Image Display Components
- [x] `RecipeImageUploader` - Upload interface with preview (image-upload.tsx)
- [x] `RecipeImageGallery` - Display multiple images (image-gallery.tsx)
- [x] `RecipeHeroImage` - Main recipe image display (via ImageGallery)
- [x] `RecipeImageCard` - Individual image management
- [x] `RecipeImageLightbox` - Full-screen image viewing

#### 5.4 Image Processing Features
- [x] Auto-resize images for web optimization
- [x] Generate thumbnails for fast loading
- [x] Image format conversion (JPEG, WebP)
- [x] Add image compression settings
- [x] Implement progressive image loading
- [x] Create responsive image serving

### 6. Recipe Notes and Personal Features (Day 6)

#### 6.1 Notes System
- [x] Create rich text note editor (recipe-note-form.tsx)
- [x] Implement note categories (cooking tips, modifications, ratings)
- [x] Add date tracking for notes
- [x] Create note search and filtering
- [x] Implement private vs shared notes
- [x] Add note templates for common use cases

#### 6.2 Rating and Review System
- [x] Implement 5-star rating system (recipe-note-form.tsx)
- [x] Add review categories (taste, difficulty, time accuracy)
- [x] Create rating history and trends
- [x] Add quick rating interface
- [ ] Implement rating-based recipe recommendations

#### 6.3 Personal Recipe Features
- [x] Recipe favorites/bookmarking system (recipe-favorites-actions.ts, recipe-favorite-button.tsx)
- [x] Recently viewed recipes tracking (recipe-tracking-actions.ts)
- [x] Recipe modification history
- [x] Personal recipe collections/folders
- [x] Recipe sharing preparation (for future phases)

### 7. Recipe Organization and Basic Search (Day 7)

#### 7.1 Recipe Listing and Filtering
- [x] Create comprehensive recipe list page (recipe-list.tsx)
- [x] Implement basic text search across recipes (recipe-search-form.tsx)
- [x] Add filtering by tags, difficulty, time (recipe-search-form.tsx)
- [x] Create sorting options (name, date, rating, time) (recipe-sort-options.tsx)
- [x] Add recipe status filters (favorites, recent, archived)
- [x] Implement search result highlighting (enhanced-recipe-search.tsx, search-highlighting.tsx)

#### 7.2 Basic Search Implementation
- [x] Set up full-text search on recipe content (enhanced search with relevance scoring)
- [x] Create search suggestions and autocomplete (enhanced-recipe-search.tsx)
- [x] Implement search history for users (localStorage-based history)
- [x] Add search filters and faceted search (relevance-based filtering)
- [x] Create search result ranking algorithm (getSearchRelevance utility)
- [x] Add search performance optimization

#### 7.3 Recipe Collection Features
- [x] Create basic recipe collections/folders
- [x] Implement collection management interface
- [x] Add recipes to collections functionality
- [x] Create collection sharing preparation
- [x] Add collection-based filtering and navigation

### 8. Recipe Import from Text (Day 8)

#### 8.1 Manual Text Import
- [x] Create text input interface for recipe import (recipe-import-form.tsx)
- [x] Implement basic recipe text parsing (recipe-import-actions.ts)
- [x] Add structured data extraction from free text
- [x] Create import preview with manual correction
- [x] Add common recipe format recognition
- [x] Implement import validation and cleanup

#### 8.2 Import Processing
- [x] Parse ingredients with quantities and units (parseIngredients)
- [x] Extract cooking instructions and steps (parseInstructions)
- [x] Identify recipe metadata (time, servings) (parseMetadata)
- [x] Detect and extract recipe tags
- [x] Handle multiple recipe formats and structures
- [x] Create import success/failure reporting

#### 8.3 Import User Interface
- [x] Design intuitive import workflow
- [x] Add import progress indicators
- [x] Create manual correction interface
- [x] Implement import preview and confirmation
- [x] Add import history and management
- [x] Create import tips and help documentation

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
- [x] Users can create recipes with all required fields
- [x] Multi-step form validation works perfectly
- [x] Images upload and display correctly
- [x] Ingredients and instructions can be dynamically added/removed
- [x] Recipe saves successfully with proper data relationships

#### Recipe Display
- [x] Recipe list displays all user recipes with proper pagination
- [x] Recipe detail view shows complete recipe information
- [x] Images display correctly with proper optimization
- [x] Recipe metadata (time, servings, difficulty) displays accurately
- [x] Notes and ratings display and function correctly

#### Recipe Editing
- [x] All recipe fields can be edited in-place or via forms
- [x] Changes save correctly with proper validation
- [x] Image management (upload, delete, reorder) works seamlessly
- [x] Ingredient and instruction editing preserves order and data
- [x] Edit operations maintain data integrity

#### Recipe Management
- [x] Recipes can be deleted with proper confirmation
- [x] Deleted recipes don't break references or leave orphaned data
- [x] Recipe search finds relevant results quickly
- [x] Basic filtering and sorting work correctly
- [x] Import from text creates valid, editable recipes

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