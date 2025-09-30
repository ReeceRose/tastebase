# Server Logging Guide

This guide covers the structured logging system used in Tastebase, built on pino for high-performance, structured logging.

## Overview

The logging system provides:
- **Structured logging** with consistent JSON output
- **Context-aware loggers** for different operation types
- **Unified error handling** with proper serialization
- **Performance optimized** using pino's fast JSON logger
- **Development-friendly** with pretty-print formatting

## Logger Types

### 1. Operation Logger
For general operations and API endpoints:

```typescript
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("operation-name");
logger.info({ key: "value" }, "Operation completed successfully");
```

### 2. User Logger
For user-specific operations:

```typescript
import { createUserLogger } from "@/lib/logging/logger";

const logger = createUserLogger(userId);
logger.info({ action: "profile_update" }, "User updated profile");
```

### 3. Organization Logger
For organization-specific operations:

```typescript
import { createOrganizationLogger } from "@/lib/logging/logger";

const logger = createOrganizationLogger(organizationId);
logger.info({ memberCount: 5 }, "Organization settings updated");
```

## Error Logging

Use the `logError` utility for consistent error handling:

```typescript
import { logError, createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("file-upload");

try {
  await processFile();
} catch (error) {
  logError(logger, "Failed to process file", error, { 
    fileId: "abc123",
    userId: user.id 
  });
}
```

## Common Patterns

### API Route Logging

```typescript
// src/app/api/uploads/route.ts
import { createUserLogger, createOperationLogger, logError } from "@/lib/logging/logger";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const logger = user ? createUserLogger(user.id) : createOperationLogger("file-upload");
  
  try {
    logger.info({ contentType: request.headers.get("content-type") }, "Processing file upload");
    // ... upload logic
    logger.info({ fileId: result.id, size: result.size }, "File uploaded successfully");
  } catch (error) {
    logError(logger, "Upload failed", error, { userId: user?.id });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

### Server Action Logging

```typescript
// src/lib/server-actions/actions.ts
import { createUserLogger, logError } from "@/lib/logging/logger";

export async function updateUserProfile(data: ProfileFormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  
  const logger = createUserLogger(user.id);
  
  try {
    logger.info({ fields: Object.keys(data) }, "Updating user profile");
    
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, user.id));
    
    logger.info("Profile updated successfully");
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to update profile", error, { 
      userId: user.id,
      fields: Object.keys(data)
    });
    throw error;
  }
}
```

### Middleware Logging

```typescript
// src/middleware/admin-auth.ts
import { createUserLogger, logError } from "@/lib/logging/logger";

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  
  const logger = createUserLogger(user.id);
  
  try {
    const isAdmin = await checkAdminStatus(user.id);
    
    if (isAdmin) {
      logger.info({ action: "admin_access_granted" }, "Admin access verified");
    } else {
      logger.warn({ action: "admin_access_denied" }, "Non-admin user attempted admin access");
    }
    
    return isAdmin;
  } catch (error) {
    logError(logger, "Error checking admin status", error, { userId: user.id });
    return false;
  }
}
```

## Best Practices

### 1. Pino Parameter Order
Always use `logger.method(object, message)` format:

```typescript
// ✅ Correct - object first, message second
logger.info({ userId: "123", action: "login" }, "User logged in");

// ❌ Incorrect - message first
logger.info("User logged in", { userId: "123", action: "login" });
```

### 2. Rich Context
Provide meaningful context objects:

```typescript
// ✅ Good context
logger.info({
  organizationId: org.id,
  memberCount: members.length,
  plan: org.plan,
  action: "member_limit_check"
}, "Member limit validation completed");

// ❌ Poor context
logger.info("Validation done");
```

### 3. Consistent Operation Names
Use descriptive, kebab-case operation names:

```typescript
// ✅ Good operation names
createOperationLogger("stripe-webhook-processing");
createOperationLogger("file-upload-validation");
createOperationLogger("organization-member-sync");

// ❌ Poor operation names
createOperationLogger("webhook");
createOperationLogger("upload");
createOperationLogger("sync");
```

### 4. Error Context Preservation
Include relevant context in error logging:

```typescript
try {
  await processPayment(amount, customerId);
} catch (error) {
  logError(logger, "Payment processing failed", error, {
    amount,
    customerId,
    timestamp: new Date().toISOString(),
    attemptCount: retryCount + 1
  });
}
```

### 5. User vs Anonymous Logging
Handle authenticated and anonymous users appropriately:

```typescript
const user = await currentUser();
const logger = user 
  ? createUserLogger(user.id) 
  : createOperationLogger("anonymous-operation");

// Always include user context when available
logger.info({ 
  authenticated: !!user,
  ...(user && { userId: user.id })
}, "Processing request");
```

## Client vs Server Logging

### Server-Side (Use Pino)
- API routes
- Server actions
- Middleware
- Webhook handlers
- Database operations
- CLI tools (for errors only)

```typescript
import { createOperationLogger } from "@/lib/logging/logger";
const logger = createOperationLogger("server-operation");
logger.info({ data }, "Server operation completed");
```

### Client-Side (Keep Console)
- React components
- Client utilities
- Development debugging
- User-facing error boundaries

```typescript
// Client components - keep console for development
console.log("Component mounted:", componentName);
console.error("Client error:", error);
```

## Performance Considerations

- Pino is optimized for performance with minimal overhead
- Context objects are efficiently serialized to JSON
- Structured logging enables better log analysis and monitoring
- Development mode includes pretty-printing for readability

## Integration with Monitoring

The structured format enables integration with:
- **Log aggregation** (ELK stack, Splunk)
- **Application monitoring** (DataDog, New Relic)
- **Error tracking** (Sentry integration)
- **Metrics extraction** from log data

## Migration from Console

When replacing console statements:

```typescript
// Before
console.log("User updated:", userId);
console.error("Update failed:", error);

// After
const logger = createUserLogger(userId);
logger.info({ userId }, "User profile updated");
logError(logger, "Profile update failed", error, { userId });
```