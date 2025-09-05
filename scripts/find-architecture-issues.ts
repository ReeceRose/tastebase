#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import path from "node:path";

type ArchitectureIssue = {
  file: string;
  line: number;
  type: "route-structure" | "import-path" | "file-size" | "naming-convention";
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion?: string;
  context?: string;
};

type ArchitectureRule = {
  name: string;
  type: ArchitectureIssue["type"];
  severity: ArchitectureIssue["severity"];
  check: (filePath: string, content: string, stats?: { size: number }) => ArchitectureIssue[];
  description: string;
};

class ArchitectureValidator {
  private issues: ArchitectureIssue[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyRoutes = false;
  private onlyImports = false;
  private onlySize = false;
  private onlyNaming = false;

  private readonly rules: ArchitectureRule[] = [
    // Route Structure Rules
    {
      name: "Route Directory Structure",
      type: "route-structure",
      severity: "critical",
      description: "Route directories should only contain page.tsx files",
      check: (filePath: string) => {
        const issues: ArchitectureIssue[] = [];
        
        // Check if file is in route directory but not a page.tsx
        const routeMatch = filePath.match(/src\/app\/\([^)]+\)\/(.+)/);
        if (routeMatch) {
          const relativePath = routeMatch[1];
          const fileName = path.basename(filePath);
          
          // Allow specific files in route directories
          const allowedFiles = [
            "page.tsx", "layout.tsx", "loading.tsx", "error.tsx", 
            "not-found.tsx", "global-error.tsx", "route.ts", "route.tsx"
          ];
          
          if (!allowedFiles.includes(fileName)) {
            // Check if it's a component, server action, or utility in route directory
            const problematicPatterns = [
              /components?\//,
              /server\//,
              /lib\//,
              /utils?\//,
              /hooks?\//,
              /types?\//
            ];
            
            const isProblematic = problematicPatterns.some(pattern => 
              relativePath.includes(pattern.source.replace(/\\\//g, "/").replace(/\?/g, ""))
            );
            
            if (isProblematic || fileName.includes("component") || fileName.includes("action")) {
              issues.push({
                file: filePath,
                line: 1,
                type: "route-structure",
                severity: "critical",
                message: `Business logic found in route directory: ${fileName}`,
                suggestion: `Move to src/features/<feature>/components/ or src/features/<feature>/server/`
              });
            }
          }
        }
        
        return issues;
      }
    },
    
    // Import Path Rules
    {
      name: "Relative Import Usage",
      type: "import-path",
      severity: "critical",
      description: "All imports must use @ path aliases, no relative imports",
      check: (filePath: string, content: string) => {
        const issues: ArchitectureIssue[] = [];
        const lines = content.split("\n");
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const relativeImportMatch = line.match(/import.*from\s+['"](\.\.|\.\/)/);
          
          if (relativeImportMatch) {
            issues.push({
              file: filePath,
              line: i + 1,
              type: "import-path",
              severity: "critical",
              message: `Relative import found: ${relativeImportMatch[1]}`,
              suggestion: "Use @ path alias instead (e.g., @/components/ui/button)",
              context: line.trim()
            });
          }
        }
        
        return issues;
      }
    },
    
    // File Size Rules
    {
      name: "File Size Optimization",
      type: "file-size",
      severity: "info",
      description: "Large files may be difficult to analyze and maintain",
      check: (filePath: string, content: string, stats?: { size: number }) => {
        const issues: ArchitectureIssue[] = [];
        const lines = content.split("\n").length;
        
        if (lines > 800) {
          issues.push({
            file: filePath,
            line: 1,
            type: "file-size",
            severity: "critical",
            message: `Very large file (${lines} lines)`,
            suggestion: "Consider breaking into smaller, focused modules"
          });
        } else if (lines > 400) {
          issues.push({
            file: filePath,
            line: 1,
            type: "file-size",
            severity: "warning",
            message: `Large file (${lines} lines)`,
            suggestion: "Consider refactoring for better maintainability"
          });
        } else if (lines > 200) {
          issues.push({
            file: filePath,
            line: 1,
            type: "file-size",
            severity: "info",
            message: `Medium-large file (${lines} lines)`,
            suggestion: "Monitor for complexity - sweet spot is 50-200 lines"
          });
        }
        
        return issues;
      }
    },
    
    // Naming Convention Rules
    {
      name: "File Naming Conventions",
      type: "naming-convention",
      severity: "warning",
      description: "Files should follow kebab-case naming conventions",
      check: (filePath: string) => {
        const issues: ArchitectureIssue[] = [];
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // Skip certain files
        const skipFiles = [
          "page", "layout", "loading", "error", "not-found", 
          "global-error", "route", "_app", "_document"
        ];
        
        if (skipFiles.includes(fileName)) {
          return issues;
        }
        
        // Check for camelCase or PascalCase in file names
        if (/[A-Z]/.test(fileName) && !fileName.includes("-")) {
          issues.push({
            file: filePath,
            line: 1,
            type: "naming-convention",
            severity: "warning",
            message: `File name should use kebab-case: ${fileName}`,
            suggestion: `Rename to ${fileName.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "")}`
          });
        }
        
        return issues;
      }
    }
  ];

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyRoutes = args.includes("--routes");
    this.onlyImports = args.includes("--imports");
    this.onlySize = args.includes("--size");
    this.onlyNaming = args.includes("--naming");
  }

  public async analyze(): Promise<void> {
    if (!this.ciMode) {
      console.log("🏗️  ARCHITECTURE VALIDATOR");
      console.log("=========================");
      console.log("");
    }

    const startTime = Date.now();

    // Get list of files to analyze
    const files = await this.getFilesToAnalyze();
    
    if (this.verbose && !this.ciMode) {
      console.log(`📁 Analyzing ${files.length} files...`);
    }

    // Analyze each file
    for (const file of files) {
      await this.analyzeFile(file);
    }

    const duration = Date.now() - startTime;

    if (!this.ciMode) {
      this.displayResults(duration);
    }

    // Exit with appropriate code for CI
    if (this.ciMode) {
      const criticalIssues = this.issues.filter((issue) => issue.severity === "critical");
      
      if (criticalIssues.length > 0) {
        console.error(`Critical architecture violations found: ${criticalIssues.length} issues`);
        process.exit(1);
      } else {
        const warnings = this.issues.filter((issue) => issue.severity === "warning").length;
        const infos = this.issues.filter((issue) => issue.severity === "info").length;
        console.log(`✅ No critical architecture violations found (${warnings} warnings, ${infos} info)`);
        process.exit(0);
      }
    }
  }

  private async getFilesToAnalyze(): Promise<string[]> {
    try {
      // Focus on TypeScript/JavaScript files in src directory
      const files = execSync(
        'find ./src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v __tests__ | grep -v node_modules | head -150',
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      return files;
    } catch (error) {
      if (this.verbose) {
        console.error("Error getting files to analyze:", error);
      }
      return [];
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = execSync(`cat "${filePath}"`, { encoding: "utf8" });
      
      for (const rule of this.rules) {
        // Skip rules based on CLI flags
        if (this.onlyRoutes && rule.type !== "route-structure") continue;
        if (this.onlyImports && rule.type !== "import-path") continue;
        if (this.onlySize && rule.type !== "file-size") continue;
        if (this.onlyNaming && rule.type !== "naming-convention") continue;

        const ruleIssues = rule.check(filePath, content);
        this.issues.push(...ruleIssues);
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Error analyzing ${filePath}:`, error);
      }
    }
  }

  private displayResults(duration: number): void {
    const issuesByType = this.groupIssuesByType();
    const issuesBySeverity = this.groupIssuesBySeverity();

    // Display route structure issues
    if (issuesByType["route-structure"] && issuesByType["route-structure"].length > 0 && !this.onlyImports && !this.onlySize && !this.onlyNaming) {
      console.log("🚨 ROUTE STRUCTURE VIOLATIONS:");
      const routeIssues = issuesByType["route-structure"].slice(0, 5);
      for (const issue of routeIssues) {
        const icon = issue.severity === "critical" ? "❌" : "⚠️ ";
        console.log(`   ${icon} ${issue.file}:${issue.line} - ${issue.message}`);
        if (this.verbose && issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      }
      if (issuesByType["route-structure"].length > 5) {
        console.log(`   ... and ${issuesByType["route-structure"].length - 5} more`);
      }
      console.log("");
    }

    // Display import path issues
    if (issuesByType["import-path"] && issuesByType["import-path"].length > 0 && !this.onlyRoutes && !this.onlySize && !this.onlyNaming) {
      console.log("📦 IMPORT PATH VIOLATIONS:");
      const importIssues = issuesByType["import-path"].slice(0, 5);
      for (const issue of importIssues) {
        console.log(`   ❌ ${issue.file}:${issue.line} - ${issue.message}`);
        if (this.verbose && issue.context) {
          console.log(`      Context: ${issue.context}`);
        }
      }
      if (issuesByType["import-path"].length > 5) {
        console.log(`   ... and ${issuesByType["import-path"].length - 5} more`);
      }
      console.log("");
    }

    // Display file size issues
    if (issuesByType["file-size"] && issuesByType["file-size"].length > 0 && !this.onlyRoutes && !this.onlyImports && !this.onlyNaming) {
      console.log("📏 FILE SIZE ANALYSIS:");
      const criticalSize = issuesByType["file-size"].filter(i => i.severity === "critical").length;
      const warningSize = issuesByType["file-size"].filter(i => i.severity === "warning").length;
      const infoSize = issuesByType["file-size"].filter(i => i.severity === "info").length;

      if (criticalSize > 0) console.log(`   ❌ ${criticalSize} very large files (>800 lines)`);
      if (warningSize > 0) console.log(`   ⚠️  ${warningSize} large files (400-800 lines)`);
      if (infoSize > 0) console.log(`   ℹ️  ${infoSize} medium-large files (200-400 lines)`);

      if (this.verbose) {
        const sizeIssues = issuesByType["file-size"].filter(i => i.severity === "critical").slice(0, 3);
        for (const issue of sizeIssues) {
          console.log(`      ${issue.file} - ${issue.message}`);
        }
      }
      console.log("");
    }

    // Display naming convention issues
    if (issuesByType["naming-convention"] && issuesByType["naming-convention"].length > 0 && !this.onlyRoutes && !this.onlyImports && !this.onlySize) {
      console.log("🏷️  NAMING CONVENTIONS:");
      console.log(`   ⚠️  ${issuesByType["naming-convention"].length} naming violations found`);
      if (this.verbose) {
        const namingIssues = issuesByType["naming-convention"].slice(0, 3);
        for (const issue of namingIssues) {
          console.log(`      ${issue.file} - ${issue.message}`);
        }
      }
      console.log("");
    }

    // Summary
    const totalIssues = this.issues.length;
    const criticalCount = issuesBySeverity.critical?.length || 0;
    const warningCount = issuesBySeverity.warning?.length || 0;
    const infoCount = issuesBySeverity.info?.length || 0;

    if (totalIssues === 0) {
      console.log("📊 ARCHITECTURE: EXCELLENT ✅");
    } else if (criticalCount > 0) {
      console.log("📊 ARCHITECTURE: CRITICAL VIOLATIONS ❌");
      console.log(`❌ ${criticalCount} critical violations found`);
    } else if (warningCount > 0) {
      console.log("📊 ARCHITECTURE: NEEDS REVIEW 🚨");
      console.log(`⚠️  ${warningCount} warnings found`);
    } else {
      console.log("📊 ARCHITECTURE: GOOD ✅");
      console.log(`ℹ️  ${infoCount} info items found`);
    }

    console.log(`🚨 ${criticalCount} critical, ⚠️  ${warningCount} warnings, ℹ️  ${infoCount} info`);
    console.log(`⚡ Analysis completed in ${duration}ms`);

    if (this.verbose && totalIssues > 0) {
      console.log("\n📝 DETAILED VIOLATIONS:");
      for (const issue of this.issues.slice(0, 10)) {
        const severityIcon = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
        console.log(`   ${severityIcon} ${issue.file}:${issue.line} - ${issue.type}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      }
      if (totalIssues > 10) {
        console.log(`   ... and ${totalIssues - 10} more issues`);
      }
    }
  }

  private groupIssuesByType(): Record<string, ArchitectureIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, ArchitectureIssue[]>);
  }

  private groupIssuesBySeverity(): Record<string, ArchitectureIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, ArchitectureIssue[]>);
  }
}

// Run the validator
const validator = new ArchitectureValidator();
validator.analyze().catch((error) => {
  console.error("Architecture validation failed:", error);
  process.exit(1);
});