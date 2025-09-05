# Intelligent Large File Refactoring with Architecture Planning

Systematically refactor and improve large, complex files using the system-architect agent for comprehensive planning and the main agent for safe, incremental execution.

## Overview

This command implements a **3-phase clean architecture refactoring workflow** specifically designed for large files (>400 lines) that completely eliminates technical debt while preserving functionality:

1. **Phase 1**: File Analysis & Architecture Planning (system-architect agent)
2. **Phase 2**: Clean Architecture Design (system-architect agent)  
3. **Phase 3**: Complete Replacement Implementation (main agent)
4. **Phase 4**: Comprehensive Report Generation (main agent)

**Key Principle**: **NO BACKWARDS COMPATIBILITY** - We completely replace the monolithic file with clean, modern modular architecture while ensuring all existing functionality is preserved through the new interface.

## Command Usage

### Basic Syntax
```bash
# For a specific large file
Refactor large file `{FILE_PATH}` using 3-phase architecture-first workflow

# For a directory with multiple large files
Refactor large files in `{DIRECTORY_PATH}` using 3-phase architecture-first workflow
```

### Quick Commands

#### Single File Refactoring
```
Refactor large file `src/features/admin/components/organization-table.tsx` using 3-phase architecture-first workflow:

1) PHASE 1 - Analysis: Use Task tool with system-architect agent: "Analyze file `src/features/admin/components/organization-table.tsx` for large file refactoring. DOCUMENTATION ONLY - Create context file `docs/context/refactoring/organization-table-analysis-YYYY-MM-DD-HHMM.md` with file size analysis, complexity assessment, dependency mapping, and refactoring strategy."

2) PHASE 2 - Architecture: Use Task tool with system-architect agent: "Create detailed refactoring architecture plan for `src/features/admin/components/organization-table.tsx`. DOCUMENTATION ONLY - Create context file `docs/context/refactoring/organization-table-architecture-YYYY-MM-DD-HHMM.md` with component breakdown, extraction strategy, interface definitions, and step-by-step implementation plan."

3) PHASE 3 - Implementation: Main agent reads both context files and executes ALL refactoring following documented plan exactly.

4) PHASE 4 - Report: Generate comprehensive refactoring report in `docs/refactoring-reports/{filename}-refactoring-YYYY-MM-DD.md` with metrics, benefits, and lessons learned.
```

#### Directory-Wide Large File Refactoring  
```
Refactor large files in `src/features/admin/` using 3-phase architecture-first workflow:

1) First identify large files using `pnpm run large-files --path=src/features/admin/`
2) For each large file, execute 3-phase workflow
3) Prioritize by complexity and dependency impact
4) Generate consolidated report for all refactoring
```

## Detailed Workflow

### PHASE 1: File Analysis & Architecture Planning

**Task for system-architect agent:**
```
Analyze file/directory `{TARGET_PATH}` for large file refactoring planning.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is ANALYSIS ONLY - NEVER implement any code changes  
- ALWAYS create context file: docs/context/refactoring/{filename}-analysis-{TIMESTAMP}.md
- NEVER provide actual code implementations - only analysis and planning
- Your role is architecture analysis and planning, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/refactoring/{filename}-analysis-{TIMESTAMP}.md

Required Analysis Sections:
1. **File Size & Complexity Assessment**
   - Line count analysis and complexity metrics
   - Identify specific areas contributing to large size
   - Code smell detection (long methods, deep nesting, multiple responsibilities)
   - Performance bottlenecks and optimization opportunities

2. **Dependency Mapping & Impact Analysis** 
   - Map all imports and exports from the target file
   - Identify files that depend on this file (reverse dependencies)
   - Assess refactoring impact on the broader codebase
   - Identify breaking change risks and mitigation strategies

3. **Component/Function Responsibility Analysis**
   - Break down the file into logical components/functions
   - Identify single responsibility violations
   - Map business logic vs UI logic separation opportunities
   - Server action extraction opportunities

4. **Refactoring Opportunity Assessment**
   - Specific extraction candidates (components, hooks, utilities, types)
   - Code duplication elimination opportunities
   - Performance optimization potential
   - Maintainability improvements possible

5. **Risk Assessment & Constraints**
   - High-risk refactoring areas (complex business logic, external dependencies)
   - Testing requirements and coverage gaps
   - Backwards compatibility constraints
   - Performance impact considerations

6. **Refactoring Priority Matrix**
   - Order refactoring tasks by impact vs complexity
   - Identify low-risk, high-impact quick wins
   - Plan complex, high-risk refactoring stages
   - Dependencies between refactoring tasks

Expected Output: Comprehensive analysis documentation that system-architect agent will use in Phase 2 for detailed planning.
```

### PHASE 2: Refactoring Architecture & Strategy

**Task for system-architect agent:**
```
Read Phase 1 analysis and create detailed refactoring architecture plan for `{TARGET_PATH}`.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is TECHNICAL PLANNING ONLY - NEVER implement any code changes
- ALWAYS create context file: docs/context/refactoring/{filename}-architecture-{TIMESTAMP}.md  
- NEVER provide actual code implementations - only technical specifications
- Your role is detailed architecture planning, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/refactoring/{filename}-architecture-{TIMESTAMP}.md

Required Architecture Planning Sections:
1. **Component Extraction Strategy**
   - Detailed breakdown of components to extract from large file
   - New file structure and naming conventions
   - Interface definitions and prop specifications
   - Component responsibility boundaries

2. **Server Action & Logic Extraction Plan**
   - Server actions to extract to dedicated files
   - Business logic separation from UI components  
   - Type definitions and validation schemas
   - Error handling and data flow patterns

3. **File Organization & Import/Export Strategy**
   - New directory structure and file organization
   - Index files and re-export patterns
   - Import path updates and dependency management
   - TypeScript path alias usage (@/ imports)

4. **Implementation Execution Plan**
   - Step-by-step refactoring order with rationale
   - Safe incremental changes to minimize risk
   - Testing checkpoints and validation steps
   - Rollback procedures for each phase

5. **Interface & Type Definitions**
   - TypeScript interfaces for extracted components
   - Shared type definitions and validation schemas
   - Props interfaces and component contracts
   - Server action input/output types

6. **Testing & Quality Assurance Strategy**
   - Test coverage requirements for new components
   - Integration testing for refactored code
   - Performance benchmarking checkpoints
   - Code quality validation gates

7. **Migration Execution Roadmap**
   - Detailed implementation instructions for main agent
   - Quality checkpoints and validation criteria  
   - Performance benchmarking requirements
   - Success criteria and completion validation

Expected Output: Implementation-ready technical architecture that main agent can execute step-by-step.
```

### PHASE 3: Implementation Execution

**Main Agent Responsibility:**
After specialist agents complete documentation, main agent executes ALL implementation:

1. **Read All Context Files**: Load documentation from `docs/context/refactoring/`:
   - `{filename}-analysis-{TIMESTAMP}.md` (Phase 1 analysis)
   - `{filename}-architecture-{TIMESTAMP}.md` (Phase 2 architecture)

2. **Pre-Implementation Safety Checks**:
   - Run `pnpm run health-check` to establish baseline
   - Validate TypeScript compilation: `pnpm run type-check`
   - Run linting checks: `pnpm run lint`  
   - Create backup branch: `git checkout -b refactor-large-files/{filename}-{timestamp}`
   - Ensure comprehensive test coverage exists or create tests first
   - Run full test suite to establish green baseline

3. **Execute Refactoring Following Architecture Plan**:
   - Follow step-by-step implementation roadmap from Phase 2
   - Create new components/files per architectural specifications  
   - Extract server actions and business logic as documented
   - Update imports/exports and maintain TypeScript path aliases (@/)
   - Implement proper TypeScript interfaces and type safety
   - Add comprehensive error handling and validation

4. **Incremental Validation & Testing**:
   - Run tests after each extraction/refactoring step
   - Validate TypeScript compilation: `pnpm run type-check` 
   - Check linting compliance: `pnpm run lint`
   - Check performance impact at key milestones  
   - Ensure no functionality regressions

5. **Quality Assurance Validation**:
   - Run complete health check suite: `pnpm run health-check`
   - Validate TypeScript with strict checks: `pnpm run type-check`
   - Check linting compliance: `pnpm run lint`
   - Validate code quality: `pnpm run code-quality`  
   - Check architecture compliance: `pnpm run architecture`
   - Ensure test coverage: `pnpm run test-coverage`
   - Performance validation: `pnpm run performance`

6. **Completion Verification**:
   - All Phase 2 specifications implemented completely
   - Original large file broken down per architecture plan
   - All tests passing with maintained/improved coverage
   - TypeScript compilation successful with strict checks: `pnpm run type-check`
   - Linting compliance achieved: `pnpm run lint`
   - Performance maintained or improved
   - Code quality metrics improved

### PHASE 4: Comprehensive Report Generation

**Main Agent Responsibility:**
After successful refactoring, generate detailed report:

1. **Create Refactoring Report**: `docs/refactoring-reports/{filename}-refactoring-{YYYY-MM-DD}.md`

Required Report Sections:
```markdown
# Large File Refactoring Report: {filename}

## Executive Summary
- Brief overview of refactoring scope and results
- Key metrics and improvements achieved

## Refactoring Overview
- Original state vs final state comparison
- File structure changes and new organization

## Methodology
- 3-phase approach details
- Duration and effort breakdown

## Technical Improvements
- Module-by-module breakdown of changes
- Code quality improvements achieved

## Quality Metrics
- File size optimization results
- Performance impact analysis
- Type safety and linting compliance

## Benefits Realized
- For LLM processing efficiency
- For development team productivity  
- For system architecture improvements

## Implementation Timeline
- Phase-by-phase execution details
- Validation checkpoints met

## Lessons Learned
- What worked well
- Best practices applied
- Recommendations for future refactoring

## Success Criteria
- Checklist of all objectives met
- Quantitative improvements achieved
```

## Large File Detection

### Automatic Detection Commands
```bash
# Find all large files in project
pnpm run large-files

# Find large files in specific directory  
pnpm run large-files --path=src/features/admin/

# Get detailed analysis of large files
pnpm run large-files:verbose
```

### Size Guidelines & Refactoring Triggers
- **400-600 lines**: Consider refactoring, moderate priority
- **600-800 lines**: Should refactor, high priority  
- **800+ lines**: Must refactor, critical priority
- **1000+ lines**: Immediate refactoring required

### Complexity Indicators
Beyond line count, consider refactoring when files have:
- **High Cyclomatic Complexity**: Multiple nested conditionals
- **Multiple Responsibilities**: Mixed UI, business logic, and data handling
- **Deep Component Nesting**: Components nested more than 4 levels
- **Large Function/Methods**: Individual functions >50 lines
- **Extensive Import Lists**: >20 import statements
- **Mixed Concerns**: Server actions, components, and utilities in same file

## Integration with Health Check Scripts

### Pre-Refactoring Validation
```bash
# Establish baseline metrics
pnpm run type-check > type-check-baseline.txt
pnpm run lint > lint-baseline.txt
pnpm run health-check:verbose > baseline-report.txt
pnpm run code-quality > code-quality-baseline.txt
pnpm run architecture > architecture-baseline.txt
pnpm run performance > performance-baseline.txt
```

### Post-Refactoring Validation
```bash
# Validate improvements  
pnpm run type-check              # Must pass - no TypeScript errors
pnpm run lint                    # Must pass - no linting errors
pnpm run health-check:ci         # Must pass for deployment
pnpm run code-quality:ci         # Validate code improvements
pnpm run architecture:ci         # Ensure architecture compliance
pnpm run performance:ci          # Validate performance maintained
```

### Integration Points
- **TypeScript Compliance**: Strict type checking with no errors or warnings
- **Linting Standards**: Code style and quality consistency across refactored files
- **Architecture Validation**: Ensure refactored code follows feature-based structure
- **Import Quality**: Validate @/ path usage and eliminate relative imports
- **Code Quality**: Verify elimination of debug code, TODOs, and type issues
- **Performance**: Ensure refactoring doesn't introduce performance regressions

## Context File Management

### File Naming Conventions
```
docs/context/refactoring/
├── {filename}-analysis-YYYY-MM-DD-HHMM.md      # Phase 1 analysis
├── {filename}-architecture-YYYY-MM-DD-HHMM.md  # Phase 2 architecture  
└── docs/refactoring-reports/
    └── {filename}-refactoring-YYYY-MM-DD.md    # Phase 4 comprehensive report
```

### Context File Templates

#### Phase 1 Analysis Template
```markdown
# Large File Refactoring Analysis - {filename}

## File Metrics
- **File Size**: X lines
- **Complexity Score**: High/Medium/Low
- **Component Count**: X components
- **Function Count**: X functions
- **Import Count**: X imports

## Complexity Assessment
### High Complexity Areas
- [Specific areas and line ranges]

### Refactoring Opportunities
- [Extraction candidates with priority]

## Dependency Analysis
### Imports (Dependencies)
- [List of imports and usage patterns]

### Exports (Dependents) 
- [Files that depend on this file]

## Risk Assessment
### High Risk Areas
- [Complex business logic, external integrations]

### Mitigation Strategies
- [How to reduce refactoring risks]

## Refactoring Priority Matrix
1. **Quick Wins** (Low Risk, High Impact)
2. **Strategic** (Medium Risk, High Impact)  
3. **Complex** (High Risk, High Impact)
4. **Future** (Low Priority, Technical Debt)
```

#### Phase 2 Architecture Template
```markdown  
# Large File Refactoring Architecture - {filename}

## Component Extraction Plan
### New File Structure
```
src/features/{feature}/components/
├── {component-name}/
│   ├── index.ts
│   ├── {component-name}.tsx
│   ├── {component-name}-form.tsx
│   └── types.ts
└── skeletons/
    └── {component-name}-skeleton.tsx
```

### Component Interfaces
```typescript
interface ComponentProps {
  // Prop definitions
}
```

## Implementation Roadmap
### Phase A: Foundation (Low Risk)
- [ ] Extract utility functions
- [ ] Create type definitions  
- [ ] Extract server actions

### Phase B: Components (Medium Risk)
- [ ] Extract child components
- [ ] Create skeleton components
- [ ] Update import/exports

### Phase C: Integration (High Risk)  
- [ ] Refactor main component
- [ ] Update parent components
- [ ] Final testing and validation

## Quality Gates
- [ ] TypeScript compilation passes
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Code quality improved
```

## Safety & Rollback Procedures

### Pre-Refactoring Safety
1. **Branch Creation**: `git checkout -b refactor-large-files/{filename}-{timestamp}`
2. **Baseline Tests**: Ensure all tests pass before refactoring
3. **Health Check**: Run `pnpm run health-check` for baseline metrics
4. **Backup Documentation**: Document current functionality and behavior

### Incremental Safety Checks
- **After Each Extraction**: Run tests, TypeScript compilation, and linting
- **After Each Phase**: Full validation with health checks
- **Performance Monitoring**: Benchmark critical user paths
- **Functionality Validation**: Manual testing of affected features

### Rollback Procedures  
1. **Immediate Rollback**: `git checkout main` if critical issues arise
2. **Partial Rollback**: Cherry-pick successful changes if some fail  
3. **Issue Documentation**: Document what went wrong and why
4. **Recovery Planning**: Plan to address rollback reasons

## Usage Examples

### Example 1: Large Admin Component
```
Target: src/features/admin/components/organization-table.tsx (850 lines)

Phase 1 Analysis finds:
- Mixed data fetching, UI rendering, and state management
- 15 different responsibilities in single component  
- Complex nested conditional rendering
- Server actions embedded in component

Phase 2 Architecture plans:
- Extract data fetching to server actions
- Create 5 smaller focused components
- Implement proper loading states with skeletons
- Separate table logic from business logic

Phase 3 Implementation:
- Extract server actions to actions.ts
- Create organization-table-row.tsx, organization-table-header.tsx
- Add organization-table-skeleton.tsx
- Refactor main component to orchestration only
Result: 850 lines → 6 files averaging 120 lines each
```

### Example 2: Complex Dashboard Page
```
Target: src/app/(dashboard)/admin/analytics/page.tsx (720 lines)

Phase 1 Analysis finds:
- Page component with embedded business logic
- Multiple data fetching patterns in single file
- Complex state management for different chart types
- No separation of concerns

Phase 2 Architecture plans:
- Move business logic to feature components
- Extract analytics components to feature directory
- Create dedicated server actions file
- Implement proper loading states

Phase 3 Implementation:  
- Move components to src/features/dashboard/admin/components/analytics/
- Extract analytics-actions.ts server actions
- Create analytics-overview.tsx, analytics-charts.tsx  
- Add comprehensive skeleton components
Result: 720 lines → 8 focused files, improved maintainability
```

## Benefits of Architecture-First Approach

1. **Comprehensive Planning**: System-architect agent provides thorough analysis before any changes
2. **Risk Mitigation**: Identifies and plans for potential issues before refactoring begins  
3. **Systematic Execution**: Main agent follows detailed roadmap reducing implementation errors
4. **Documentation First**: All changes planned and documented for future reference
5. **Quality Assurance**: Built-in validation and quality gates throughout process
6. **Performance Focused**: Considers performance impact at planning stage
7. **Test Coverage**: Ensures adequate testing before and after refactoring
8. **Maintainability**: Results in better organized, more maintainable code structure

## Success Criteria

### Technical Success Metrics
- [ ] Large file successfully broken into smaller, focused components
- [ ] All functionality preserved with no regressions
- [ ] TypeScript compilation with no errors: `pnpm run type-check` ✅
- [ ] Linting compliance achieved: `pnpm run lint` ✅
- [ ] Test coverage maintained or improved
- [ ] Performance maintained or improved  
- [ ] Code quality metrics improved
- [ ] Architecture compliance validated

### Maintainability Improvements
- [ ] Single responsibility principle followed
- [ ] Clear separation of concerns achieved
- [ ] Component reusability improved
- [ ] Code duplication eliminated
- [ ] Import/export clarity enhanced
- [ ] Documentation and readability improved

### Report Generation Requirements
- [ ] Comprehensive refactoring report created in `docs/refactoring-reports/`
- [ ] Metrics and benefits clearly documented
- [ ] Lessons learned captured for future reference
- [ ] Success criteria validation completed

Replace `{TARGET_PATH}`, `{filename}`, and `{TIMESTAMP}` with actual values when using these commands.

**Note**: This command now ALWAYS generates a comprehensive report in Phase 4, providing detailed documentation of the refactoring process, results, and lessons learned for future reference.