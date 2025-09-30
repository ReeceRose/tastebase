# Fix Types Command

Interactive TypeScript type checking and linting issue resolution.

## Usage
```bash
/fix-types
```

## Description
This command provides an interactive terminal experience for systematically identifying and fixing TypeScript type errors and ESLint/Biome linting issues in your codebase.

## Features

### Interactive Type Error Fixing
- Runs `pnpm run type-check` to find all TypeScript errors
- Shows errors categorized by type (import issues, type mismatches, missing properties, etc.)
- Displays each error with:
  - File location and line number
  - Exact error message
  - Code snippet with context
  - Suggested fix
- Prompts for approval before applying each fix
- Allows skipping individual errors

### Interactive Lint Issue Resolution
- Runs `pnpm run lint` to find ESLint/Biome issues
- Categorizes issues by severity (errors vs warnings)
- Groups similar issues together for batch fixing
- Shows before/after code previews
- Applies fixes with user confirmation

### Smart Issue Prioritization
1. **Critical Type Errors** (build-breaking)
2. **Import/Export Issues** (code organization)
3. **Lint Errors** (code quality violations)
4. **Lint Warnings** (best practices)

### Workflow
1. Scan codebase for all type and lint issues
2. Present issues in priority order
3. For each issue category:
   - Show 3-5 specific issues at a time
   - Display file location, error, and proposed fix
   - Wait for user approval (y/n/s for skip)
   - Apply approved fixes immediately
   - Show progress and remaining count
4. Re-run checks after each batch to catch new issues
5. Provide final summary of fixed vs skipped issues

### Safety Features
- Never applies fixes without explicit user approval
- Shows exact code changes before applying
- Validates fixes don't introduce new errors
- Allows reverting recent changes if issues arise
- Creates backup of modified files (optional)

## Example Output
```
🔍 Found 15 TypeScript errors and 23 lint issues

📋 Type Errors (15) - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1/15: Import Error in src/components/forms/ai-recipe-parser.tsx:3
❌ Cannot find module '@/lib/ai/service' or its corresponding type declarations

   import { aiService } from '@/lib/ai/service';
                           ^^^^^^^^^^^^^^^^^^

🔧 Suggested Fix: Change to '@/lib/ai/index'
   import { aiService } from '@/lib/ai/index';

Apply this fix? (y/n/s to skip):
```

## Command Integration
- Respects project's linting configuration (biome.json, .eslintrc, etc.)
- Uses project's TypeScript config (tsconfig.json)
- Integrates with existing scripts (`pnpm run lint`, `pnpm run type-check`)
- Works with the project's specific tooling setup