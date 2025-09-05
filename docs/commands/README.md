# Claude Commands

This directory contains documentation for reusable Claude Code commands. The actual executable commands are in `../.claude/commands/`.

## Available Commands

### `/ux-refactor`
Automatically refactor React components in a directory to conform to modern UX/UI best practices.

**Usage**: Copy the command template from `../.claude/commands/ux-refactor.md` and replace `{DIRECTORY_PATH}` with your target directory.

**What it does**:
- Uses the UX-UI designer agent to analyze and improve components
- Applies ShadCN components where possible
- Implements mobile-first responsive design
- Wraps dynamic data in Suspense with skeleton fallbacks
- Breaks large components into smaller, modular files
- Extracts server actions to separate files
- Ensures accessibility standards (WCAG 2.1 AA)

**Example**:
```
I need you to refactor the directory `src/features/billing/components` to conform to modern UX/UI best practices...
```

## How to Use Commands

1. **Find the command** you want in this directory
2. **Open the command file** (e.g., `../.claude/commands/ux-refactor.md`)
3. **Copy the command template**
4. **Replace any placeholders** (e.g., `{DIRECTORY_PATH}`) with your actual values
5. **Paste and send** the command to Claude

## Creating New Commands

To create a new reusable command:

1. Create a descriptive `.md` file in this directory
2. Include clear documentation of what the command does
3. Provide the exact command template to copy
4. Add usage examples
5. Update this README with the new command

## Command Best Practices

- **Be specific**: Include all requirements and constraints in the command
- **Use agents**: Leverage specialized agents like `ux-ui-designer` for complex tasks
- **Follow conventions**: Ensure commands follow the project's architectural patterns
- **Include examples**: Show how to use the command with real scenarios
- **Test thoroughly**: Validate commands work as expected before saving them