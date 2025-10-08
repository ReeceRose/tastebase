# Environment Variables Guide

Complete reference for all environment variables used in the Recipe App.

## Table of Contents

- [Overview](#overview)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Variable Categories](#variable-categories)
- [Environment Files](#environment-files)
- [Validation](#validation)
- [Examples](#examples)

## Overview

The Recipe App uses environment variables for configuration, ensuring sensitive data remains secure and settings can be customized per environment. Variables are validated using `@t3-oss/env-nextjs` for type safety.

## Required Variables

These variables are essential for basic functionality:

### Database
```bash
DATABASE_URL="file:./tastebase.db"
```
- **Purpose**: SQLite database file path
- **Format**: File path to SQLite database
- **Development**: `"file:./tastebase.db"`
- **Production**: `"file:/app/data/tastebase.db"` (for Docker)

### Authentication (BetterAuth)
```bash
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

**BETTER_AUTH_SECRET**:
- **Purpose**: Secret key for session encryption and JWT signing
- **Visibility**: Server-only
- **Requirements**: Minimum 32 characters, cryptographically secure
- **Example**: `"your-super-secret-key-at-least-32-chars-long"`

**BETTER_AUTH_URL**:
- **Purpose**: Base URL for authentication callbacks
- **Visibility**: Server-only
- **Development**: `"http://localhost:3000"`
- **Production**: `"https://yourdomain.com"`

### App Configuration
```bash
```
- **Purpose**: Base URL for the application
- **Visibility**: Public (exposed to browser)
- **Development**: `"http://localhost:3000"`
- **Production**: `"https://yourdomain.com"`

## Optional Variables

### AI Services (Required for AI Features)
```bash
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."
```

**OPENAI_API_KEY**:
- **Purpose**: OpenAI API key for recipe parsing and AI features
- **When needed**: If using OpenAI for AI recipe parsing
- **Example**: `"sk-proj-abc123def456ghi789..."`
- **Get from**: [OpenAI Platform](https://platform.openai.com/api-keys)

**ANTHROPIC_API_KEY**:
- **Purpose**: Anthropic API key for recipe parsing and AI features
- **When needed**: If using Anthropic Claude for AI recipe parsing
- **Example**: `"sk-ant-api03-abc123def456..."`
- **Get from**: [Anthropic Console](https://console.anthropic.com/)

**Note**: You only need one AI service key. The app will use whichever is provided.

### File Storage
```bash
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

**UPLOAD_DIR**:
- **Purpose**: Directory for storing recipe images
- **Default**: `"./uploads"`
- **Development**: `"./uploads"`
- **Production**: `"/app/uploads"` (for Docker)
- **Requirements**: Directory must exist and be writable

**MAX_FILE_SIZE**:
- **Purpose**: Maximum file size in bytes for recipe images
- **Default**: `"10485760"` (10MB)
- **Type**: String (number in bytes)
- **Example**: `"20971520"` for 20MB limit

### Development & Build
```bash
NODE_ENV="development"
SKIP_ENV_VALIDATION=true
```

**NODE_ENV**:
- **Purpose**: Node.js environment mode
- **Values**: `"development"`, `"production"`, `"test"`
- **Default**: `"development"`
- **Auto-set**: Automatically set by Next.js in most cases

**SKIP_ENV_VALIDATION**:
- **Purpose**: Skip environment variable validation during build
- **When needed**: Docker builds, CI/CD where not all vars available
- **Type**: Boolean
- **Default**: `false`
- **Warning**: Only use when necessary, validation helps catch configuration errors



## Variable Categories

### Public vs Private

**Public Variables** (prefixed with `NEXT_PUBLIC_`):
- Exposed to the browser
- Available in client-side code
- Should not contain sensitive data
- Examples: App URLs, public API endpoints

**Private Variables**:
- Server-side only
- Never exposed to the browser
- Used for sensitive data
- Examples: Database URLs, secret keys, AI API keys

### Environment-Specific

**Development (.env.local)**:
- Local development settings
- Uses localhost URLs
- SQLite database file
- AI API keys for testing

**Production (.env)**:
- Production domain URLs
- Production database paths
- Production AI API keys
- Security hardening

## Environment Files

### File Priority (Next.js standard)
1. `.env.local` - Local overrides (ignored by git)
2. `.env.development` - Development defaults
3. `.env.production` - Production defaults
4. `.env` - Global defaults

### File Examples

**.env.example** - Template for new setups:
```bash
# Copy to .env.local and fill in values
DATABASE_URL="file:./tastebase.db"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# AI Services (choose one)
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# File Storage (optional)
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

**.env.local** - Local development:
```bash
# Development settings
DATABASE_URL="file:./tastebase.db"
BETTER_AUTH_SECRET="dev-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-your-dev-key-here"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
```

**.env.production** - Production settings:
```bash
# Production settings
DATABASE_URL="file:/app/data/recipes.db"
BETTER_AUTH_SECRET="production-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="https://yourdomain.com"
OPENAI_API_KEY="sk-proj-your-production-key-here"
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE="20971520"
```

## Validation

Environment variables are validated using `@t3-oss/env-nextjs` in `src/lib/env.ts`:

### Validation Features
- **Type Safety**: TypeScript types for all variables
- **Required/Optional**: Enforce required variables
- **Format Validation**: URL, email, number validation
- **Build-Time Checks**: Fail fast on missing variables
- **Runtime Access**: Type-safe variable access

### Validation Example
```typescript
// src/lib/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    UPLOAD_DIR: z.string().default("./uploads"),
    MAX_FILE_SIZE: z.string().default("10485760"),
  },
  client: {
  },
  runtimeEnv: process.env,
});
```

## Examples

### Minimal Setup (Basic Recipe Management)
```bash
# Required only
DATABASE_URL="file:./tastebase.db"
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
```

### Full Feature Setup (With AI Parsing)
```bash
# Database
DATABASE_URL="file:./tastebase.db"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# App

# AI Services (choose one)
OPENAI_API_KEY="sk-proj-abc123def456ghi789..."
# OR
ANTHROPIC_API_KEY="sk-ant-api03-abc123def456..."

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Development
NODE_ENV="development"
```

### Production Checklist

Before deploying to production:

- [ ] All required variables are set
- [ ] AI API keys are production keys (not test keys)
- [ ] Database path points to production location
- [ ] App URL matches production domain
- [ ] BetterAuth URL matches production domain
- [ ] Upload directory is writable and has sufficient space
- [ ] Environment validation passes (`pnpm run build`)
- [ ] Secret keys are cryptographically secure (32+ characters)

## Troubleshooting

### Common Issues

**Build fails with "Invalid environment variables"**:
- Check `src/lib/env.ts` for validation rules
- Ensure all required variables are set
- Verify variable formats (URLs, email addresses)

**Variables not loading in application**:
- Restart development server after changes
- Check file naming (`.env.local` not `.env.development.local`)
- Verify no spaces around `=` in variable definitions

**AI parsing not working**:
- Verify AI API key is valid and has sufficient credits
- Check that either OpenAI or Anthropic key is provided (not both)
- Ensure API key has proper permissions for the AI service

**File uploads failing**:
- Verify upload directory exists and is writable
- Check file size is within MAX_FILE_SIZE limit
- Ensure upload directory path is correct for your environment

**Database connection issues**:
- Verify DATABASE_URL points to correct SQLite file
- Ensure database file directory is writable
- Check file permissions on database file

**Authentication not working**:
- Verify BETTER_AUTH_SECRET is at least 32 characters
- Check that BETTER_AUTH_URL matches your app URL
- Ensure no trailing slashes in URLs

For more troubleshooting, see [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md).