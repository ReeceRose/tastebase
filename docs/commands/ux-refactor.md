# UX Refactor Command

**Command**: `/ux-refactor <directory_path>`

**Purpose**: Automatically refactor React components in a directory to conform to modern UX/UI best practices, using ShadCN components, mobile-first responsive design, and proper component architecture.

## Usage

```
/ux-refactor src/features/billing/components
/ux-refactor src/app/(dashboard)/settings
/ux-refactor src/components/ui
```

## Command Implementation

When you run this command, Claude will execute a **3-phase context-based workflow**:

### Phase 1: UX Analysis & Design Documentation
1. **Analyze the target directory** and identify all React component files (.tsx/.jsx)
2. **Launch the UX-UI Designer agent** to analyze current components and create comprehensive design specifications
3. **Agent creates context file**: `docs/context/[project-name]-ux-refactor/design-specifications-YYYY-MM-DD-HHMM.md` with detailed refactoring plan

### Phase 2: Technical Architecture Planning (if complex)
1. **Launch the System Architect agent** for complex refactors requiring structural changes
2. **Agent creates context file**: `docs/context/[project-name]-ux-refactor/technical-architecture-YYYY-MM-DD-HHMM.md` with component structure and migration strategy
3. **Dependency analysis**: Plan refactoring order and component relationships

### Phase 3: Implementation Execution
1. **Main agent reads context files** and implements the documented specifications
2. **Apply systematic refactoring** following these principles:

### Core Refactoring Principles

#### 1. ShadCN Component Integration
- Replace custom UI elements with official ShadCN components
- Use `npx shadcn@latest add <component>` for any missing components
- **CRITICAL**: Use ShadCN semantic color variables exclusively (never hardcoded colors)
- Apply color system: `primary`, `secondary`, `accent`, `muted`, `destructive`, `chart-1` through `chart-5`
- Maintain consistent theming and styling patterns that work across theme changes

#### 2. Suspense + Skeleton Pattern
- Wrap ALL dynamic data loading in `<Suspense>` components
- Create corresponding skeleton components for loading states
- Follow the pattern: `<Suspense fallback={<ComponentSkeleton />}>`

#### 3. Mobile-First Responsive Design
- Apply Tailwind responsive classes starting with mobile
- Use breakpoint progression: `sm:` → `md:` → `lg:` → `xl:`
- Ensure touch-friendly interface elements (min 44px touch targets)

#### 4. Component Modularity
- Break large components into smaller, focused files
- Extract reusable UI patterns into separate components
- Follow single responsibility principle

#### 5. Server Action Separation
- Extract all server actions to dedicated files in `server/actions.ts`
- Maintain proper TypeScript types and error handling
- Follow project's server action patterns

#### 6. Accessibility Standards
- Ensure WCAG 2.1 AA compliance
- Add proper ARIA labels and semantic HTML
- Test keyboard navigation patterns

## Technical Implementation

### Step 1: Directory Analysis
```typescript
// The command will analyze files like:
const files = await glob(`${directory}/**/*.{tsx,jsx}`)
// Filter for React components and identify refactoring opportunities
```

### Step 2: Context Generation Phase
```typescript
// Phase 1: Launch UX-UI Designer Agent
const uxDesignerTask = `
Analyze the following React components and create comprehensive design specifications:

Directory: ${directory}
Components: ${componentList}

**IMPORTANT**: 
1. FIRST create the directory: docs/context/[project-name]-ux-refactor/
2. THEN create the context file: docs/context/[project-name]-ux-refactor/design-specifications-YYYY-MM-DD-HHMM.md

**Your task is DOCUMENTATION ONLY - do not implement any code changes.**

Include detailed analysis of:
1. Current UX patterns and improvement opportunities
2. Component-by-component breakdown and refactoring requirements
3. ShadCN component mappings and integration strategy
4. Mobile-first responsive design specifications  
5. Accessibility compliance requirements
6. Suspense + Skeleton loading state specifications
7. Implementation roadmap with priority order
8. Detailed component modularization plan
9. Server action extraction specifications

**Output Format**: Write comprehensive markdown documentation that the main agent can follow for implementation.
`

// Phase 2: Launch System Architect Agent (for complex refactors)
const architectTask = `
Analyze component structure and create technical architecture plan:

Directory: ${directory}
Context: Read design specifications from Phase 1

**IMPORTANT**: 
1. FIRST create the directory: docs/context/[project-name]-ux-refactor/ (if it doesn't exist)
2. THEN create the context file: docs/context/[project-name]-ux-refactor/technical-architecture-YYYY-MM-DD-HHMM.md

**Your task is TECHNICAL PLANNING ONLY - do not implement any code changes.**

Include:
1. Component dependency analysis and refactoring order
2. Migration strategy to minimize breaking changes
3. Server action extraction and organization plan
4. TypeScript interface definitions and type safety improvements
5. Performance optimization recommendations
6. Testing strategy for refactored components
7. Risk assessment and mitigation strategies

**Output Format**: Write detailed technical specifications that complement the design documentation.
`
```

### Step 3: Context-Driven Implementation
```typescript
// Phase 3: Main Agent Implementation
const implementationPhase = `
**STEP 1**: Read context files from docs/context/[project-name]-ux-refactor/
- design-specifications-YYYY-MM-DD-HHMM.md (required)
- technical-architecture-YYYY-MM-DD-HHMM.md (if exists)

**STEP 2**: Process components following documented specifications
- Follow the exact component breakdown plan from design specs
- Apply UX improvements while maintaining existing functionality
- Use the priority order specified in the documentation

**STEP 3**: Implement all documented requirements
- Create skeleton components for all dynamic data
- Extract and organize server actions per architecture plan
- Apply ShadCN component integrations as specified
- Implement mobile-first responsive design
- Add accessibility improvements

**STEP 4**: Validate implementation
- Ensure TypeScript compilation passes
- Verify all context file requirements are met
- Test responsive behavior and accessibility
`
```

- **Context-driven approach**: All implementation must follow documented specifications exactly
- **Documentation first**: No implementation without corresponding context files
- **Dependency order**: Process components based on architectural analysis
- **Quality validation**: Verify against context file requirements before completion
- **Iterative reference**: Context files serve as the single source of truth

### Step 4: Quality Validation
- Ensure TypeScript compilation passes
- Verify all imports resolve correctly
- Test responsive behavior across breakpoints
- Validate accessibility standards

## Project-Specific Conventions

This command follows Tastebase's architectural patterns:

- **Feature-based structure**: Components stay within their feature directories
- **Server actions**: Extract to `server/actions.ts` files within features
- **Component organization**: Small, focused files with clear single purposes
- **Styling**: Tailwind CSS with ShadCN component system
- **Color system**: MANDATORY use of ShadCN semantic colors for theme compatibility
- **Loading states**: Consistent Suspense + Skeleton pattern throughout

### ShadCN Color System Requirements

**✅ ALWAYS USE:**
```css
/* Semantic colors */
text-primary, bg-secondary, border-accent, text-muted-foreground

/* Chart colors for variety */
text-chart-1, bg-chart-2/20, border-chart-3/30

/* Themed gradients */
bg-gradient-to-r from-primary to-chart-1
bg-gradient-to-br from-chart-2/20 via-accent/10 to-chart-4/20

/* Status colors */
text-destructive (errors), text-chart-2 (success), text-chart-3 (warnings)
```

**❌ NEVER USE:**
```css
/* Hardcoded Tailwind colors */
text-blue-600, bg-green-500, border-red-300
text-indigo-700, bg-emerald-200, text-orange-600
```

## Example Transformation

**Before**: Large monolithic component with custom UI
```typescript
// src/features/billing/components/billing-dashboard.tsx (500+ lines)
export function BillingDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  
  // Custom buttons, forms, tables all in one file
  // No mobile responsiveness
  // No proper loading states
}
```

**After**: Modular components with modern UX
```typescript
// src/features/billing/components/billing-dashboard.tsx (50 lines)
export function BillingDashboard() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BillingHeaderSkeleton />}>
        <BillingHeader />
      </Suspense>
      <Suspense fallback={<BillingTableSkeleton />}>
        <BillingTable />
      </Suspense>
    </div>
  )
}

// src/features/billing/components/billing-header.tsx
// src/features/billing/components/billing-table.tsx
// src/features/billing/components/skeletons/billing-header-skeleton.tsx
// src/features/billing/server/actions.ts
```

## Command Execution

To use this command, simply type:
```
/ux-refactor <directory_path>
```

**Claude will execute the 3-phase workflow automatically:**

### Phase 1: UX Analysis & Design Documentation
- **Agent**: UX-UI Designer
- **Task**: Analyze components and create comprehensive design specifications
- **Output**: `docs/context/design-specifications-[timestamp].md`
- **Focus**: Documentation only, no code implementation

### Phase 2: Technical Architecture Planning  
- **Agent**: System Architect (for complex refactors)
- **Task**: Create technical migration strategy and architecture plan
- **Output**: `docs/context/technical-architecture-[timestamp].md`
- **Focus**: Technical planning and risk assessment

### Phase 3: Implementation Execution
- **Agent**: Main Agent (Claude)
- **Task**: Read context files and implement documented specifications
- **Process**: Systematic refactoring following documented plans
- **Focus**: Code implementation guided by context documentation

## Context File Structure

### Design Specifications Template
```markdown
# UX/UI Design Specifications - [Directory] - [Timestamp]

## Current State Analysis
- Component inventory and issues
- UX/UI improvement opportunities
- Performance and accessibility gaps

## Refactoring Plan
- Component breakdown strategy
- ShadCN integration requirements
- Mobile-first responsive specifications
- Suspense + Skeleton implementation plan

## Implementation Roadmap
- Priority order for component refactoring
- Dependencies and migration strategy
- Quality validation checkpoints
```

### Technical Architecture Template
```markdown
# Technical Architecture Plan - [Directory] - [Timestamp]

## Component Analysis
- Dependency mapping
- Refactoring order and rationale
- Risk assessment and mitigation

## Server Action Strategy
- Extraction and organization plan
- TypeScript interface definitions
- Error handling improvements

## Testing & Validation
- Component testing strategy
- Performance optimization plan
- Quality assurance checkpoints
```

**Benefits of Context-Based Approach:**
- **Better Planning**: Comprehensive analysis before implementation
- **Consistent Results**: All refactoring follows documented specifications
- **Reusable Context**: Context files can inform future development and serve as architectural documentation
- **Quality Assurance**: Clear success criteria and validation from analysis phase
- **Iterative Improvement**: Easy to reference, update, and build upon specifications
- **Agent Specialization**: Each agent focuses on their expertise area
- **Documentation Legacy**: Context files become permanent project documentation