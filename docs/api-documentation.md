# API Documentation

This document provides comprehensive API documentation for Tastebase's server actions, API routes, and authentication system.

## Overview

Tastebase uses Next.js Server Actions as the primary API interface, with minimal API routes for specific use cases like file uploads and webhooks. All server actions are type-safe with Zod validation and proper error handling.

## Authentication API

### Server Actions

#### `signUpAction(formData: FormData)`

**Purpose**: Register a new user with recipe preferences  
**File**: `src/lib/auth/auth-actions.ts`

**Input Parameters**:
```typescript
FormData {
  email: string         // User email address
  password: string      // User password (min 8 chars, uppercase, lowercase, number)
  name: string          // Full name (2-50 chars, letters and spaces only)
  preferredTemperatureUnit: TemperatureUnit          // Temperature preference
  preferredWeightUnit: MeasurementUnit               // Weight measurement preference  
  preferredVolumeUnit: MeasurementUnit               // Volume measurement preference
  recipeViewPreference: ViewMode                      // Recipe display preference
}
```

**Response**:
```typescript
// Success: redirects to "/"
// Error: 
{
  error: string  // Error message for display
}
```

**Example Usage**:
```typescript
const formData = new FormData();
formData.append("email", "user@example.com");
formData.append("password", "SecurePass123");
formData.append("name", "John Doe");
formData.append("preferredTemperatureUnit", TemperatureUnit.FAHRENHEIT);
formData.append("preferredWeightUnit", MeasurementUnit.IMPERIAL);
formData.append("preferredVolumeUnit", MeasurementUnit.IMPERIAL);
formData.append("recipeViewPreference", ViewMode.CARDS);

const result = await signUpAction(formData);
if (result?.error) {
  console.error("Sign up failed:", result.error);
}
```

#### `signInAction(formData: FormData)`

**Purpose**: Authenticate existing user  
**File**: `src/lib/auth/auth-actions.ts`

**Input Parameters**:
```typescript
FormData {
  email: string     // User email address
  password: string  // User password
}
```

**Response**:
```typescript
// Success: redirects to "/"
// Error:
{
  error: string  // Error message for display
}
```

#### `signOutAction()`

**Purpose**: Sign out current user and redirect to home  
**File**: `src/lib/auth/auth-actions.ts`

**Input Parameters**: None

**Response**: Redirects to "/"

#### `getCurrentUser()`

**Purpose**: Get current authenticated user with database data  
**File**: `src/lib/auth/auth-actions.ts`

**Response**:
```typescript
{
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: Date
}
```

**Authentication**: Redirects to sign-in if not authenticated

#### `requireAuth()`

**Purpose**: Validate authentication and return user  
**File**: `src/lib/auth/auth-actions.ts`

**Response**:
```typescript
{
  id: string
  email: string
  // ... other user fields
}
```

**Authentication**: Redirects to sign-in if not authenticated

#### `updateProfile(formData: FormData)`

**Purpose**: Update user profile information  
**File**: `src/lib/auth/auth-actions.ts`

**Input Parameters**:
```typescript
FormData {
  name: string  // Updated name (1-100 characters)
}
```

**Response**:
```typescript
// Success:
{
  success: true
  message: "Profile updated successfully"
  updatedName: string
}

// Error:
{
  error: string  // Validation or database error
}
```

#### `updatePassword(formData: FormData)`

**Purpose**: Change user password  
**File**: `src/lib/auth/auth-actions.ts`

**Input Parameters**:
```typescript
FormData {
  currentPassword: string  // Current password for verification
  newPassword: string      // New password (min 6 characters)
  confirmPassword: string  // Password confirmation
}
```

**Response**:
```typescript
// Success:
{
  success: true
  message: "Password updated successfully"
}

// Error:
{
  error: string  // Validation or authentication error
}
```

## Recipe Management API

### Server Actions (To be implemented in Phase 2)

The recipe management system will include the following server actions:

#### `createRecipe(formData: FormData)`

**Purpose**: Create new recipe with ingredients and instructions  
**File**: `src/lib/server-actions/actions.ts`

**Input Parameters** (Planned):
```typescript
FormData {
  title: string           // Recipe title
  description?: string    // Recipe description
  servings?: number       // Number of servings
  prepTimeMinutes?: number // Prep time in minutes
  cookTimeMinutes?: number // Cook time in minutes
  difficulty?: RecipeDifficulty
  cuisine?: string        // Cuisine type
  sourceUrl?: string      // Source URL
  sourceName?: string     // Source name
  ingredients: string     // JSON array of ingredients
  instructions: string   // JSON array of instructions
  tags?: string          // JSON array of tag names
}
```

#### `updateRecipe(recipeId: string, formData: FormData)`

**Purpose**: Update existing recipe  
**Authentication**: User must own the recipe

#### `deleteRecipe(recipeId: string)`

**Purpose**: Delete recipe (soft delete - archives recipe)  
**Authentication**: User must own the recipe

#### `getRecipe(recipeId: string)`

**Purpose**: Get recipe with ingredients, instructions, and images  
**Authentication**: User must own recipe or recipe must be public

#### `getUserRecipes(filters?: RecipeFilters)`

**Purpose**: Get user's recipes with optional filtering  
**Authentication**: Required

## File Upload API

### API Routes

#### `POST /api/upload/recipe-image`

**Purpose**: Upload recipe images with validation and processing  
**File**: `src/app/api/upload/recipe-image/route.ts`

**Request**:
```typescript
multipart/form-data {
  file: File        // Image file (JPEG, PNG, WebP)
  recipeId?: string // Optional recipe ID to associate image
  altText?: string  // Optional alt text for accessibility
}
```

**Response**:
```typescript
// Success:
{
  success: true
  image: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    altText?: string
    url: string        // Public URL to access image
  }
}

// Error:
{
  error: string
  code?: string  // Error code for client handling
}
```

**Validation**:
- File size: Max 10MB per image
- File types: JPEG, PNG, WebP only
- Image dimensions: Captured and stored
- Security: File type validation, filename sanitization

#### `GET /api/images/[filename]`

**Purpose**: Serve uploaded recipe images with optimization  
**File**: `src/app/api/images/[filename]/route.ts`

**Parameters**:
- `filename`: Image filename from database
- Query parameters:
  - `w`: Width for resizing (optional)
  - `h`: Height for resizing (optional)
  - `q`: Quality 1-100 (optional, default 75)

**Response**: Image file with appropriate headers

## Error Handling

### Standard Error Response Format

All server actions return errors in a consistent format:

```typescript
{
  error: string  // Human-readable error message
  code?: string  // Optional error code for programmatic handling
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permission for operation
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Unexpected server error

### Error Handling Best Practices

```typescript
// Client-side error handling
const result = await signUpAction(formData);
if (result?.error) {
  if (result.error.includes("already exists")) {
    // Handle duplicate email
  } else {
    // Handle general error
    toast.error(result.error);
  }
}
```

## Validation Schemas

### Authentication Schemas

```typescript
// Sign up validation
const signUpSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  preferredTemperatureUnit: z.enum(["fahrenheit", "celsius"]).default("fahrenheit"),
  preferredWeightUnit: z.enum(["imperial", "metric"]).default("imperial"),
  preferredVolumeUnit: z.enum(["imperial", "metric"]).default("imperial"),
  recipeViewPreference: z.enum(["card", "list", "grid"]).default("card"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## Rate Limiting

### Authentication Rate Limits

- **Login attempts**: 30 requests per minute per IP
- **Sign up**: 5 requests per minute per IP
- **Password reset**: 3 requests per minute per IP

### API Rate Limits

- **File uploads**: 10 uploads per minute per user
- **Recipe operations**: 100 requests per minute per user
- **General API**: 1000 requests per minute per user

## Security

### Authentication Security

- **Password hashing**: Bcrypt with appropriate salt rounds
- **Session management**: Secure session tokens with proper expiration
- **CSRF protection**: Built-in CSRF protection for all state-changing operations
- **Rate limiting**: Prevents brute force attacks

### File Upload Security

- **File type validation**: Server-side MIME type checking
- **File size limits**: Configurable limits prevent abuse
- **Filename sanitization**: Prevents path traversal attacks
- **Virus scanning**: Optional integration with antivirus APIs

### Data Security

- **Input validation**: All inputs validated with Zod schemas
- **SQL injection prevention**: Parameterized queries via Drizzle ORM
- **XSS prevention**: Automatic escaping in React components
- **Authorization checks**: User ownership verified for all operations

## Testing API Endpoints

### Testing Server Actions

```typescript
// Test server action directly
import { signUpAction } from "@/lib/auth/auth-actions";

const formData = new FormData();
formData.append("email", "test@example.com");
formData.append("password", "TestPass123");
formData.append("name", "Test User");

const result = await signUpAction(formData);
expect(result?.error).toBeUndefined();
```

### Testing API Routes

```typescript
// Test API route with supertest
import request from 'supertest';
import { app } from '@/app';

test('POST /api/upload/recipe-image', async () => {
  const response = await request(app)
    .post('/api/upload/recipe-image')
    .attach('file', 'test-image.jpg')
    .expect(200);
    
  expect(response.body.success).toBe(true);
  expect(response.body.image.filename).toBeDefined();
});
```

## Development Utilities

### Database Queries

```typescript
// Helper functions for common queries
import { db } from "@/db";
import { recipes, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Get user recipes
export async function getUserRecipes(userId: string, limit = 20) {
  return db.select()
    .from(recipes)
    .where(and(
      eq(recipes.userId, userId),
      eq(recipes.isArchived, false)
    ))
    .orderBy(desc(recipes.createdAt))
    .limit(limit);
}

// Get recipe with all relations
export async function getFullRecipe(recipeId: string) {
  return db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
    with: {
      ingredients: {
        orderBy: (ingredients, { asc }) => [asc(ingredients.sortOrder)],
      },
      instructions: {
        orderBy: (instructions, { asc }) => [asc(instructions.stepNumber)],
      },
      images: {
        orderBy: (images, { desc, asc }) => [desc(images.isHero), asc(images.sortOrder)],
      },
      tags: true,
      notes: true,
    },
  });
}
```

### Logging and Monitoring

```typescript
// Structured logging for API operations
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-api");

export async function createRecipe(formData: FormData) {
  const user = await requireAuth();
  
  logger.info({ userId: user.id }, "Creating new recipe");
  
  try {
    // Recipe creation logic
    logger.info({ userId: user.id, recipeId }, "Recipe created successfully");
    return { success: true, recipeId };
  } catch (error) {
    logError(logger, "Recipe creation failed", error, { userId: user.id });
    return { error: "Failed to create recipe" };
  }
}
```

## API Versioning and Evolution

### Current Version: v1 (Implicit)

The current API is version 1, though not explicitly versioned in URLs. Future versions will be handled through:

1. **Server Action Evolution**: New parameters with default values
2. **API Route Versioning**: `/api/v2/` prefixes for breaking changes
3. **Backward Compatibility**: Maintain v1 endpoints during transition periods

### Breaking Changes Policy

- **Major versions**: Breaking changes to request/response formats
- **Minor versions**: New optional parameters, additional response fields
- **Patch versions**: Bug fixes, security updates

### Migration Strategy

When introducing breaking changes:
1. Deploy new version alongside existing version
2. Update client applications gradually
3. Deprecate old version with clear timeline
4. Remove old version after migration period

---

This API documentation is automatically updated as new features are implemented. For the most current information, refer to the TypeScript definitions and Zod schemas in the codebase.