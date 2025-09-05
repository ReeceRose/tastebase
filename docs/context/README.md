# Context Documentation Directory

This directory contains context files created by specialized agents during the UX refactoring workflow. These files serve as specifications and plans that guide implementation.

## File Types

### Design Specifications
**Pattern**: `design-specifications-YYYYMMDD-HHMM.md`
**Created by**: UX-UI Designer Agent (Phase 1)
**Purpose**: Comprehensive UX/UI analysis and refactoring specifications

**Contains**:
- Current state analysis of components
- UX/UI improvement opportunities
- Component breakdown and modularization plans
- ShadCN integration requirements with semantic colors
- Mobile-first responsive design specifications
- Accessibility compliance requirements (WCAG 2.1 AA)
- Suspense + Skeleton implementation plans
- Implementation roadmap with priorities

### Technical Architecture Plans
**Pattern**: `technical-architecture-YYYYMMDD-HHMM.md`
**Created by**: System-Architect Agent (Phase 2)
**Purpose**: Technical migration strategy and risk assessment

**Contains**:
- Component dependency analysis
- Refactoring order and migration strategy
- Server action extraction plans
- TypeScript interface definitions
- Performance optimization recommendations
- Testing strategy and quality assurance plans
- Risk assessment and mitigation strategies

## Workflow Integration

### Phase 1: Documentation Creation
1. UX-UI Designer agent analyzes target directory
2. Creates comprehensive design specifications
3. Documents all UX/UI improvements needed
4. **No code implementation occurs**

### Phase 2: Technical Planning
1. System-Architect agent reads design specifications
2. Creates detailed technical architecture plan
3. Plans migration strategy and risk mitigation
4. **No code implementation occurs**

### Phase 3: Implementation
1. Main agent reads both context files
2. Implements refactoring following documented specifications exactly
3. Validates implementation against context file requirements
4. **All implementation follows documented plans**

## File Management

### Naming Conventions
Use timestamp format: `YYYYMMDD-HHMM`
- Example: `design-specifications-20250116-1430.md`
- Example: `technical-architecture-20250116-1430.md`

### Related Files
Files with the same timestamp are part of the same refactoring project:
```
design-specifications-20250116-1430.md      # Phase 1 output
technical-architecture-20250116-1430.md     # Phase 2 output
```

### Reading Latest Files
```bash
# Get latest design specifications
ls design-specifications-*.md | tail -1

# Get latest technical architecture  
ls technical-architecture-*.md | tail -1
```

## Templates

### For UX-UI Designer Agents
Use `design-specifications-template.md` as the structure guide when creating design documentation.

### For System-Architect Agents  
Use `technical-architecture-template.md` as the structure guide when creating technical plans.

## Quality Assurance

### Documentation Requirements
- [ ] All template sections completed
- [ ] Specific, actionable requirements documented
- [ ] Clear implementation roadmap provided
- [ ] Dependencies and priorities identified

### Implementation Validation
- [ ] All context file requirements implemented
- [ ] No deviations from documented specifications
- [ ] Quality gates from context files met
- [ ] Validation criteria satisfied

## Benefits

1. **Documentation-Driven Development**: All changes planned before implementation
2. **Agent Specialization**: Each agent focuses on their expertise area
3. **Reusable Specifications**: Context files inform future development
4. **Quality Assurance**: Clear requirements and validation criteria
5. **Risk Mitigation**: Technical planning identifies potential issues
6. **Consistent Results**: Implementation follows exact specifications
7. **Historical Reference**: Context files serve as project documentation

## Context File Lifecycle

```
UX-UI Designer Agent → design-specifications-{timestamp}.md
                           ↓
System-Architect Agent → technical-architecture-{timestamp}.md  
                           ↓
Main Agent → Implementation following both context files
                           ↓
Validated Implementation with all requirements met
```

## Usage in Commands

The `/ux-refactor` command automatically:
1. Launches appropriate agents for documentation phases
2. Creates context files with proper naming
3. Guides main agent to read and implement from context files
4. Validates implementation against documented requirements

## Archive Management

### Active Context Files
Keep recent context files for reference and potential updates.

### Archival Strategy
Consider archiving context files older than 6 months to:
- `docs/context/archive/YYYY/`
- Maintain directory performance
- Preserve historical context for reference

## Best Practices

### For Agent Tasks
- **Documentation Only**: Agents should never implement code during documentation phases
- **Complete Specifications**: All template sections must be thoroughly filled
- **Actionable Requirements**: Every requirement should be specific and implementable
- **Clear Dependencies**: Document component relationships and migration order

### For Implementation
- **Follow Exactly**: Implement according to documented specifications precisely
- **Validate Continuously**: Check context file requirements during implementation
- **Document Deviations**: If changes needed, update context files accordingly
- **Quality Gates**: Meet all validation criteria from context files

This directory serves as the central hub for documentation-driven UX refactoring, ensuring consistent, well-planned, and thoroughly documented improvements to the codebase.