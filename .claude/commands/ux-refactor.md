# UX Refactor Command Implementation

This command implements a **3-phase context-based workflow** using specialized agents to document, plan, and execute UX/UI refactoring.

## Command Template

```
I need you to refactor the directory `{DIRECTORY_PATH}` using a 3-phase context-based workflow:

**PHASE 1: UX Analysis & Design Documentation**
Use the Task tool to launch the ux-ui-designer agent with the following task:

"Analyze the directory `{DIRECTORY_PATH}` and create comprehensive UX/UI design specifications.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is DOCUMENTATION ONLY - NEVER implement any code changes
- ALWAYS create the context file: docs/context/design-specifications-{TIMESTAMP}.md
- NEVER provide actual code implementations - only detailed specifications
- Your role is analysis and planning, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/design-specifications-{TIMESTAMP}.md

Required Documentation Sections:
1. Component inventory and current UX/UI issue analysis
2. Component-by-component refactoring breakdown with detailed specifications
3. ShadCN component integration plan with SEMANTIC COLORS ONLY mapping
4. Mobile-first responsive design specifications for each component
5. Accessibility compliance plan with specific WCAG 2.1 AA requirements
6. Suspense + Skeleton implementation specifications for ALL dynamic data
7. Implementation priority order and dependency mapping
8. Component modularization strategy with file splitting plan (files < 150 lines)
9. Server action extraction specifications with organization plan
10. Detailed implementation instructions for main agent to follow

Expected Output: Comprehensive markdown documentation that main agent will follow exactly."

**PHASE 2: Technical Architecture Planning** (for complex refactors)
Use the Task tool to launch the system-architect agent with the following task:

"Read the design specifications from Phase 1 and create a detailed technical architecture plan for `{DIRECTORY_PATH}`.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is TECHNICAL PLANNING ONLY - NEVER implement any code changes
- ALWAYS create the context file: docs/context/technical-architecture-{TIMESTAMP}.md
- NEVER provide actual code implementations - only technical specifications
- Your role is architecture planning and risk assessment, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/technical-architecture-{TIMESTAMP}.md

Required Documentation Sections:
1. Component dependency analysis and migration order with rationale
2. Risk assessment and mitigation strategies for each refactoring step
3. Server action extraction plan with TypeScript interface specifications
4. Performance optimization recommendations and implementation strategy
5. Testing strategy and quality assurance plan for refactored components
6. Migration execution plan with rollback procedures and safety checks
7. File organization strategy and naming conventions
8. Import/export management and dependency resolution plan
9. Detailed technical implementation roadmap for main agent

Expected Output: Comprehensive technical documentation that main agent will follow exactly."

**PHASE 3: Implementation Execution**
**MAIN AGENT RESPONSIBILITY**: After specialist agents complete their documentation, I (the main agent) will execute ALL implementation work:

1. **Read All Context Files**: Load the latest documentation from `docs/context/`:
   - `design-specifications-{TIMESTAMP}.md` (required from Phase 1)
   - `technical-architecture-{TIMESTAMP}.md` (if exists from Phase 2)

2. **Execute Implementation Following Documentation Exactly**:
   - Read each context file completely before starting any implementation
   - Follow the component breakdown strategy from design specifications
   - Use the migration order and technical roadmap from architecture documentation
   - Apply ALL ShadCN component integrations with SEMANTIC COLORS ONLY (no hardcoded colors)
   - Implement mobile-first responsive design exactly as specified
   - Add Suspense + Skeleton patterns for ALL dynamic data loading points
   - Extract server actions per the documented organization plan
   - Ensure accessibility compliance per WCAG 2.1 AA specifications
   - Create all skeleton components as documented
   - Modularize components per the file splitting plan (< 150 lines)

3. **Validate Complete Implementation**: Ensure ALL requirements from context files are met:
   - Every specification from design documentation implemented
   - Every technical requirement from architecture documentation completed
   - TypeScript compilation passes without errors
   - All context file checklists validated
   - Responsive design works across all specified breakpoints
   - Accessibility standards fully implemented

**CRITICAL**: Only the main agent implements code. Specialist agents create documentation only.

Replace `{DIRECTORY_PATH}` with your target directory and `{TIMESTAMP}` with current timestamp.
```

## Usage Examples

### Example 1: Refactoring Billing Components
```
I need you to refactor the directory `src/features/billing/components` using a 3-phase context-based workflow:

**PHASE 1: UX Analysis & Design Documentation**
Use the Task tool to launch the ux-ui-designer agent with the following task:

"Analyze the directory `src/features/billing/components` and create comprehensive UX/UI design specifications. 

**CRITICAL: Your task is DOCUMENTATION ONLY - do not implement any code changes.**

Create a context file: `docs/context/design-specifications-20250116-1430.md`

[... rest of Phase 1 task ...]

**PHASE 2: Technical Architecture Planning**
Use the Task tool to launch the system-architect agent with the following task:

"Read the design specifications from Phase 1 and create a detailed technical architecture plan for `src/features/billing/components`.

[... rest of Phase 2 task ...]

**PHASE 3: Implementation Execution**
After both agents complete their documentation, implement the refactoring following the documented specifications.
```

### Example 2: Refactoring Dashboard Pages
```
I need you to refactor the directory `src/app/(dashboard)/settings` using a 3-phase context-based workflow:

[... same 3-phase structure with directory path updated ...]
```

## Quick Copy Commands

### For Simple Refactors (Design Documentation Only)
```
Refactor `{DIRECTORY}` using 2-phase workflow: 
1) Launch ux-ui-designer agent with STRICT INSTRUCTION: "DOCUMENTATION ONLY - NEVER implement code. Create docs/context/design-specifications-{TIMESTAMP}.md with comprehensive UX/UI specifications for main agent to follow."
2) Main agent reads context file and implements ALL documented specifications exactly: ShadCN components with SEMANTIC COLORS ONLY, mobile-first responsive design, Suspense+Skeleton for dynamic data, component modularization, server action extraction, accessibility compliance.
```

### For Complex Refactors (Full 3-Phase)
```
Refactor `{DIRECTORY}` using 3-phase workflow:
1) ux-ui-designer agent with STRICT INSTRUCTION: "DOCUMENTATION ONLY - Create design specs in docs/context/design-specifications-{TIMESTAMP}.md"
2) system-architect agent with STRICT INSTRUCTION: "DOCUMENTATION ONLY - Create technical architecture in docs/context/technical-architecture-{TIMESTAMP}.md"
3) Main agent reads both context files and implements ALL documented requirements exactly - agents do ZERO implementation.
```

## Agent Task Templates

### Phase 1: UX-UI Designer Agent Task
```
Analyze the directory `{DIRECTORY_PATH}` and create comprehensive UX/UI design specifications.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is DOCUMENTATION ONLY - NEVER implement any code changes
- ALWAYS create the context file: docs/context/design-specifications-{TIMESTAMP}.md
- NEVER provide actual code implementations - only detailed specifications
- Your role is analysis and planning, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/design-specifications-{TIMESTAMP}.md

Required Documentation Sections:
1. Component inventory and current UX/UI issue analysis
2. Component-by-component refactoring breakdown with detailed specifications
3. ShadCN component integration plan with SEMANTIC COLORS ONLY mapping
4. Mobile-first responsive design specifications for each component
5. Accessibility compliance plan with specific WCAG 2.1 AA requirements
6. Suspense + Skeleton implementation specifications for ALL dynamic data
7. Implementation priority order and dependency mapping
8. Component modularization strategy with file splitting plan (files < 150 lines)
9. Server action extraction specifications with organization plan
10. Detailed implementation instructions for main agent to follow

Expected Output Format:
- Comprehensive markdown documentation
- NO code implementations
- Detailed specifications that main agent can follow exactly
- Clear step-by-step implementation roadmap
- Quality validation checkpoints
```

### Phase 2: System-Architect Agent Task  
```
Read design specifications and create technical architecture plan for `{DIRECTORY_PATH}`.

**CRITICAL INSTRUCTIONS FOR AGENT:**
- Your task is TECHNICAL PLANNING ONLY - NEVER implement any code changes
- ALWAYS create the context file: docs/context/technical-architecture-{TIMESTAMP}.md
- NEVER provide actual code implementations - only technical specifications
- Your role is architecture planning and risk assessment, not implementation
- Main agent will read your documentation and do ALL the actual work

Create context file: docs/context/technical-architecture-{TIMESTAMP}.md

Required Documentation Sections:
1. Component dependency analysis and migration order with rationale
2. Risk assessment and mitigation strategies for each refactoring step
3. Server action extraction plan with TypeScript interface specifications
4. Performance optimization recommendations and implementation strategy
5. Testing strategy and quality assurance plan for refactored components
6. Migration execution plan with rollback procedures and safety checks
7. File organization strategy and naming conventions
8. Import/export management and dependency resolution plan
9. Detailed technical implementation roadmap for main agent

Expected Output Format:
- Comprehensive technical documentation
- NO code implementations 
- Detailed technical specifications that main agent can follow exactly
- Clear migration strategy with step-by-step execution plan
- Risk mitigation and quality assurance checkpoints
```

## Context File Management

### File Naming Convention
- Design specs: `design-specifications-YYYYMMDD-HHMM.md`
- Technical architecture: `technical-architecture-YYYYMMDD-HHMM.md`
- Use same timestamp for related files

### Reading Context Files
```bash
# Main agent should read latest context files:
ls docs/context/design-specifications-*.md | tail -1
ls docs/context/technical-architecture-*.md | tail -1
```

### Context File Validation
Before implementation, verify:
- [ ] Design specifications file exists and is complete
- [ ] Technical architecture file exists (for complex refactors)
- [ ] All requirements sections are filled out
- [ ] Implementation roadmap is clear and actionable

## Quality Assurance

### Documentation Phase Validation
- [ ] UX-UI Designer created complete design specifications
- [ ] System-Architect created technical architecture (if applicable)
- [ ] Context files follow template structure
- [ ] All requirements clearly documented

### Implementation Phase Validation
- [ ] All context file requirements implemented
- [ ] ShadCN semantic colors used exclusively
- [ ] Mobile-first responsive design applied
- [ ] Suspense + Skeleton pattern for all dynamic data
- [ ] Component modularity achieved (< 150 lines)
- [ ] Server actions properly extracted
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] TypeScript compilation passes

## Benefits of 3-Phase Approach

1. **Better Planning**: Comprehensive analysis before any code changes
2. **Documentation First**: All changes documented and reviewable
3. **Risk Mitigation**: Technical planning identifies potential issues
4. **Consistent Results**: Implementation follows exact specifications
5. **Reusable Context**: Documentation serves future development
6. **Agent Specialization**: Each agent focuses on their expertise
7. **Quality Assurance**: Clear validation criteria at each phase
8. **Iterative Improvement**: Context files can be updated and referenced

## ShadCN Color Reference

**Always use semantic colors for theme compatibility:**

```css
/* Core theme colors - ALWAYS USE THESE */
primary, secondary, accent, muted, destructive
background, foreground, card, border, input, ring

/* Chart/variety colors - USE FOR VISUAL VARIETY */
chart-1, chart-2, chart-3, chart-4, chart-5

/* Correct usage examples */
text-primary, bg-secondary/20, border-accent/30
bg-gradient-to-r from-chart-1 to-chart-3
text-destructive (errors), text-chart-2 (success)

/* NEVER USE - Hardcoded Tailwind colors */
text-blue-600, bg-green-500, from-indigo-600
```

Replace `{DIRECTORY_PATH}` and `{TIMESTAMP}` with actual values when using these commands.