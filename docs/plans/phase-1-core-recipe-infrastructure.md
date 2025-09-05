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
**File**: `src/features/recipes/server/actions.ts`

- [ ] `createRecipe(formData)` - Create new recipe with ingredients and instructions
- [ ] `updateRecipe(id, formData)` - Update existing recipe
- [ ] `deleteRecipe(id)` - Soft delete recipe (set `is_archived = true`)
- [ ] `getRecipe(id)` - Get single recipe with all components
- [ ] `getUserRecipes(userId)` - Get user's recipe list with pagination
- [ ] `duplicateRecipe(id)` - Clone existing recipe

#### 1.2 Recipe Components Actions
**File**: `src/features/recipes/server/ingredient-actions.ts`  
**File**: `src/features/recipes/server/instruction-actions.ts`

- [ ] `addIngredient(recipeId, ingredient)` - Add ingredient to recipe
- [ ] `updateIngredient(id, ingredient)` - Update ingredient
- [ ] `deleteIngredient(id)` - Remove ingredient
- [ ] `reorderIngredients(recipeId, ingredientIds)` - Update ingredient order
- [ ] `addInstruction(recipeId, instruction)` - Add instruction to recipe
- [ ] `updateInstruction(id, instruction)` - Update instruction
- [ ] `deleteInstruction(id)` - Remove instruction
- [ ] `reorderInstructions(recipeId, instructionIds)` - Update instruction order

#### 1.3 Recipe Search and Filtering
**File**: `src/features/recipes/server/search-actions.ts`

- [ ] `searchRecipes(query, filters)` - Full-text search with filters
- [ ] `getRecipesByTag(tagId)` - Filter by tags
- [ ] `getRecipesByCuisine(cuisine)` - Filter by cuisine
- [ ] `getRecipesByDifficulty(difficulty)` - Filter by difficulty

### 2. Recipe UI Components (Days 2-4)

#### 2.1 Recipe Form Components
**Directory**: `src/features/recipes/components/forms/`

- [ ] `recipe-form.tsx` - Main recipe creation/editing form
- [ ] `recipe-basic-info-form.tsx` - Title, description, timing, etc.
- [ ] `recipe-ingredients-form.tsx` - Dynamic ingredient list with add/remove
- [ ] `recipe-instructions-form.tsx` - Step-by-step instruction builder
- [ ] `recipe-metadata-form.tsx` - Cuisine, difficulty, serving size

#### 2.2 Recipe Display Components
**Directory**: `src/features/recipes/components/display/`

- [ ] `recipe-card.tsx` - Recipe summary card for lists
- [ ] `recipe-detail-view.tsx` - Full recipe display
- [ ] `recipe-ingredients-list.tsx` - Formatted ingredients display
- [ ] `recipe-instructions-list.tsx` - Numbered instructions display
- [ ] `recipe-metadata.tsx` - Recipe info (time, difficulty, servings)

#### 2.3 Recipe List Components
**Directory**: `src/features/recipes/components/lists/`

- [ ] `recipe-list.tsx` - Main recipe listing with pagination
- [ ] `recipe-search-bar.tsx` - Search input with filters
- [ ] `recipe-filters.tsx` - Cuisine, difficulty, tag filters
- [ ] `recipe-sort-options.tsx` - Sort by date, name, difficulty

#### 2.4 Loading States
**Directory**: `src/features/recipes/components/skeletons/`

- [ ] `recipe-form-skeleton.tsx` - Loading state for recipe forms
- [ ] `recipe-card-skeleton.tsx` - Loading state for recipe cards
- [ ] `recipe-detail-skeleton.tsx` - Loading state for recipe details
- [ ] `recipe-list-skeleton.tsx` - Loading state for recipe lists

### 3. Recipe Image Management (Days 3-4)

#### 3.1 Image Upload System
**File**: `src/features/recipes/server/image-actions.ts`

- [ ] `uploadRecipeImage(recipeId, file)` - Handle image uploads
- [ ] `deleteRecipeImage(imageId)` - Remove recipe image
- [ ] `updateImageMetadata(imageId, metadata)` - Update alt text, etc.
- [ ] `setHeroImage(recipeId, imageId)` - Designate main recipe image

#### 3.2 Image Display Components
**Directory**: `src/features/recipes/components/images/`

- [ ] `recipe-image-upload.tsx` - Drag-and-drop image upload
- [ ] `recipe-image-gallery.tsx` - Display multiple recipe images
- [ ] `recipe-hero-image.tsx` - Main recipe image display
- [ ] `image-optimization.tsx` - Responsive image component

#### 3.3 File Storage Setup
**Configuration**: Local file storage in `./uploads/recipes/`

- [ ] Configure Next.js static file serving
- [ ] Set up image optimization and resizing
- [ ] Implement file validation and security
- [ ] Create image thumbnail generation

### 4. Recipe Routes and Pages (Days 4-5)

#### 4.1 Recipe Management Pages
**Directory**: `src/app/(dashboard)/dashboard/recipes/`

- [ ] `page.tsx` - Recipe list/dashboard page
- [ ] `create/page.tsx` - New recipe creation page  
- [ ] `[id]/page.tsx` - Recipe detail view page
- [ ] `[id]/edit/page.tsx` - Recipe editing page

#### 4.2 Recipe API Routes (if needed)
**Directory**: `src/app/api/recipes/`

- [ ] `route.ts` - Recipe CRUD API endpoints
- [ ] `[id]/route.ts` - Single recipe operations
- [ ] `[id]/images/route.ts` - Recipe image operations

### 5. Recipe Validation and Types (Days 1-2)

#### 5.1 Validation Schemas
**File**: `src/features/recipes/lib/validations.ts`

- [ ] `RecipeFormSchema` - Main recipe validation
- [ ] `IngredientSchema` - Individual ingredient validation
- [ ] `InstructionSchema` - Instruction step validation  
- [ ] `ImageUploadSchema` - File upload validation

#### 5.2 TypeScript Types
**File**: `src/features/recipes/lib/types.ts`

- [ ] `RecipeWithComponents` - Recipe with ingredients/instructions
- [ ] `RecipeFormData` - Form submission types
- [ ] `RecipeFilters` - Search/filter types
- [ ] `ImageUploadData` - Image upload types

### 6. Recipe Testing (Days 5-6)

#### 6.1 Server Action Tests
**Directory**: `src/features/recipes/__tests__/`

- [ ] `recipe-actions.test.ts` - Test all CRUD operations
- [ ] `ingredient-actions.test.ts` - Test ingredient management
- [ ] `instruction-actions.test.ts` - Test instruction management
- [ ] `image-actions.test.ts` - Test image upload/management

#### 6.2 Component Tests
**Directory**: `src/features/recipes/components/__tests__/`

- [ ] `recipe-form.test.tsx` - Test recipe form interactions
- [ ] `recipe-list.test.tsx` - Test recipe listing
- [ ] `recipe-detail.test.tsx` - Test recipe display
- [ ] `image-upload.test.tsx` - Test image upload functionality

### 7. Database Optimizations (Days 6-7)

#### 7.1 Performance Indexes
- [ ] Add indexes for common recipe queries
- [ ] Optimize search performance with FTS (Full-Text Search)
- [ ] Add composite indexes for filter combinations

#### 7.2 Data Seeding
**File**: `src/db/seeds/recipes.ts`

- [ ] Create sample recipe data for development
- [ ] Add various recipe types and complexities
- [ ] Include sample images and metadata

---

## Acceptance Criteria

### ✅ Core Recipe Management Complete When:
- [ ] Users can create, edit, and delete recipes
- [ ] Recipe ingredients can be added/removed/reordered
- [ ] Recipe instructions can be added/removed/reordered  
- [ ] Recipe images can be uploaded and managed
- [ ] Recipe search and filtering works properly
- [ ] All components have loading states (skeletons)
- [ ] All server actions have proper error handling
- [ ] TypeScript types are complete and accurate

### 🧪 Testing Requirements
- [ ] All server actions have unit tests
- [ ] Key components have integration tests
- [ ] Image upload functionality is tested
- [ ] Recipe CRUD operations work end-to-end
- [ ] Error handling works for all failure cases
- [ ] Loading states display properly

### 📱 UI/UX Requirements
- [ ] Recipe forms are intuitive and user-friendly
- [ ] Recipe displays are visually appealing
- [ ] Search and filtering are responsive
- [ ] Image uploads provide clear feedback
- [ ] Mobile-responsive design works properly

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

**Days 5-6: Integration**
- Connect components to server actions
- Implement pages and routing
- Add comprehensive testing

**Days 7: Polish**
- Performance optimization
- Bug fixes and refinements
- Documentation updates

### Success Metrics
- ✅ All acceptance criteria met
- ✅ Test coverage >80% for core functionality
- ✅ No critical performance issues
- ✅ Clean, maintainable code structure

**Estimated Completion:** 5-7 days  
**Critical Path:** Server actions → UI components → Integration → Testing