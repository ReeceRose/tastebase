# Phase 1: Core Recipe Infrastructure

**Duration:** 5-7 days  
**Priority:** High (Core functionality)  
**Prerequisites:** ✅ Phase 0 completed  
**Dependencies:** Foundation from Phase 0

---

## Overview

Phase 1 implements the core recipe CRUD (Create, Read, Update, Delete) operations and basic recipe management functionality. This establishes the fundamental recipe infrastructure that all future phases will build upon.

## Current State Analysis

### ✅ Foundation Ready
- Recipe database schema deployed and tested
- BetterAuth authentication working
- Local SQLite database operational
- Development environment configured
- UI component library available

### 🎯 Phase 1 Goals
- Complete recipe CRUD operations
- Basic recipe listing and search
- Recipe image upload and management
- Recipe ingredient and instruction management
- Foundation for recipe collections

---

## Tasks Breakdown

### 1. Recipe Server Actions (Days 1-2)

#### 1.1 Core Recipe CRUD Actions
**File**: `src/lib/server-actions/actions.ts`

- [x] `createRecipe(formData)` - Create new recipe with ingredients and instructions
- [x] `updateRecipe(id, formData)` - Update existing recipe
- [x] `deleteRecipe(id)` - Soft delete recipe (set `is_archived = true`)
- [x] `getRecipe(id)` - Get single recipe with all components
- [x] `getUserRecipes(userId)` - Get user's recipe list with pagination
- [x] `duplicateRecipe(id)` - Clone existing recipe

#### 1.2 Recipe Components Actions
**File**: `src/lib/server-actions/ingredient-actions.ts`  
**File**: `src/lib/server-actions/instruction-actions.ts`

- [x] `addIngredient(recipeId, ingredient)` - Add ingredient to recipe (integrated into main recipe actions)
- [x] `updateIngredient(id, ingredient)` - Update ingredient (integrated into main recipe actions)
- [x] `deleteIngredient(id)` - Remove ingredient (integrated into main recipe actions)
- [x] `reorderIngredients(recipeId, ingredientIds)` - Update ingredient order (integrated into main recipe actions)
- [x] `addInstruction(recipeId, instruction)` - Add instruction to recipe (integrated into main recipe actions)
- [x] `updateInstruction(id, instruction)` - Update instruction (integrated into main recipe actions)
- [x] `deleteInstruction(id)` - Remove instruction (integrated into main recipe actions)
- [x] `reorderInstructions(recipeId, instructionIds)` - Update instruction order (integrated into main recipe actions)

#### 1.3 Recipe Search and Filtering
**File**: `src/lib/search/recipe-search.ts`

- [x] `searchRecipes(query, filters)` - Full-text search with filters (comprehensive implementation)
- [x] `getRecipesByTag(tagId)` - Filter by tags (integrated into search)
- [x] `getRecipesByCuisine(cuisine)` - Filter by cuisine (integrated into search)
- [x] `getRecipesByDifficulty(difficulty)` - Filter by difficulty (integrated into search)

### 2. Recipe UI Components (Days 2-4)

#### 2.1 Recipe Form Components
**Directory**: `src/components/forms/`

- [x] `recipe-form.tsx` - Main recipe creation/editing form (implemented as recipe-create-form.tsx and recipe-edit-form.tsx)
- [x] `recipe-basic-info-form.tsx` - Title, description, timing, etc. (integrated into main forms)
- [x] `recipe-ingredients-form.tsx` - Dynamic ingredient list with add/remove (integrated into main forms)
- [x] `recipe-instructions-form.tsx` - Step-by-step instruction builder (integrated into main forms)
- [x] `recipe-metadata-form.tsx` - Cuisine, difficulty, serving size (integrated into main forms)

#### 2.2 Recipe Display Components
**Directory**: `src/components/cards/` and `src/components/lists/`

- [x] `recipe-card.tsx` - Recipe summary card for lists
- [x] `recipe-detail-view.tsx` - Full recipe display
- [x] `recipe-ingredients-list.tsx` - Formatted ingredients display
- [x] `recipe-instructions-list.tsx` - Numbered instructions display
- [x] `recipe-metadata.tsx` - Recipe info (time, difficulty, servings) (integrated into detail view)

#### 2.3 Recipe List Components
**Directory**: `src/components/lists/`

- [x] `recipe-list.tsx` - Main recipe listing with pagination
- [x] `recipe-search-bar.tsx` - Search input with filters
- [x] `recipe-filters.tsx` - Cuisine, difficulty, tag filters
- [x] `recipe-sort-options.tsx` - Sort by date, name, difficulty

#### 2.4 Loading States
**Directory**: `src/components/skeletons/`

- [x] `recipe-form-skeleton.tsx` - Loading state for recipe forms
- [x] `recipe-card-skeleton.tsx` - Loading state for recipe cards
- [x] `recipe-detail-skeleton.tsx` - Loading state for recipe details
- [x] `recipe-list-skeleton.tsx` - Loading state for recipe lists
- [x] `recipe-ingredients-list-skeleton.tsx` - Loading state for ingredients
- [x] `recipe-instructions-list-skeleton.tsx` - Loading state for instructions

### 3. Recipe Image Management (Days 3-4)

#### 3.1 Image Upload System
**File**: `src/lib/server-actions/recipe-image-actions.ts`

- [x] `uploadRecipeImage(recipeId, file)` - Handle image uploads (implemented as attachImageToRecipe)
- [x] `deleteRecipeImage(imageId)` - Remove recipe image
- [x] `updateImageMetadata(imageId, metadata)` - Update alt text, etc. (implemented as updateRecipeImage)
- [x] `setHeroImage(recipeId, imageId)` - Designate main recipe image

#### 3.2 Image Display Components
**Directory**: `src/components/forms/` and integrated into main components

- [x] `recipe-image-upload.tsx` - Drag-and-drop image upload (integrated into forms)
- [x] `recipe-image-gallery.tsx` - Display multiple recipe images (integrated into detail view)
- [x] `recipe-hero-image.tsx` - Main recipe image display (integrated into detail view)
- [x] `image-optimization.tsx` - Responsive image component (integrated using Next.js Image)

#### 3.3 File Storage Setup
**Configuration**: Local file storage via API route `src/app/api/upload/recipe-image/route.ts`

- [x] Configure Next.js static file serving
- [x] Set up image optimization and resizing
- [x] Implement file validation and security
- [x] Create image thumbnail generation

### 4. Recipe Routes and Pages (Days 4-5)

#### 4.1 Recipe Management Pages
**Directory**: `src/app/(dashboard)/recipes/`

- [x] `page.tsx` - Recipe list/dashboard page
- [x] `new/page.tsx` - New recipe creation page (updated path structure)
- [x] `[id]/page.tsx` - Recipe detail view page
- [x] `[id]/edit/page.tsx` - Recipe editing page

#### 4.2 Recipe API Routes (if needed)
**Directory**: `src/app/api/upload/`

- [x] `recipe-image/route.ts` - Recipe image upload API endpoint (implemented for image uploads)
- [ ] `route.ts` - Recipe CRUD API endpoints (using Server Actions instead)
- [ ] `[id]/route.ts` - Single recipe operations (using Server Actions instead)
- [ ] `[id]/images/route.ts` - Recipe image operations (using Server Actions instead)

### 5. Recipe Validation and Types (Days 1-2)

#### 5.1 Validation Schemas
**File**: `src/lib/validations/recipe-validations.ts`

- [x] `RecipeFormSchema` - Main recipe validation (implemented as createRecipeSchema and updateRecipeSchema)
- [x] `IngredientSchema` - Individual ingredient validation (implemented as ingredientSchema)
- [x] `InstructionSchema` - Instruction step validation (implemented as instructionSchema)
- [x] `ImageUploadSchema` - File upload validation (implemented in image actions)

#### 5.2 TypeScript Types
**File**: `src/lib/types/recipe-types.ts`

- [x] `RecipeWithComponents` - Recipe with ingredients/instructions
- [x] `RecipeFormData` - Form submission types (implemented as CreateRecipeInput and UpdateRecipeInput)
- [x] `RecipeFilters` - Search/filter types (implemented as RecipeSearchParams)
- [x] `ImageUploadData` - Image upload types (implemented as UploadRecipeImageInput)


### 6. Database Optimizations (Days 5-6)

#### 6.1 Performance Indexes
- [x] Add indexes for common recipe queries (implemented in schema)
- [x] Optimize search performance with FTS (Full-Text Search)
- [x] Add composite indexes for filter combinations

#### 6.2 Data Seeding
**File**: `src/db/seeds/recipes.ts`

- [ ] Create sample recipe data for development
- [ ] Add various recipe types and complexities
- [ ] Include sample images and metadata

---

## Acceptance Criteria

### ✅ Core Recipe Management Complete When:
- [x] Users can create, edit, and delete recipes
- [x] Recipe ingredients can be added/removed/reordered
- [x] Recipe instructions can be added/removed/reordered  
- [x] Recipe images can be uploaded and managed
- [x] Recipe search and filtering works properly
- [x] All components have loading states (skeletons)
- [x] All server actions have proper error handling
- [x] TypeScript types are complete and accurate


### 📱 UI/UX Requirements
- [x] Recipe forms are intuitive and user-friendly
- [x] Recipe displays are visually appealing
- [x] Search and filtering are responsive
- [x] Image uploads provide clear feedback
- [x] Mobile-responsive design works properly

---

## Risk Assessment

### 🔴 High Risk
- **Image upload complexity**: File handling, validation, and storage
- **Form state management**: Complex nested forms with dynamic fields
- **Search performance**: Large recipe databases may need optimization

### 🟡 Medium Risk  
- **Database query optimization**: May need tuning for complex filters
- **Mobile form UX**: Recipe forms can be complex on small screens

### 🟢 Low Risk
- **Basic CRUD operations**: Well-established patterns
- **Component structure**: Clear separation of concerns

---

## Performance Considerations

### Database Performance
- Use pagination for recipe lists (20-50 recipes per page)
- Implement lazy loading for recipe components
- Cache common queries (user's recent recipes)

### Image Performance
- Compress uploaded images automatically
- Generate thumbnails for recipe cards
- Use Next.js Image component for optimization

### UI Performance
- Implement virtual scrolling for large recipe lists
- Use React.memo for expensive recipe components
- Debounce search inputs to reduce API calls

---

## Future Integration Points

This phase establishes foundations for:
- **Phase 2**: Recipe collections and enhanced tagging
- **Phase 3**: AI-powered features (recipe suggestions, nutritional analysis)
- **Phase 4**: Meal planning and shopping lists
- **Phase 5**: Import/export and sharing features

---

## Development Workflow

### Day-by-Day Plan

**Days 1-2: Foundation**
- Set up validation schemas and types
- Implement core server actions
- Create basic database operations

**Days 3-4: UI Components**  
- Build recipe forms and display components
- Implement image upload functionality
- Create loading states and error handling

**Days 5-6: Integration & Polish**
- Connect components to server actions
- Implement pages and routing
- Performance optimization and final polish
- Bug fixes and refinements
- Documentation updates

### Success Metrics
- ✅ All acceptance criteria met
- ✅ No critical performance issues
- ✅ Clean, maintainable code structure

**Estimated Completion:** 5-6 days  
**Critical Path:** Server actions → UI components → Integration → Polish