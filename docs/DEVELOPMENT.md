# Development Guide

This guide covers development workflows, best practices, and advanced topics for contributing to Tastebase.

## Development Environment

### Prerequisites
- **Node.js**: 18.17+ or 20.5+
- **pnpm**: Package manager (preferred over npm)
- **Docker**: For local deployment testing
- **VSCode**: Recommended editor with extensions

### Recommended VSCode Extensions
- **Better Comments**: Enhanced comment highlighting
- **Biome**: Linting and formatting (replaces ESLint/Prettier)  
- **Tailwind CSS IntelliSense**: CSS class suggestions
- **TypeScript Importer**: Auto-import TypeScript modules
- **Path Intellisense**: File path autocompletion

### Initial Setup
```bash
git clone <repository-url> tastebase
cd tastebase
pnpm install
cp .env.example .env.local
# Edit .env.local with your configuration
pnpm run db:migrate
pnpm run dev
```

## Project Architecture

### Tech Stack Overview
- **Framework**: Next.js 15.5+ with App Router
- **Authentication**: BetterAuth (email/password)
- **Database**: Local SQLite with better-sqlite3
- **ORM**: Drizzle ORM with type-safe queries
- **UI**: Tailwind CSS + ShadCN/UI components
- **Testing**: Vitest + Testing Library
- **Linting**: Biome (replaces ESLint + Prettier)
- **Type Checking**: TypeScript with strict mode

### Component-Based Architecture

Tastebase follows a component-based architecture where components are organized by purpose:

```
src/components/
├── ui/                 # ShadCN base UI components
├── layout/             # Dashboard layout components  
├── auth/               # Authentication components
├── forms/              # All form components
├── lists/              # List and table components
├── cards/              # Card components
├── modals/             # Modal and dialog components
├── skeletons/          # Loading state components
└── navigation/         # Navigation components

src/lib/
├── auth/               # Authentication logic
├── server-actions/     # Server Actions for CRUD operations
├── types/              # TypeScript type definitions
├── validations/        # Zod schemas
└── utils/              # Helper functions and utilities
```

**Benefits**:
- Components organized by UI purpose, not business domain
- Easier to find and reuse components
- Clear separation between UI and business logic
- More maintainable and scalable architecture

### Database Schema Organization

```
src/db/
├── schema.base.ts      # Authentication tables (BetterAuth)
├── schema.recipes.ts   # Recipe-specific tables
├── schema.ts          # Main schema export
├── index.ts           # Database connection
├── migrate.ts         # Migration runner
└── migrations/        # Auto-generated migration files
```

## Development Workflows

### Starting a New Feature

1. **Plan the Feature**
   - Review existing phase documentation
   - Create feature specification document
   - Define database schema changes if needed

2. **Create Component Structure**
   ```bash
   mkdir -p src/components/{forms,lists,cards,skeletons}
   mkdir -p src/lib/{server-actions,types,validations}
   ```

3. **Database Schema (if needed)**
   ```bash
   # Create schema file
   touch src/db/schema.<feature>.ts
   
   # Add to main schema
   echo "export * from './schema.<feature>';" >> src/db/schema.ts
   
   # Generate migration
   pnpm run db:generate
   
   # Run migration
   pnpm run db:migrate
   ```

## AI Integration Status

### ✅ Phase 3: Core AI Integration - COMPLETED
**Context**: `docs/context/phase-3-ai-progress-2025-09-12-1720.md`

Phase 3 is **100% complete** with production-ready features:
- **Smart URL Detection**: JSON-LD → HTML → AI fallback parsing
- **Advanced UI Components**: Tab interface with progress indicators  
- **Multi-Provider Support**: OpenAI, Anthropic, Google, Ollama
- **OCR Foundation**: Tesseract service with Sharp preprocessing

### 📋 Phase 3.5: Dual Image Processing - READY (3-4 hours)

**Strategic Enhancement**: Support both AI Vision and Local OCR with user toggle.

**Remaining Tasks**:
1. **AI Vision Service** (~1 hour) - GPT-4V, Claude Vision integration
2. **Smart Image Processor** (~1 hour) - User preference routing  
3. **Image Upload Component** (~2 hours) - Drag-drop with dual method support
4. **Settings Integration** (~30 min) - Add processing method toggle

**Resume Commands**:
```bash
# Check Phase 3 completion status
ls src/lib/ai/tools/fetch-recipe-tool.ts  # Should exist
ls src/components/forms/recipe-url-input.tsx  # Should exist  
ls src/lib/ai/services/ocr-service.ts  # Should exist

# Test existing URL parsing
pnpm run dev  # Test at /recipes/new with URL tab

# Start Phase 3.5 implementation
# Next: Create src/lib/ai/services/ai-vision-service.ts
```

4. **Implement Server Actions First**
   - Define TypeScript types
   - Create Zod validation schemas
   - Implement server actions with error handling
   - Write unit tests for server actions

5. **Build UI Components**
   - Create skeleton components first in `src/components/skeletons/`
   - Build form components in `src/components/forms/`
   - Build list components in `src/components/lists/`
   - Create card components in `src/components/cards/`
   - Add comprehensive error states

6. **Integration and Testing**
   - Connect components to server actions
   - Add integration tests
   - Test all user flows
   - Validate mobile responsiveness

### Code Style and Standards

#### TypeScript Best Practices

**Always use path aliases:**
```typescript
// ✅ Good
import { auth } from "@/lib/auth/auth;
import { Button } from "@/components/ui/button";

// ❌ Bad  
import { auth } from "../../lib/auth";
import { Button } from "../../../components/ui/button";
```

**Use proper typing:**
```typescript
// ✅ Good
export type Recipe = typeof recipes.$inferSelect;
export type RecipeInsert = typeof recipes.$inferInsert;

// ❌ Bad
export type Recipe = any;
```

**Server Actions pattern:**
```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/authactions";

const CreateRecipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export async function createRecipe(formData: FormData) {
  const user = await requireAuth();
  
  const result = CreateRecipeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  
  if (!result.success) {
    return { error: "Invalid input data" };
  }
  
  try {
    const recipe = await db.insert(recipes).values({
      id: crypto.randomUUID(),
      userId: user.id,
      ...result.data,
    });
    
    redirect(`/recipes/${recipe.id}`);
  } catch (error) {
    console.error("Recipe creation error:", error);
    return { error: "Failed to create recipe" };
  }
}
```

#### Component Best Practices

**Always create skeleton components:**
```typescript
// Recipe component
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Suspense fallback={<RecipeCardSkeleton />}>
      {/* Recipe content */}
    </Suspense>
  );
}

// Corresponding skeleton
export function RecipeCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-48 w-full" />
      <CardContent>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}
```

**Use ShadCN components consistently:**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Always use ShadCN components for consistency
```

### Database Development

#### Working with Drizzle ORM

**Schema Definition:**
```typescript
export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
}));
```

**Type-safe Queries:**
```typescript
import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Simple query
const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId));

// Query with relations
const recipeWithIngredients = await db.query.recipes.findFirst({
  where: eq(recipes.id, recipeId),
  with: {
    ingredients: true,
  },
});

// Complex query
const userRecipes = await db.select().from(recipes)
  .where(and(
    eq(recipes.userId, userId),
    eq(recipes.isArchived, false)
  ))
  .orderBy(desc(recipes.createdAt))
  .limit(20);
```

#### Migration Best Practices

**Always review generated migrations:**
```bash
pnpm run db:generate
# Review the SQL in migrations/ directory
pnpm run db:migrate
```

**Test migrations with data:**
```bash
# Backup database
cp tastebase.db tastebase.db.backup

# Apply migration
pnpm run db:migrate

# Test application functionality
# If issues, restore backup
# cp tastebase.db.backup tastebase.db
```

### Testing Strategy

#### Unit Testing Server Actions
```typescript
// __tests__/recipe-actions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createRecipe } from '../server/actions';

describe('Recipe Actions', () => {
  beforeEach(async () => {
    // Setup test database
  });

  it('should create recipe with valid data', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Recipe');
    
    const result = await createRecipe(formData);
    
    expect(result.error).toBeUndefined();
    // Assert recipe was created
  });
});
```

#### Component Testing
```typescript
// __tests__/recipe-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeForm } from '@/components/forms/recipe-form';

describe('RecipeForm', () => {
  it('should validate required fields', async () => {
    render(<RecipeForm />);
    
    fireEvent.click(screen.getByText('Save Recipe'));
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });
});
```

### Quality Assurance

#### Running Quality Checks
```bash
# Run all health checks
pnpm run health-check

# Quick critical checks
pnpm run health-check:quick

# Specific checks
pnpm run lint                  # Code style
pnpm run type-check           # TypeScript
pnmp run test                 # Unit tests
pnpm run unused-code          # Dead code detection
pnpm run architecture         # Architecture validation
```

#### Pre-commit Hooks
The project includes Husky pre-commit hooks that run:
- Biome linting and formatting
- TypeScript type checking
- Staged file validation

#### Continuous Integration
GitHub Actions workflow runs:
- All health checks in parallel
- Test coverage reporting
- Build validation
- Architecture compliance

### Performance Optimization

#### Database Performance
```typescript
// Use indexes for common queries
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

// Paginate large result sets
const recipes = await db.select().from(recipes)
  .limit(20)
  .offset(page * 20);

// Use transactions for multi-table operations
await db.transaction(async (tx) => {
  const recipe = await tx.insert(recipes).values(recipeData);
  await tx.insert(recipeIngredients).values(ingredientsData);
});
```

#### UI Performance
```typescript
// Use React.memo for expensive components
const RecipeCard = React.memo(({ recipe }: { recipe: Recipe }) => {
  return <Card>{/* Recipe content */}</Card>;
});

// Use useMemo for expensive calculations
const sortedRecipes = useMemo(() => {
  return recipes.sort((a, b) => b.createdAt - a.createdAt);
}, [recipes]);

// Implement virtual scrolling for large lists
import { FixedSizeList } from 'react-window';
```

## Debugging and Development Tools

### Database Debugging
```bash
# Open database browser
pnpm run db:studio

# Inspect database structure
sqlite3 tastebase.db ".schema"

# Query data directly
sqlite3 tastebase.db "SELECT * FROM recipes LIMIT 5;"
```

### Application Debugging
```typescript
// Use structured logging
import { createOperationLogger } from "@/lib/logging/logger";
const logger = createOperationLogger("recipe-creation");

logger.info({ userId, recipeId }, "Creating recipe");
logger.error({ error: error.message }, "Recipe creation failed");
```

### Performance Monitoring
```bash
# Bundle analysis
pnpm run build && pnpm run analyze

# Performance profiling
pnpm run performance:verbose

# Check for performance bottlenecks
pnpm run performance:blocking
```

## Deployment

### Local Docker Development
```bash
# Build and run locally
docker-compose up -d

# View logs  
docker-compose logs -f tastebase

# Rebuild after changes
docker-compose build --no-cache tastebase
```

### Production Deployment
```bash
# Build production image
docker build -t tastebase:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  -v tastebase-data:/app/data \
  -e NODE_ENV=production \
  tastebase:latest
```

## Contributing Guidelines

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature following architecture patterns
3. Write comprehensive tests
4. Update documentation
5. Ensure all health checks pass
6. Submit PR with clear description

### Code Review Checklist
- [ ] Follows component-based architecture
- [ ] Components organized by purpose (forms/, lists/, cards/, etc.)
- [ ] Includes proper TypeScript types
- [ ] Has comprehensive error handling
- [ ] Includes loading states (skeletons)
- [ ] Has unit and integration tests
- [ ] Documentation updated
- [ ] Health checks pass

### Release Process
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Build and publish Docker image
5. Update documentation

## Troubleshooting Development Issues

### Common Development Problems

**Better-SQLite3 compilation issues:**
```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
pnpm run build-release
```

**TypeScript path resolution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server in VSCode
# Command Palette > "TypeScript: Restart TS Server"
```

**Database schema sync issues:**
```bash
# Reset database and rerun migrations  
rm tastebase.db
pnpm run db:migrate
```

### Getting Help

1. Check existing documentation in `/docs/`
2. Run health checks: `pnpm run health-check:verbose`
3. Review application logs in console
4. Check GitHub Issues for similar problems
5. Use GitHub Discussions for questions

---

Happy coding! 🚀