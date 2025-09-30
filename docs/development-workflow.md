# Development Workflow Documentation

This document provides comprehensive guidance on the development workflow tools and scripts available in Tastebase.

## Overview

The development workflow has been optimized with comprehensive tools for:
- **Database Management**: Reset, backup, seeding, and health monitoring
- **Data Management**: Test data generation and cleanup utilities  
- **Health Monitoring**: Database integrity, recipe quality, and auth system checks
- **Debugging Tools**: Query analysis, auth inspection, and file storage debugging
- **Quality Assurance**: Code health monitoring and performance analysis

## Database Development Workflow

### Core Database Commands

```bash
# Quick database reset with fresh data
pnpm run db:reset

# Generate migration from schema changes  
pnpm run db:generate

# Apply pending migrations
pnpm run db:migrate

# Seed database with sample data
pnpm run db:seed

# Fresh database (reset + seed)
pnpm run db:fresh

# Open Drizzle Studio
pnpm run db:studio

# Backup current database
pnpm run db:backup
```

### Database Reset Workflow

The `db:reset` script provides a comprehensive database reset:

```bash
pnpm run db:reset
```

**What it does:**
1. 📋 Backs up current database with timestamp
2. 🗑️ Removes existing database file
3. 🔄 Runs all migrations from scratch
4. 🌱 Seeds database with comprehensive sample data
5. ✅ Provides status confirmation

**Output Example:**
```
🗄️  Starting database reset...
📋 Backing up current database...
✅ Database backed up
🗑️  Removing existing database...
✅ Database removed  
🔄 Running database migrations...
✅ Migrations completed successfully
🌱 Seeding database with sample data...
✅ Database seeded successfully
🎉 Database reset complete!
```

## Development Data Management

### Test Data Generation

Generate large amounts of realistic test data for performance testing:

```bash
# Generate with default settings (10 users, 20 recipes each)
pnpm run dev:generate-test-data

# Custom generation
pnpm run dev:generate-test-data -- --users 50 --recipesPerUser 100
```

**Configuration Options:**
- `--users`: Number of test users to create
- `--recipesPerUser`: Recipes per user  
- `--ingredientsPerRecipe`: Average ingredients per recipe
- `--instructionsPerRecipe`: Average instructions per recipe
- `--tagsPerRecipe`: Average tags per recipe

### Development Data Reset

Reset only user-created data while preserving system data:

```bash
pnpm run dev:reset
```

**What it does:**
1. Clears all recipe data (recipes, ingredients, instructions)
2. Removes test user accounts  
3. Clears user-created tags
4. Re-seeds fresh test users and system tags
5. Preserves any real user accounts

## Health Monitoring System

### Database Health Checks

**Comprehensive Database Integrity Check:**
```bash
pnpm run health:db
```

**Checks performed:**
- User data integrity (email formats, duplicates)
- Recipe data completeness and validity
- Foreign key relationships and orphaned records
- Tag system integrity
- Database constraint validation
- Performance index usage

**Example Output:**
```
🔍 Running Database Integrity Check...

📊 Integrity Check Results:
   • Total Issues: 3
   • Errors: 1  
   • Warnings: 2
   • Info: 0

❌ Critical issues found that require attention:
   • Recipes found with invalid user references (2 items)

⚠️  Warnings found (should be reviewed):  
   • Users with missing or empty names (1 items)

✅ Database integrity check passed!
```

### Recipe Data Quality Check

**Recipe-Specific Data Quality Analysis:**
```bash
pnpm run health:recipes  
```

**Analyzes:**
- Recipe completeness (descriptions, ingredients, instructions)
- Ingredient data quality (names, amounts, sort orders)
- Instruction quality (content, step numbering)
- Image file integrity and accessibility
- Tag consistency and usage patterns

**Quality Metrics Provided:**
- Completeness score percentage
- Images coverage percentage  
- Tag coverage percentage
- Average ingredients/instructions per recipe

### Authentication System Health

**Auth System Monitoring:**
```bash
pnpm run health:auth
```

**Monitors:**
- User account health and validity
- Session management and cleanup needs
- Account provider consistency
- Verification token status
- Security issue detection (excessive sessions, old tokens)

**Provides Statistics:**
- Total/verified user counts
- Active/expired session counts
- Recent registration trends
- Authentication system usage patterns

## Debugging Tools

### Database Query Analysis

**Performance Analysis:**
```bash
pnpm run debug:queries
```

**Analyzes:**
- Basic query performance
- Join query efficiency  
- Search query optimization
- Aggregation query speed
- Complex query performance
- Concurrent load simulation

**Performance Report:**
- Query execution times
- Slow query identification (>500ms)
- Critical query alerts (>1000ms)
- Optimization recommendations

### Authentication Debugging

**Interactive Auth Inspector:**
```bash
# Inspect specific user
pnpm run debug:auth user-email user@example.com
pnpm run debug:auth user-id user-123

# Inspect session
pnpm run debug:auth session session-456

# View all active sessions
pnpm run debug:auth active-sessions

# Find problematic accounts  
pnpm run debug:auth problems

# System statistics
pnpm run debug:auth stats

# Test auth configuration
pnpm run debug:auth test-config

# Clean up expired data
pnpm run debug:auth cleanup
```

**Debug Information Provided:**
- Complete user session details
- Account provider information
- Verification token status
- Authentication issues identification
- Session expiration analysis

### File Storage Debugging

**Storage System Analysis:**
```bash
# Scan file system
pnpm run debug:files scan

# Find orphaned files
pnpm run debug:files orphaned

# Find missing files
pnpm run debug:files missing

# Validate image integrity
pnpm run debug:files validate

# Generate comprehensive report
pnpm run debug:files report

# Clean up orphaned files (dry run)
pnpm run debug:files cleanup

# Clean up orphaned files (execute)
pnpm run debug:files cleanup --confirm
```

**Analysis Features:**
- File system statistics
- Orphaned file detection
- Missing file identification
- Image integrity validation
- Storage usage optimization recommendations
- Automated cleanup capabilities

## Workflow Best Practices

### Daily Development Workflow

1. **Start Development:**
   ```bash
   # Fresh database for clean testing
   pnpm run db:fresh
   
   # Start development server
   pnpm run dev
   ```

2. **During Development:**
   ```bash
   # Reset test data as needed
   pnpm run dev:reset
   
   # Generate additional test data
   pnmp run dev:generate-test-data -- --users 20
   ```

3. **Component Development (REQUIRED: Suspense Pattern):**
   - **ALWAYS use Suspense + streaming** for locally hosted apps
   - **Page structure**: Auth only → Suspense wrapper → Data components + Skeletons
   - **Create skeleton components** in `/src/components/skeletons/` for all data loading
   - **Performance target**: Page shell <100ms, data streams progressively

4. **Before Commits:**
   ```bash
   # Run health checks
   pnpm run health-check:quick
   
   # Check for issues  
   pnpm run lint && pnpm run type-check
   ```

### Database Schema Changes

1. **Modify Schema Files:**
   - Update `src/db/schema.*.ts` files

2. **Generate Migration:**
   ```bash
   pnpm run db:generate
   ```

3. **Review Generated SQL:**
   - Check `src/db/migrations/` for new migration file
   - Ensure migration is correct and safe

4. **Apply Migration:**
   ```bash
   pnpm run db:migrate
   ```

5. **Update Seed Data:**
   - Modify `src/db/seed-data/` files if needed
   - Test with `pnpm run db:fresh`

### Performance Testing Workflow

1. **Generate Large Dataset:**
   ```bash
   # Create performance test data
   pnpm run dev:generate-test-data -- --users 100 --recipesPerUser 50
   ```

2. **Run Performance Analysis:**
   ```bash
   # Analyze database queries
   pnpm run debug:queries
   
   # Check overall performance
   pnpm run performance
   ```

3. **Optimize Based on Results:**
   - Add database indexes for slow queries
   - Optimize component rendering
   - Review bundle size issues

### Troubleshooting Workflow

1. **Identify Issue Category:**
   - Database issues → `pnpm run health:db`
   - Recipe data issues → `pnpm run health:recipes`  
   - Auth issues → `pnpm run debug:auth stats`
   - File issues → `pnpm run debug:files report`

2. **Deep Dive Analysis:**
   ```bash
   # For specific user issues
   pnpm run debug:auth user-email problematic@user.com
   
   # For file storage issues
   pnpm run debug:files validate
   
   # For query performance issues  
   pnpm run debug:queries
   ```

3. **Apply Fixes and Verify:**
   ```bash
   # After fixes, re-run health checks
   pnpm run health-check
   ```

### Cleanup and Maintenance

**Weekly Maintenance:**
```bash
# Clean up expired auth data
pnpm run debug:auth cleanup

# Clean up orphaned files
pnpm run debug:files cleanup --confirm

# Backup database
pnpm run db:backup

# Health check
pnpm run health-check
```

**Monthly Deep Clean:**
```bash
# Full system health report
pnpm run health-check:full-report

# Comprehensive file system cleanup
pnpm run debug:files report
pnpm run debug:files cleanup --confirm

# Database optimization check
pnpm run debug:queries
```

## Script Reference

### Database Scripts
- `db:reset` - Complete database reset with backup
- `db:backup` - Create timestamped database backup
- `db:fresh` - Reset database and apply fresh seed data
- `dev:reset` - Reset only development/test data
- `dev:generate-test-data` - Generate large test datasets

### Health Check Scripts  
- `health:db` - Database integrity and relationships
- `health:recipes` - Recipe data quality and completeness
- `health:auth` - Authentication system health

### Debug Scripts
- `debug:queries` - Database query performance analysis
- `debug:auth` - Authentication system inspector
- `debug:files` - File storage system debugging

### Utility Scripts
- `dev:auth-cleanup` - Quick auth data cleanup

## Error Handling

All development scripts include comprehensive error handling:

- **Colored Output**: Green for success, yellow for warnings, red for errors
- **Detailed Logging**: Structured logs with context information
- **Graceful Failures**: Scripts continue when possible, report issues clearly
- **Recovery Guidance**: Scripts provide next steps when failures occur

## Integration with CI/CD

Many scripts support CI mode for automated testing:

```bash
# CI-friendly health checks
pnpm run health-check:ci

# Performance analysis in CI
pnpm run performance:ci

# Automated cleanup in CI
pnmp run debug:auth cleanup
```

This comprehensive development workflow ensures:
- **Reliable Development Environment**: Consistent database states and test data
- **Proactive Issue Detection**: Regular health monitoring and automated checks  
- **Efficient Debugging**: Comprehensive tools for rapid issue resolution
- **Quality Assurance**: Continuous monitoring of system health and performance
- **Maintenance Automation**: Automated cleanup and optimization processes

The workflow scales from individual development to team collaboration while maintaining data integrity and system performance.