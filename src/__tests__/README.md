# Testing Guide

This directory contains the testing infrastructure and examples for the Tastebase project.

## Overview

The testing setup uses **Vitest** as the test runner with comprehensive mocking for external services and a flexible database testing approach.

## Key Features

- ✅ **Vitest** with React Testing Library
- ✅ **Component testing** for UI components
- ✅ **Unit testing** for utilities and business logic
- ✅ **Integration testing** for complex workflows
- ✅ **Database testing** with SQLite fallback to mocks
- ✅ **MSW** for API mocking
- ✅ **Coverage reporting** with v8
- ✅ **Watch mode** for development

## Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup and mocks
├── examples/                   # Example test patterns
│   └── integration-example.test.ts
└── README.md                  # This file

src/components/ui/__tests__/     # Component tests
src/lib/__tests__/              # Utility function tests
src/components organized by purpose/__tests__/ # Feature component tests
```

## Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm run test src/components/ui/__tests__/button.test.tsx
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Server Action Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupTestDb, cleanupTestDb } from '@/db/test'
import { myServerAction } from '../actions'

describe('Server Actions', () => {
  let testDb: any
  let testSqlite: any

  beforeEach(async () => {
    const setup = await setupTestDb()
    testDb = setup.db
    testSqlite = setup.sqlite
  })

  afterEach(() => {
    if (testSqlite) {
      cleanupTestDb(testSqlite)
    }
  })

  it('should create resource successfully', async () => {
    const result = await myServerAction({ name: 'Test' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Test')
  })
})
```

### Integration Tests

See `src/__tests__/examples/integration-example.test.ts` for comprehensive examples of testing complex workflows.

## Database Testing

The testing setup provides two approaches for database testing:

### 1. SQLite In-Memory Database (Preferred)
When `better-sqlite3` is available, tests use a fast in-memory SQLite database:
- Full SQL compatibility for complex queries
- Real database constraints and relationships
- Isolated per test

### 2. Mock Database (Fallback)
When SQLite is not available, tests fall back to mocked database operations:
- Simulated CRUD operations
- Suitable for unit tests that don't require complex queries
- Faster setup but limited functionality

## Available Mocks

The testing setup includes comprehensive mocks for:

### Next.js
g
- Router hooks (`useRouter`, `usePathname`, etc.)
- Server components (`headers`, `cookies`)

## Global Test Utilities

Available via `global.testUtils`:

```typescript
// Create mock user
const user = global.testUtils.mockUser({
  subscriptionPlan: 'pro',
  isAdmin: true
})

// Create mock organization
const org = global.testUtils.mockOrganization({
  memberLimit: 10,
  subscriptionStatus: 'active'
})

// Wait for async operations
await global.testUtils.waitFor(100)
```

## Configuration

### Vitest Config (`vitest.config.ts`)
- React plugin for JSX support
- jsdom environment for DOM testing
- Path aliases (`@/` → `src/`)
- Coverage with v8 provider
- Mock environment variables

### Test Setup (`setup.ts`)
- Global mocks for external services
- MSW server for API mocking
- Custom test utilities
- Cleanup after each test

## Best Practices

1. **Use descriptive test names** that explain the expected behavior
2. **Group related tests** using nested `describe` blocks
3. **Mock external dependencies** to ensure test isolation
4. **Test both success and error scenarios**
5. **Use proper cleanup** to avoid test interference
6. **Prefer integration tests** for complex user workflows
7. **Use unit tests** for individual functions and components

## Troubleshooting

### SQLite Issues
If you encounter SQLite binding issues:
```bash
pnpm rebuild better-sqlite3
# or
pnpm remove better-sqlite3 && pnpm add -D better-sqlite3
```

The tests will automatically fall back to mock database operations if SQLite is unavailable.

### Mock Issues
If mocks aren't working correctly:
1. Check that mocks are defined before imports
2. Use `vi.clearAllMocks()` in `beforeEach`
3. Verify mock paths match the actual import paths

### Coverage Issues
To exclude files from coverage, update the `coverage.exclude` array in `vitest.config.ts`.

## Examples

See the following files for testing examples:
- Component: `src/components/ui/__tests__/button.test.tsx`
- Utilities: `src/lib/__tests__/utils.test.ts`
- Integration: `src/__tests__/examples/integration-example.test.ts`