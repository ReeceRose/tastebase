# Usage Checker

A focused tool for analyzing file and component usage patterns in the codebase. Helps identify unused files that can be safely removed during code cleanup.

## Quick Start

```bash
# Check if a specific file is imported anywhere (fastest, most accurate)
pnpm check-usage:imports --file src/features/subscription/components/upgrade-prompt.tsx

# Full analysis of a file (slower, includes individual exports)
pnpm check-usage --file src/features/subscription/components/upgrade-prompt.tsx

# Check usage of a specific component/function
pnpm check-usage --string ComponentName
```

## Commands

### Basic Usage

```bash
pnpm run check-usage           # Interactive help
pnpm run check-usage:imports   # Quick file import check (recommended)
pnpm run check-usage:verbose   # Detailed analysis with debug info
pnpm run check-usage:json      # JSON output for automation
```

### Command Line Options

```bash
# File Analysis
--file, -f <path>       # Check all exports in a specific file
--string, -s <name>     # Check usage of a specific string/element

# Analysis Modes  
--import-only          # Only check if file is imported (fastest, most accurate)
--verbose, -v          # Show detailed progress and analysis
--json                 # Output results as JSON for CI/automation
--help, -h             # Show help message
```

## Examples

### 1. Quick File Import Check (Recommended)

```bash
# Check if a file is imported anywhere - most reliable method
pnpm check-usage:imports --file src/components/unused-component.tsx

# Output:
# 🔗 src/components/unused-component.tsx is NOT imported anywhere ❌
#    File can likely be safely removed
```

### 2. Full File Analysis

```bash
# Analyze all exports in a file
pnpm check-usage --file src/features/subscription/components/upgrade-prompt.tsx

# Shows:
# - File import status (most important)
# - Individual export usage
# - Documentation references
# - Usage health score
```

### 3. Component/Function Search

```bash
# Check if a specific component is used anywhere
pnpm check-usage --string UpgradePrompt

# Check a utility function
pnpm check-usage --string calculateTax
```

### 4. Automation & CI

```bash
# JSON output for scripts
pnpm check-usage --file src/components/test.tsx --json

# Returns structured data:
{
  "file": "src/components/test.tsx",
  "imported": false,
  "status": "unused"
}
```

## Output Interpretation

### File Import Status (Primary Signal)

```bash
🔗 FILE IMPORT STATUS: This file is NOT imported anywhere ❌
   The entire file can likely be removed
```

This is the **most important indicator**. If a file is not imported anywhere, it's safe to remove regardless of internal usage patterns.

### Export Analysis

- **✅ Used in code** - Component/function is actively referenced
- **📖 Only in docs** - Referenced in documentation but not in code
- **❌ Completely unused** - Safe to remove

### Health Scores

- **🎉 EXCELLENT** - No unused code
- **👍 VERY GOOD** - <10% unused  
- **✅ GOOD** - <25% unused
- **⚠️ NEEDS ATTENTION** - <50% unused
- **🚨 NEEDS MAJOR CLEANUP** - ≥50% unused

## Use Cases

### Code Cleanup

```bash
# Find files that can be safely removed
find src -name "*.tsx" -type f | while read file; do
  if pnpm check-usage:imports --file "$file" --json | grep -q '"imported": false'; then
    echo "Can remove: $file"
  fi
done
```

### Pre-commit Validation

```bash
# Check if new files are being used
pnpm check-usage:imports --file src/components/new-feature.tsx
```

### Refactoring Verification

```bash
# After moving/renaming components, verify usage
pnpm check-usage --file src/components/renamed-component.tsx --verbose
```

## Performance Notes

### Import-Only Mode (Fastest)

```bash
# ~100ms for typical file check
pnpm check-usage:imports --file path/to/file.tsx
```

- Only checks if file is imported elsewhere
- Most accurate for determining if file can be removed
- No false positives from generic function names

### Full Analysis (Slower)

```bash
# ~500ms-2s for typical file with many exports
pnpm check-usage --file path/to/file.tsx
```

- Analyzes all individual exports
- May have false positives (generic names like `getTitle`)
- Useful for detailed component audits

## Troubleshooting

### False Positives

**Problem**: Generic function names show as "used" but aren't actually imported
```bash
✅ getTitle
   Found 2 usage(s)
   # These are different functions with the same name
```

**Solution**: Use `--import-only` mode for file-level analysis
```bash
pnpm check-usage:imports --file src/components/problematic-file.tsx
```

### Path Aliases

The tool automatically handles TypeScript path aliases (`@/`):
```typescript
import { Component } from "@/features/subscription/components/upgrade-prompt"
// ✅ Will be detected correctly
```

### Relative Imports

Less common but also detected:
```typescript
import { Component } from "../components/upgrade-prompt"
// ✅ Will be detected
```

## Integration

### Package.json Scripts

```json
{
  "scripts": {
    "check-usage": "tsx scripts/check-usage.ts",
    "check-usage:imports": "tsx scripts/check-usage.ts --import-only", 
    "check-usage:verbose": "tsx scripts/check-usage.ts --verbose",
    "check-usage:json": "tsx scripts/check-usage.ts --json"
  }
}
```

### VS Code Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Check File Usage",
      "type": "shell", 
      "command": "pnpm",
      "args": ["check-usage:imports", "--file", "${relativeFile}"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    }
  ]
}
```

## Technical Details

### Architecture

- Built on the shared `code-analyzer-shared.ts` foundation
- Uses `ripgrep` for fast text search
- Prioritizes import detection over word-boundary matching
- Follows codebase health script standards

### Dependencies

- **ripgrep**: Fast text search (automatically detected)
- **Node.js**: Built-in child_process and fs modules
- **TypeScript**: For type safety and execution via tsx

### File Structure

```
scripts/
├── check-usage.ts              # Main script
├── lib/
│   └── code-analyzer-shared.ts # Shared utilities
└── find-unused-code.ts         # Related unused code finder
```