# Troubleshooting Guide

This document contains solutions to common issues encountered during development and deployment.

## Database Issues

### Better-SQLite3 Native Binding Issues

**Problem**: When using `better-sqlite3`, you may encounter errors like:
```
Error: Could not locate the bindings file
```
or compilation failures during installation.

**Solution**: Manually build the better-sqlite3 native bindings:

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
pnpm run build-release
```

This compiles the native SQLite bindings for your specific system architecture.

**Why this happens**: The better-sqlite3 package requires native compilation for optimal performance. Sometimes the automatic build process fails during installation, requiring manual intervention.

**Alternative solutions**:
1. Try `pnpm rebuild better-sqlite3`
2. Delete `node_modules` and `pnpm-lock.yaml`, then reinstall
3. If issues persist, use the manual build command above

### SQLite Database File Permissions

**Problem**: Database operations fail with permission errors.

**Solution**: Ensure the application has read/write permissions to the database file and directory:

```bash
chmod 664 tastebase.db
chmod 755 ./
```

### Database Migration Issues

**Problem**: Migrations fail or database schema is out of sync.

**Solution**: 
1. Stop the development server
2. Delete the database file: `rm tastebase.db`
3. Run migrations: `pnpm run db:migrate`
4. Restart the server: `pnpm run dev`

## Development Server Issues

### Port Already in Use

**Problem**: Development server shows "Port 3000 is in use".

**Solution**: The server will automatically use the next available port (3001, 3002, etc.). Check the console output for the actual URL.

### Node.js Version Compatibility

**Problem**: Build or runtime errors related to Node.js features.

**Solution**: Ensure you're using Node.js 18.17+ or 20.5+:

```bash
node --version
```

Update Node.js if needed using your preferred method (nvm, Homebrew, etc.).

## Authentication Issues

### BetterAuth Configuration

**Problem**: Authentication redirects or sessions not working properly.

**Solution**: Verify your `.env.local` file has the correct BetterAuth configuration:

```bash
BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-chars-long"
BETTER_AUTH_URL="http://localhost:3000"
```

Ensure the `BETTER_AUTH_SECRET` is at least 32 characters long.

### BetterAuth Schema Issues

**Problem**: Sign up fails with database constraint errors like:
```
Sign up error: [SqliteError: NOT NULL constraint failed: accounts.type]
```

**Solution**: This indicates a schema mismatch between your database and BetterAuth requirements. Use the BetterAuth CLI to generate the correct schema:

```bash
# Generate BetterAuth schema

# Update your schema files with the generated schema
# Then run migrations
pnpm run db:generate
pnpm run db:migrate
```

**Why this happens**: BetterAuth has specific schema requirements for its authentication tables. Custom schemas may be missing required fields or have incorrect field types.

### BetterAuth Deprecation Warning

**Problem**: Console shows warning about deprecated `advanced.generateId`.

**Solution**: Update your auth configuration in `src/lib/auth.ts`:

```typescript
// Replace this:
advanced: {
  generateId: () => crypto.randomUUID(),
}

// With this:
advanced: {
  database: {
    generateId: () => crypto.randomUUID(),
  },
}
```

## Build Issues

### TypeScript Compilation Errors

**Problem**: Build fails with TypeScript errors.

**Solution**: 
1. Run type checking: `pnpm run type-check`
2. Fix any reported errors
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `pnpm run build`

### Missing Environment Variables

**Problem**: Build or runtime errors about missing environment variables.

**Solution**: Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## Recipe App Specific Issues

### Recipe Images Not Loading

**Problem**: Recipe images show broken or don't display.

**Solution**: 
1. Check that `UPLOAD_DIR` in `.env.local` exists and is writable
2. Verify image file paths in the database
3. Check Next.js static file serving configuration

### Recipe Search Not Working

**Problem**: Recipe search returns no results or errors.

**Solution**:
1. Verify database has recipe data: `pnpm run db:studio`
2. Check search query syntax in the application logs
3. Ensure database indexes are created for search fields

## Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/your-repo/tastebase/issues)
2. Review the application logs for detailed error messages
3. Use `pnpm run health-check` to diagnose common problems
4. Enable verbose logging by setting `NODE_ENV=development`