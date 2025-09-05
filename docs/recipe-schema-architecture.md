# Recipe Database Schema Architecture

This document outlines the comprehensive database schema design for Tastebase's recipe management system.

## Schema Overview

The recipe schema is modular and relationship-driven, designed to handle complex recipe data while maintaining flexibility and performance. The schema is located in `src/db/schema.recipes.ts` and integrates with the base authentication schema.

## Core Tables

### 1. Recipes (`recipes`)

**Purpose**: Main recipe information and metadata  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  servings INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine TEXT,
  source_url TEXT,
  source_name TEXT,
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
```

**Key Features**:
- User ownership with cascade deletion
- Flexible timing (prep + cook time)
- Difficulty classification
- Source attribution support
- Public/private visibility control
- Soft deletion via archiving

### 2. Recipe Ingredients (`recipe_ingredients`)

**Purpose**: Structured ingredient data with quantities and organization  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT, -- Supports fractions like "1/2", "1 1/4"
  unit TEXT,
  notes TEXT,
  group_name TEXT, -- For sections like "For the sauce"
  sort_order INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE NOT NULL
);
```

**Key Features**:
- Flexible amount storage (supports fractions, ranges)
- Ingredient grouping for complex recipes
- Optional ingredient marking
- Manual sorting control

### 3. Recipe Instructions (`recipe_instructions`)

**Purpose**: Step-by-step cooking instructions with timing and temperature data  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipe_instructions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  time_minutes INTEGER, -- Optional timing for this step
  temperature TEXT, -- e.g., "350°F", "medium heat"
  notes TEXT,
  group_name TEXT -- For instruction sections
);
```

**Key Features**:
- Sequential step numbering
- Per-step timing information
- Temperature guidance
- Instruction grouping for complex recipes

### 4. Recipe Tags (`recipe_tags`)

**Purpose**: Categorization and tagging system for recipes  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipe_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT, -- Hex color for UI display
  category TEXT, -- e.g., "cuisine", "diet", "course"
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
```

**Key Features**:
- Global tag system (shared across users)
- Visual customization with colors
- Categorized tags for better organization
- Unique constraint prevents duplicates

### 5. Recipe Tag Relations (`recipe_tag_relations`)

**Purpose**: Many-to-many relationship between recipes and tags  
**Composite Primary Key**: `recipe_id`, `tag_id`

```sql
CREATE TABLE recipe_tag_relations (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES recipe_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);
```

**Key Features**:
- Composite primary key prevents duplicate relationships
- Cascade deletion maintains referential integrity

### 6. Recipe Images (`recipe_images`)

**Purpose**: Image metadata and file management for recipe photos  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipe_images (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  is_hero BOOLEAN DEFAULT FALSE NOT NULL,
  sort_order INTEGER NOT NULL,
  uploaded_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
```

**Key Features**:
- Complete file metadata tracking
- Hero image designation
- Accessibility support with alt text
- Image dimension storage
- Upload timestamp tracking

### 7. Recipe Notes (`recipe_notes`)

**Purpose**: User-specific notes and ratings for recipes  
**Primary Key**: `id` (text)

```sql
CREATE TABLE recipe_notes (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER, -- 1-5 stars
  is_private BOOLEAN DEFAULT TRUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
```

**Key Features**:
- User-specific notes (multiple users can note same recipe)
- Star rating system
- Privacy controls
- Modification tracking

## Relationships and Data Flow

### Recipe Ownership
```
users (1) ←→ (N) recipes
```
- Each recipe belongs to one user
- Users can have multiple recipes
- Cascade deletion: removing user deletes their recipes

### Recipe Components
```
recipes (1) ←→ (N) recipe_ingredients
recipes (1) ←→ (N) recipe_instructions  
recipes (1) ←→ (N) recipe_images
```
- Each recipe can have multiple ingredients, instructions, and images
- Components are deleted when recipe is deleted

### Tagging System
```
recipes (N) ←→ (N) recipe_tags (via recipe_tag_relations)
```
- Many-to-many relationship through junction table
- Recipes can have multiple tags
- Tags can be applied to multiple recipes

### User Notes
```
users (N) ←→ (N) recipes (via recipe_notes)
```
- Many-to-many relationship allowing multiple users to note same recipe
- Useful for shared recipe collections

## Indexing Strategy

### Performance Indexes
```sql
-- Recipe lookups
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_title ON recipes(title);

-- Component lookups
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX idx_recipe_images_recipe_id ON recipe_images(recipe_id);

-- Tag relationships
CREATE INDEX idx_recipe_tag_relations_recipe_id ON recipe_tag_relations(recipe_id);
CREATE INDEX idx_recipe_tag_relations_tag_id ON recipe_tag_relations(tag_id);

-- Search optimization
CREATE INDEX idx_recipe_tags_name ON recipe_tags(name);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
```

## Data Types and Constraints

### Text Storage
- **IDs**: UUIDs stored as TEXT for uniqueness
- **Amounts**: TEXT to support fractions ("1/2", "1 1/4") 
- **Temperatures**: TEXT for flexibility ("350°F", "medium heat")

### Integer Storage
- **Timestamps**: Unix timestamps for consistency
- **Durations**: Minutes for easy calculation
- **Ratings**: 1-5 scale with NULL for unrated

### Boolean Storage
- SQLite integer mode with DEFAULT constraints
- Explicit NOT NULL for required flags

## Schema Evolution

### Migration Strategy
1. **Additive Changes**: New columns with DEFAULT values
2. **Data Transformations**: Multi-step migrations with data preservation
3. **Breaking Changes**: Version-controlled with rollback procedures

### Future Extensions
- **Nutrition Data**: Additional table for nutritional information
- **Recipe Collections**: User-defined recipe groupings
- **Cooking History**: Track when/how often recipes are made
- **Recipe Scaling**: Store scaling calculations and conversions
- **Recipe Sharing**: Enhanced sharing and collaboration features

## TypeScript Integration

### Generated Types
The schema automatically generates TypeScript types:

```typescript
export type Recipe = typeof recipes.$inferSelect;
export type RecipeInsert = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredients.$inferInsert;
// ... additional types for all tables
```

### Usage in Application
```typescript
import type { Recipe, RecipeIngredient } from "@/db/schema";

// Type-safe database operations
const recipe: Recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId));
const ingredients: RecipeIngredient[] = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
```

## Best Practices

### Data Integrity
- Always use transactions for multi-table operations
- Validate foreign keys before insertion
- Use appropriate constraints and defaults

### Performance
- Use indexes for common query patterns
- Limit result sets with pagination
- Consider denormalization for read-heavy operations

### Security
- Validate user ownership before mutations
- Sanitize user input for search queries
- Use parameterized queries to prevent injection

## Development Workflows

### Adding New Recipe Data
1. Update schema in `src/db/schema.recipes.ts`
2. Generate migration: `pnpm run db:generate`
3. Review generated SQL
4. Apply migration: `pnpm run db:migrate`
5. Update TypeScript types and queries

### Schema Testing
```bash
# Check schema integrity
pnpm run db:studio

# Validate relationships
pnpm run health-check:architecture

# Test migrations
pnpm run db:generate --dry-run
```

This architecture provides a solid foundation for recipe management while maintaining flexibility for future enhancements and scaling.