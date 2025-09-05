#!/usr/bin/env tsx

import { execSync } from "node:child_process";

type QualityIssue = {
  file: string;
  line: number;
  column?: number;
  type: "debug" | "todo" | "type-unsafe" | "placeholder" | "performance";
  severity: "critical" | "warning" | "info";
  content: string;
  context?: string;
  suggestion?: string;
};

type QualityPattern = {
  name: string;
  pattern: RegExp;
  type: QualityIssue["type"];
  severity: QualityIssue["severity"];
  suggestion?: string;
  exclude?: RegExp[];
};

class CodeQualityScanner {
  private qualityIssues: QualityIssue[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyDebug = false;
  private onlyTodos = false;
  private onlyTypes = false;

  private readonly patterns: QualityPattern[] = [
    // Debug code patterns (CRITICAL - should not be in production)
    {
      name: "console.log",
      pattern: /console\.log\s*\(/g,
      type: "debug",
      severity: "critical",
      suggestion: "Remove console.log statements before production deployment",
    },
    {
      name: "console.warn",
      pattern: /console\.warn\s*\(/g,
      type: "debug",
      severity: "warning",
      suggestion: "Consider using proper logging library instead of console.warn",
    },
    {
      name: "console.error",
      pattern: /console\.error\s*\(/g,
      type: "debug",
      severity: "warning",
      suggestion: "Consider using proper error logging instead of console.error",
      exclude: [
        /catch\s*\([^)]*\)\s*{[\s\S]*?console\.error/, // Allow in catch blocks
        /error\.tsx$/, // Allow in error boundaries
        /src\/app\/.*\.tsx$/, // Allow in Next.js app directory (client-side)
        /src\/.*\/components\/.*\.tsx$/, // Allow in React components (client-side)
      ],
    },
    {
      name: "debugger",
      pattern: /\bdebugger\b/g,
      type: "debug",
      severity: "critical",
      suggestion: "Remove debugger statements before production deployment",
    },
    {
      name: "alert",
      pattern: /\balert\s*\(/g,
      type: "debug",
      severity: "critical",
      suggestion: "Remove alert() calls before production deployment",
    },

    // TODO/FIXME tracking (INFO - technical debt awareness)
    {
      name: "TODO comment",
      pattern: /\/\/\s*TODO[:\s]/gi,
      type: "todo",
      severity: "info",
      suggestion: "Track and prioritize TODO items for implementation",
    },
    {
      name: "FIXME comment",
      pattern: /\/\/\s*FIXME[:\s]/gi,
      type: "todo",
      severity: "warning",
      suggestion: "FIXME items indicate known issues that should be addressed",
    },
    {
      name: "HACK comment",
      pattern: /\/\/\s*HACK[:\s]/gi,
      type: "todo",
      severity: "warning",
      suggestion: "HACK items indicate technical debt that should be refactored",
    },
    {
      name: "XXX comment",
      pattern: /\/\/\s*XXX[:\s]/gi,
      type: "todo",
      severity: "warning",
      suggestion: "XXX items indicate areas needing attention or review",
    },

    // Type safety issues (WARNING - potential runtime errors)
    {
      name: "any type",
      pattern: /:\s*any\b/g,
      type: "type-unsafe",
      severity: "warning",
      suggestion: "Replace 'any' with proper TypeScript types for better type safety",
      exclude: [/\/\*[\s\S]*?\*\//, /\/\/.*$/gm], // Exclude comments
    },
    {
      name: "as any cast",
      pattern: /\bas\s+any\b/g,
      type: "type-unsafe",
      severity: "warning",
      suggestion: "Replace 'as any' with proper type assertions or fix underlying type issues",
    },
    {
      name: "@ts-ignore",
      pattern: /\/\/\s*@ts-ignore/g,
      type: "type-unsafe",
      severity: "warning",
      suggestion: "Address TypeScript errors instead of using @ts-ignore",
    },
    {
      name: "@ts-nocheck",
      pattern: /\/\/\s*@ts-nocheck/g,
      type: "type-unsafe",
      severity: "critical",
      suggestion: "Remove @ts-nocheck and fix TypeScript errors for type safety",
    },
    {
      name: "non-null assertion",
      pattern: /[^!]!\s*[\.\[\(]/g,
      type: "type-unsafe",
      severity: "info",
      suggestion: "Consider proper null checks instead of non-null assertions",
    },

    // Placeholder detection (INFO - unfinished implementations)
    {
      name: "placeholder text",
      pattern: /(?:placeholder|lorem ipsum|dummy|fake)/gi,
      type: "placeholder",
      severity: "info",
      suggestion: "Replace placeholder content with real implementation",
    },
    {
      name: "unimplemented function",
      pattern: /throw\s+new\s+Error\s*\(\s*['"](not implemented|todo|unimplemented)['"]/gi,
      type: "placeholder",
      severity: "warning",
      suggestion: "Implement the function or remove if not needed",
    },

    // Performance anti-patterns (INFO - optimization opportunities)
    {
      name: "synchronous file operations",
      pattern: /fs\.(readFileSync|writeFileSync|existsSync|statSync)/g,
      type: "performance",
      severity: "info",
      suggestion: "Consider using async file operations for better performance",
    },
  ];

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyDebug = args.includes("--debug");
    this.onlyTodos = args.includes("--todos");
    this.onlyTypes = args.includes("--types");
  }

  public async analyze(): Promise<void> {
    if (!this.ciMode) {
      console.log("🔍 CODE QUALITY SCANNER");
      console.log("=======================");
      console.log("");
    }

    const startTime = Date.now();

    // Get list of files to scan
    const files = await this.getFilesToScan();
    
    if (this.verbose && !this.ciMode) {
      console.log(`📂 Scanning ${files.length} files...`);
    }

    // Scan each file
    for (const file of files) {
      await this.scanFile(file);
    }

    const duration = Date.now() - startTime;

    if (!this.ciMode) {
      this.displayResults(duration);
    }

    // Exit with appropriate code for CI
    if (this.ciMode) {
      const criticalIssues = this.qualityIssues.filter((issue) => issue.severity === "critical");
      
      if (criticalIssues.length > 0) {
        console.error(`Critical code quality issues found: ${criticalIssues.length} issues`);
        process.exit(1);
      } else {
        const warnings = this.qualityIssues.filter((issue) => issue.severity === "warning").length;
        const infos = this.qualityIssues.filter((issue) => issue.severity === "info").length;
        console.log(`✅ No critical code quality issues found (${warnings} warnings, ${infos} info)`);
        process.exit(0);
      }
    }
  }

  private async getFilesToScan(): Promise<string[]> {
    try {
      // Find all TypeScript/JavaScript files, excluding test files and node_modules
      const files = execSync(
        'find ./src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v __tests__ | grep -v node_modules | head -100',
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      return files;
    } catch (error) {
      if (this.verbose) {
        console.error("Error getting files to scan:", error);
      }
      return [];
    }
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = execSync(`cat "${filePath}"`, { encoding: "utf8" });
      const lines = content.split("\n");

      for (const pattern of this.patterns) {
        // Skip patterns based on CLI flags
        if (this.onlyDebug && pattern.type !== "debug") continue;
        if (this.onlyTodos && pattern.type !== "todo") continue;
        if (this.onlyTypes && pattern.type !== "type-unsafe") continue;

        // Use line-by-line processing for better performance
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          const matches = line.match(pattern.pattern);
          
          if (matches) {
            for (const match of matches) {
              // Check exclusion patterns
              if (this.shouldExcludeLine(line, match, pattern.exclude, filePath)) {
                continue;
              }

              this.qualityIssues.push({
                file: filePath,
                line: lineIndex + 1,
                column: line.indexOf(match) + 1,
                type: pattern.type,
                severity: pattern.severity,
                content: match,
                context: line.trim(),
                suggestion: pattern.suggestion,
              });
            }
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Error scanning ${filePath}:`, error);
      }
    }
  }

  private shouldExcludeLine(line: string, match: string, excludePatterns?: RegExp[], filePath?: string): boolean {
    if (!excludePatterns) return false;

    // Check file-based exclusions first
    if (filePath) {
      for (const excludePattern of excludePatterns) {
        if (excludePattern.test(filePath)) {
          return true;
        }
      }
    }

    // Simple line-based exclusion for performance
    for (const excludePattern of excludePatterns) {
      if (excludePattern.test(line)) {
        return true;
      }
    }

    return false;
  }

  private getContextLines(lines: string[], lineIndex: number, contextSize: number): string[] {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize + 1);
    return lines.slice(start, end);
  }

  private displayResults(duration: number): void {
    const issuesByType = this.groupIssuesByType();
    const issuesBySeverity = this.groupIssuesBySeverity();

    // Display debug code issues
    if (issuesByType.debug && issuesByType.debug.length > 0 && (!this.onlyTodos && !this.onlyTypes)) {
      console.log("🚨 DEBUG CODE FOUND:");
      const debugIssues = issuesByType.debug.slice(0, 5);
      for (const issue of debugIssues) {
        const icon = issue.severity === "critical" ? "❌" : "⚠️ ";
        const location = `${issue.file}:${issue.line}`;
        console.log(`   ${icon} ${location} - ${issue.content.trim()}`);
        
        if (this.verbose && issue.context) {
          console.log(`      Context: ${issue.context.trim()}`);
        }
      }
      if (issuesByType.debug.length > 5) {
        console.log(`   ... and ${issuesByType.debug.length - 5} more`);
      }
      console.log("");
    }

    // Display technical debt
    if (issuesByType.todo && issuesByType.todo.length > 0 && (!this.onlyDebug && !this.onlyTypes)) {
      console.log("📝 TECHNICAL DEBT:");
      const todoCount = issuesByType.todo.filter(i => i.content.toLowerCase().includes("todo")).length;
      const fixmeCount = issuesByType.todo.filter(i => i.content.toLowerCase().includes("fixme")).length;
      const hackCount = issuesByType.todo.filter(i => i.content.toLowerCase().includes("hack")).length;
      const xxxCount = issuesByType.todo.filter(i => i.content.toLowerCase().includes("xxx")).length;

      if (todoCount > 0) console.log(`   ℹ️  ${todoCount} TODO comments found`);
      if (fixmeCount > 0) console.log(`   ⚠️  ${fixmeCount} FIXME comments found`);
      if (hackCount > 0) console.log(`   ⚠️  ${hackCount} HACK comments found`);
      if (xxxCount > 0) console.log(`   ⚠️  ${xxxCount} XXX comments found`);

      if (this.verbose) {
        const todoIssues = issuesByType.todo.slice(0, 3);
        for (const issue of todoIssues) {
          const location = `${issue.file}:${issue.line}`;
          console.log(`      ${location} - ${issue.content.trim()}`);
        }
      }
      console.log("");
    }

    // Display type safety issues
    if (issuesByType["type-unsafe"] && issuesByType["type-unsafe"].length > 0 && (!this.onlyDebug && !this.onlyTodos)) {
      console.log("🔒 TYPE SAFETY:");
      const anyCount = issuesByType["type-unsafe"].filter(i => i.content.includes("any")).length;
      const ignoreCount = issuesByType["type-unsafe"].filter(i => i.content.includes("@ts-ignore")).length;
      const assertionCount = issuesByType["type-unsafe"].filter(i => i.content.includes("!")).length;

      if (anyCount > 0) console.log(`   🔍 ${anyCount} uses of 'any' type`);
      if (ignoreCount > 0) console.log(`   🔍 ${ignoreCount} @ts-ignore statements`);
      if (assertionCount > 0) console.log(`   🔍 ${assertionCount} non-null assertions (!)`);

      if (this.verbose) {
        const typeIssues = issuesByType["type-unsafe"].slice(0, 3);
        for (const issue of typeIssues) {
          const location = `${issue.file}:${issue.line}`;
          console.log(`      ${location} - ${issue.content.trim()}`);
        }
      }
      console.log("");
    }

    // Display placeholders
    if (issuesByType.placeholder && issuesByType.placeholder.length > 0) {
      console.log("📝 PLACEHOLDER CONTENT:");
      console.log(`   ℹ️  ${issuesByType.placeholder.length} placeholder items found`);
      console.log("");
    }

    // Display performance issues
    if (issuesByType.performance && issuesByType.performance.length > 0) {
      console.log("⚡ PERFORMANCE OPPORTUNITIES:");
      console.log(`   ℹ️  ${issuesByType.performance.length} optimization opportunities found`);
      console.log("");
    }

    // Summary
    const totalIssues = this.qualityIssues.length;
    const criticalCount = issuesBySeverity.critical?.length || 0;
    const warningCount = issuesBySeverity.warning?.length || 0;
    const infoCount = issuesBySeverity.info?.length || 0;

    if (totalIssues === 0) {
      console.log("📊 CODE QUALITY: EXCELLENT ✅");
    } else if (criticalCount > 0) {
      console.log("📊 CODE QUALITY: CRITICAL ISSUES ❌");
      console.log(`❌ ${criticalCount} critical issues found`);
    } else if (warningCount > 0) {
      console.log("📊 CODE QUALITY: NEEDS REVIEW 🚨");
      console.log(`⚠️  ${warningCount} warnings found`);
    } else {
      console.log("📊 CODE QUALITY: GOOD ✅");
      console.log(`ℹ️  ${infoCount} info items found`);
    }

    console.log(`🚨 ${criticalCount} critical, ⚠️  ${warningCount} warnings, ℹ️  ${infoCount} info`);
    console.log(`⚡ Analysis completed in ${duration}ms`);

    if (this.verbose && totalIssues > 0) {
      console.log("\n📝 DETAILED ISSUES:");
      for (const issue of this.qualityIssues.slice(0, 10)) {
        const severityIcon = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
        console.log(`   ${severityIcon} ${issue.file}:${issue.line} - ${issue.type}: ${issue.content.trim()}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      }
      if (totalIssues > 10) {
        console.log(`   ... and ${totalIssues - 10} more issues`);
      }
    }
  }

  private groupIssuesByType(): Record<string, QualityIssue[]> {
    return this.qualityIssues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, QualityIssue[]>);
  }

  private groupIssuesBySeverity(): Record<string, QualityIssue[]> {
    return this.qualityIssues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, QualityIssue[]>);
  }
}

// Run the scanner
const scanner = new CodeQualityScanner();
scanner.analyze().catch((error) => {
  console.error("Quality scan failed:", error);
  process.exit(1);
});