# Refactor Large Files Command Documentation

## Overview

The `refactor-large-files` command provides a systematic, architecture-first approach to breaking down large, complex files into smaller, maintainable components. It leverages the system-architect agent for comprehensive planning and the main agent for safe execution.

## When to Use

Use this command when you have files that are:
- **400+ lines**: Consider refactoring (moderate priority)
- **600+ lines**: Should refactor (high priority)
- **800+ lines**: Must refactor (critical priority)

## Key Features

### 🏗️ **3-Phase Architecture-First Workflow**
1. **Analysis Phase**: System-architect analyzes file complexity and dependencies
2. **Planning Phase**: System-architect creates detailed refactoring architecture
3. **Execution Phase**: Main agent implements following the documented plan

### 🛡️ **Comprehensive Safety Checks**
- TypeScript compilation validation (`pnpm run type-check`)
- Linting compliance checks (`pnpm run lint`)
- Health check integration (`pnpm run health-check`)
- Incremental testing and rollback procedures

### 📋 **Complete Documentation**
- Analysis stored in `docs/context/refactoring/{filename}-analysis-{timestamp}.md`
- Architecture plans in `docs/context/refactoring/{filename}-architecture-{timestamp}.md`
- Implementation tracking and quality gates

## Quick Start Examples

### Single File Refactoring
```
Refactor large file `src/components/user-table.tsx` using 3-phase architecture-first workflow:

1) PHASE 1 - Analysis: Use Task tool with system-architect agent: "Analyze file `src/components/user-table.tsx` for large file refactoring. DOCUMENTATION ONLY - Create context file `docs/context/refactoring/user-table-analysis-2025-08-31-1430.md` with file size analysis, complexity assessment, dependency mapping, and refactoring strategy."

2) PHASE 2 - Architecture: Use Task tool with system-architect agent: "Create detailed refactoring architecture plan for `src/components/user-table.tsx`. DOCUMENTATION ONLY - Create context file `docs/context/refactoring/user-table-architecture-2025-08-31-1430.md` with component breakdown, extraction strategy, interface definitions, and step-by-step implementation plan."

3) PHASE 3 - Implementation: Main agent reads both context files and executes ALL refactoring following documented plan exactly.
```

### Directory-Wide Refactoring
```
Refactor large files in `src/features/billing/` using 3-phase architecture-first workflow:

1) First identify large files using `pnpm run large-files --path=src/features/billing/`
2) For each large file, execute 3-phase workflow
3) Prioritize by complexity and dependency impact
```

## Command Workflow Details

### Phase 1: File Analysis
The system-architect agent analyzes:
- File size and complexity metrics
- Dependency mapping (imports/exports)
- Component responsibility breakdown  
- Refactoring opportunities and risks
- Priority matrix for implementation

### Phase 2: Architecture Planning  
The system-architect agent creates:
- Component extraction strategy
- Server action organization plan
- File structure and naming conventions
- Step-by-step implementation roadmap
- Interface definitions and type contracts

### Phase 3: Safe Implementation
The main agent executes:
- Pre-implementation safety checks
- Incremental refactoring with validation
- TypeScript and linting compliance
- Comprehensive quality assurance
- Performance and functionality verification

## Quality Gates

### Pre-Implementation
```bash
pnpm run type-check              # TypeScript compilation
pnpm run lint                    # Code style validation  
pnpm run health-check           # Baseline metrics
pnpm run test                   # Test suite validation
```

### During Implementation
- TypeScript compilation after each extraction
- Linting checks for code quality
- Test validation at each step
- Performance impact monitoring

### Post-Implementation  
```bash
pnpm run type-check              # Must pass - no TS errors
pnpm run lint                    # Must pass - no lint errors
pnpm run health-check:ci         # Must pass for deployment
pnpm run test-coverage          # Validate test coverage
```

## Integration with Health Scripts

The command integrates with your existing health monitoring:
- Uses `pnpm run large-files` to identify targets
- Validates with `pnpm run architecture` compliance
- Ensures `pnpm run code-quality` improvements
- Monitors `pnpm run performance` impact

## Success Metrics

### Technical Success
- [ ] TypeScript compilation with no errors ✅
- [ ] Linting compliance achieved ✅  
- [ ] All tests passing
- [ ] Performance maintained/improved
- [ ] Architecture compliance validated

### Maintainability Improvements
- [ ] Single responsibility principle followed
- [ ] Component reusability improved
- [ ] Code duplication eliminated
- [ ] Clear separation of concerns

## Example Results

### Before Refactoring
```
src/components/user-management.tsx (850 lines)
- Mixed data fetching, UI, and business logic
- 15 different responsibilities 
- Complex nested rendering
- Embedded server actions
```

### After Refactoring  
```
src/components/user-management/
├── index.ts
├── user-management.tsx (120 lines) 
├── user-table.tsx (95 lines)
├── user-form.tsx (110 lines)
├── user-actions.tsx (85 lines)
└── skeletons/
    ├── user-table-skeleton.tsx
    └── user-form-skeleton.tsx

src/lib/server-actions/
└── user-management-actions.ts (140 lines)
```

**Result**: 850 lines → 7 focused files averaging 108 lines each

## Safety Features

### Rollback Procedures
- Automatic branch creation for safe experimentation
- Incremental validation checkpoints
- Full rollback capability if issues arise
- Partial rollback for cherry-picking successful changes

### Risk Mitigation
- Comprehensive dependency analysis before changes
- Step-by-step implementation with validation
- Performance impact monitoring throughout
- Functionality preservation verification

## Context File Templates

The system-architect agent follows standardized templates for:
- **Analysis Files**: Complexity assessment, dependency mapping, risk analysis
- **Architecture Files**: Component breakdown, implementation roadmap, quality gates
- **Completion Reports**: Summary of changes, metrics, and validation results

## Best Practices

1. **Always Run Analysis First**: Never skip the architecture planning phases
2. **Follow Implementation Order**: Stick to the documented roadmap exactly
3. **Validate Incrementally**: Check TypeScript/linting after each step
4. **Test Continuously**: Maintain green test suite throughout
5. **Document Changes**: Update context files with actual results

## Critical Architectural Standards

### ❌ **NEVER Use Static Methods**
- **Problem**: Static class methods cause biome linting errors and violate project standards
- **Solution**: Always use regular exported functions instead of static class methods
- **Example**: 
  ```typescript
  // ❌ WRONG - Static methods
  export class UserService {
    static async getUser(id: string) { ... }
  }
  
  // ✅ CORRECT - Regular functions
  export async function getUser(id: string) { ... }
  ```

### ❌ **NEVER Add Backwards Compatibility**
- **Problem**: Creates unnecessary code bloat and complexity
- **Solution**: Only create the new modular structure without re-exports
- **Example**:
  ```typescript
  // ❌ WRONG - Backwards compatibility re-exports
  export type { UserData, UserStats } from "./actions"; // Re-exports for compatibility
  
  // ✅ CORRECT - Direct imports only
  // No re-exports - consumers import directly from new modules
  ```

### ✅ **Required Function-Based Architecture**
- Use regular exported functions for all service operations
- Organize by feature directories with clear separation
- Direct imports from specific modules (no index re-exports for backwards compatibility)
- TypeScript path aliases (@/) for all imports

## Related Commands

- `.claude/commands/refactor-code.md` - General refactoring guidance
- `.claude/commands/ux-refactor.md` - UI/UX focused refactoring
- Health check scripts - Quality validation and monitoring

For the complete command implementation, see `.claude/commands/refactor-large-files.md`.