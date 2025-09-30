#!/usr/bin/env tsx

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "child_process";
import { type Colors, colors, SharedCodeAnalyzer } from "./lib/code-analyzer-shared";

type UsageResult = {
  element: string;
  file: string;
  line: number;
  usageType: "used" | "unused" | "docs-only";
  usages: Array<{
    file: string;
    line: number;
    context: string;
    type: "code" | "docs";
  }>;
};

class UsageChecker extends SharedCodeAnalyzer {
  private results: UsageResult[] = [];
  private checkedItems = 0;

  constructor(
    verbose = false,
    jsonOutput = false,
  ) {
    super(verbose, jsonOutput);
  }

  private findCodeUsages(searchTerm: string, originFile?: string): Array<{
    file: string;
    line: number;
    context: string;
  }> {
    const usages: Array<{ file: string; line: number; context: string }> = [];

    try {
      // Check for React component usage first (JSX)
      const isComponent = /^[A-Z][A-Za-z0-9]*$/.test(searchTerm);
      
      if (isComponent) {
        try {
          const jsxPattern = `<${searchTerm}(?:\\s|>|/)`;
          const jsxResult = execSync(
            `rg "${jsxPattern}" ${this.srcPath} --glob "*.tsx" --glob "*.ts" -n`,
            { encoding: "utf8", stdio: "pipe" }
          );
          
          for (const line of jsxResult.trim().split("\n")) {
            if (line) {
              const [filePath, lineNum, ...contextParts] = line.split(":");
              if (filePath !== originFile) {
                usages.push({
                  file: filePath,
                  line: parseInt(lineNum, 10) || 0,
                  context: contextParts.join(":").trim(),
                });
              }
            }
          }
        } catch {
          // No JSX usage found, continue to regular search
        }
      }

      // For non-JSX usage, be more restrictive to avoid false positives
      // Only count usage if it's not in comments and looks like actual code usage
      const wordBoundaryPattern = `\\b${searchTerm}\\b`;
      const result = execSync(
        `rg "${wordBoundaryPattern}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" -n`,
        { encoding: "utf8", stdio: "pipe" }
      );

      for (const line of result.trim().split("\n")) {
        if (line) {
          const [filePath, lineNum, ...contextParts] = line.split(":");
          if (filePath !== originFile) {
            const context = contextParts.join(":").trim();
            
            // Skip comments and documentation-like lines
            if (context.includes("//") || context.includes("/*") || context.includes("*/") ||
                context.includes("@param") || context.includes("@returns") ||
                context.includes("TODO") || context.includes("FIXME")) {
              continue;
            }
            
            // Avoid duplicates from JSX search
            if (!usages.some(u => u.file === filePath && u.line === parseInt(lineNum, 10) && u.context === context)) {
              usages.push({
                file: filePath,
                line: parseInt(lineNum, 10) || 0,
                context,
              });
            }
          }
        }
      }
    } catch (error) {
      this.verboseLog(`No code usages found for "${searchTerm}"`);
    }

    return usages;
  }

  private findDocsUsages(searchTerm: string): Array<{
    file: string;
    line: number;
    context: string;
  }> {
    const usages: Array<{ file: string; line: number; context: string }> = [];

    try {
      const result = execSync(
        `rg "\\b${searchTerm}\\b" . --glob "*.md" --glob "!docs/refactoring-reports/**" --glob "!docs/context/**" -n`,
        { encoding: "utf8", stdio: "pipe" }
      );

      for (const line of result.trim().split("\n")) {
        if (line) {
          const [filePath, lineNum, ...contextParts] = line.split(":");
          usages.push({
            file: filePath,
            line: parseInt(lineNum, 10) || 0,
            context: contextParts.join(":").trim(),
          });
        }
      }
    } catch (error) {
      this.verboseLog(`No docs usages found for "${searchTerm}"`);
    }

    return usages;
  }

  private checkFileImports(originFile: string): boolean {
    try {
      // Get the relative path from src for import checking
      const relativePath = originFile.replace(/^.*\/src\//, "").replace(/\.tsx?$/, "");
      
      // Simple approach: search for the literal path in import statements
      // Using fixed strings instead of complex regex
      try {
        const result = execSync(
          `rg "@/${relativePath}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" -l`,
          { encoding: "utf8", stdio: "pipe" }
        );
        const matchingFiles = result.trim().split("\n").filter(file => file !== originFile && file.length > 0);
        if (this.verbose) {
          this.verboseLog(`Found matches for @/${relativePath}: ${matchingFiles.join(", ")}`, "dim");
        }
        if (matchingFiles.length > 0) {
          return true;
        }
      } catch {
        // No matches for @/ prefix
      }
      
      // Also check for relative imports (less common but possible)
      try {
        const result = execSync(
          `rg "${relativePath}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" -l`,
          { encoding: "utf8", stdio: "pipe" }
        );
        const matchingFiles = result.trim().split("\n").filter(file => file !== originFile && file.length > 0);
        if (this.verbose) {
          this.verboseLog(`Found matches for ${relativePath}: ${matchingFiles.join(", ")}`, "dim");
        }
        if (matchingFiles.length > 0) {
          return true;
        }
      } catch {
        // No matches
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private checkImportUsage(elementName: string, originFile: string): boolean {
    try {
      // Get the relative path from src for import checking
      const relativePath = originFile.replace(/^.*\/src\//, "").replace(/\.tsx?$/, "");
      
      // Check for direct imports of this element from this file
      const importPattern = `import.*\\b${elementName}\\b.*from.*["'].*${relativePath}["']`;
      const result = execSync(
        `rg "${importPattern}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" -l`,
        { encoding: "utf8", stdio: "pipe" }
      );

      const matchingFiles = result.trim().split("\n").filter(file => file !== originFile && file.length > 0);
      return matchingFiles.length > 0;
    } catch {
      return false;
    }
  }

  private checkUsage(searchTerm: string, originFile?: string): UsageResult {
    this.checkedItems++;
    
    if (this.verbose) {
      process.stdout.write(`\r${colors.dim}Checked: ${this.checkedItems} items${colors.reset}`);
    }

    // For file-based analysis, the key question is: "Is this file imported anywhere?"
    let fileIsImported = false;
    if (originFile) {
      fileIsImported = this.checkFileImports(originFile);
    }

    // Individual element import check (less important for file analysis)
    let foundInElementImports = false;
    if (originFile) {
      foundInElementImports = this.checkImportUsage(searchTerm, originFile);
    }

    const codeUsages = this.findCodeUsages(searchTerm, originFile);
    const docsUsages = this.findDocsUsages(searchTerm);

    // Filter out usages from the same file for file-based analysis
    const externalCodeUsages = originFile 
      ? codeUsages.filter(usage => !usage.file.endsWith(originFile.split('/').pop() || ''))
      : codeUsages;

    let usageType: "used" | "unused" | "docs-only" = "unused";
    
    // Priority order: file imports > element imports > external usages
    if (fileIsImported || foundInElementImports || externalCodeUsages.length > 0) {
      usageType = "used";
    } else if (docsUsages.length > 0) {
      usageType = "docs-only";
    }

    return {
      element: searchTerm,
      file: originFile || "manual-search",
      line: originFile ? this.getLineNumber(readFileSync(originFile, "utf8"), searchTerm) : 0,
      usageType,
      usages: [
        ...externalCodeUsages.map(u => ({ ...u, type: "code" as const })),
        ...docsUsages.map(u => ({ ...u, type: "docs" as const }))
      ],
    };
  }

  private processFile(filePath: string): UsageResult[] {
    const resolvedPath = resolve(filePath);
    
    if (!existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.verboseLog(`📁 Analyzing file: ${resolvedPath}`, "blue");

    const content = readFileSync(resolvedPath, "utf8");
    const elements = this.extractCodeElements(resolvedPath, content);

    this.verboseLog(`Found ${elements.length} exportable elements`, "dim");

    const results: UsageResult[] = [];

    for (const element of elements) {
      this.verboseLog(`Checking: ${element}`, "dim");
      const result = this.checkUsage(element, resolvedPath);
      results.push(result);
    }

    return results;
  }

  private outputJson(): void {
    const used = this.results.filter(r => r.usageType === "used");
    const docsOnly = this.results.filter(r => r.usageType === "docs-only");
    const unused = this.results.filter(r => r.usageType === "unused");

    const result = {
      summary: {
        totalChecked: this.checkedItems,
        used: used.length,
        docsOnly: docsOnly.length,
        unused: unused.length,
        healthScore: this.getHealthScore(unused.length, this.checkedItems),
      },
      results: this.results.map((item) => ({
        element: item.element,
        file: item.file.replace("./src/", ""),
        line: item.line,
        usageType: item.usageType,
        usageCount: item.usages.length,
        usages: item.usages.slice(0, 10).map(u => ({
          file: u.file.replace("./src/", ""),
          line: u.line,
          type: u.type,
          context: u.context.substring(0, 100)
        }))
      })),
    };

    console.log(JSON.stringify(result, null, 2));
  }

  private reportResults(): void {
    if (this.jsonOutput) {
      this.outputJson();
      return;
    }

    // Clear progress line
    process.stdout.write("\r" + " ".repeat(60) + "\r");

    this.log(`📊 Usage Analysis Complete!`, "green");
    this.log(`Total items analyzed: ${this.checkedItems}`, "dim");

    // File-level import check (most important for file analysis)
    const fileResult = this.results[0];
    if (fileResult && fileResult.file !== "manual-search") {
      const fileIsImported = this.checkFileImports(fileResult.file);
      if (fileIsImported) {
        this.log(`\n🔗 FILE IMPORT STATUS: This file IS imported elsewhere`, "green");
      } else {
        this.log(`\n🔗 FILE IMPORT STATUS: This file is NOT imported anywhere`, "red");
        this.log(`   The entire file can likely be removed`, "dim");
      }
    }

    const used = this.results.filter(r => r.usageType === "used");
    const docsOnly = this.results.filter(r => r.usageType === "docs-only");
    const unused = this.results.filter(r => r.usageType === "unused");

    if (this.results.length === 0) {
      this.log("\n🎉 No exportable elements found to analyze.", "green");
      return;
    }

    // Display results by category
    if (unused.length > 0) {
      this.log(`\n🚨 COMPLETELY UNUSED (${unused.length}):`, "red");
      this.log("   These items are not used anywhere in code or documentation\n");
      
      for (const item of unused) {
        this.log(`❌ ${item.element}`, "red");
        if (item.file !== "manual-search") {
          this.log(`   📁 ${item.file} (line ${item.line})`, "dim");
        }
      }
    }

    if (docsOnly.length > 0) {
      this.log(`\n📚 ONLY USED IN DOCUMENTATION (${docsOnly.length}):`, "yellow");
      this.log("   These items are referenced in .md files but not used in code\n");
      
      for (const item of docsOnly) {
        this.log(`📖 ${item.element}`, "yellow");
        if (item.file !== "manual-search") {
          this.log(`   📁 ${item.file} (line ${item.line})`, "dim");
        }
        this.log(`   📝 Found in ${item.usages.length} documentation file(s)`, "dim");
      }
    }

    if (used.length > 0) {
      this.log(`\n✅ ACTIVELY USED (${used.length}):`, "green");
      this.log("   These items are used in code\n");
      
      for (const item of used.slice(0, 5)) { // Show first 5
        this.log(`✅ ${item.element}`, "green");
        if (item.file !== "manual-search") {
          this.log(`   📁 ${item.file} (line ${item.line})`, "dim");
        }
        this.log(`   🔍 Found ${item.usages.length} usage(s)`, "dim");
        
        // Show a few usage examples
        const codeUsages = item.usages.filter(u => u.type === "code").slice(0, 3);
        for (const usage of codeUsages) {
          const truncatedContext = usage.context.length > 60 ? 
            usage.context.substring(0, 60) + "..." : usage.context;
          this.log(`     ${usage.file}:${usage.line} - ${truncatedContext}`, "dim");
        }
      }
      
      if (used.length > 5) {
        this.log(`   ... and ${used.length - 5} more used items`, "dim");
      }
    }

    this.printSummary();
  }

  private printSummary(): void {
    const used = this.results.filter(r => r.usageType === "used");
    const docsOnly = this.results.filter(r => r.usageType === "docs-only");
    const unused = this.results.filter(r => r.usageType === "unused");

    this.log("\n📊 ANALYSIS SUMMARY", "green");
    this.log("━".repeat(50), "dim");

    if (this.results.length === 0) {
      this.log("🎉 No exportable elements found to analyze", "green");
      return;
    }

    this.log(`✅ Used in code: ${used.length}`, "green");
    this.log(`📖 Only in docs: ${docsOnly.length}`, "yellow");
    this.log(`❌ Completely unused: ${unused.length}`, "red");

    // Health assessment
    const healthScore = this.getHealthScore(unused.length, this.results.length);
    this.log(`\n📈 USAGE HEALTH: ${healthScore}`, "green");

    if (unused.length > 0) {
      this.log("\n💡 RECOMMENDATIONS:", "yellow");
      this.log("   1. Red items (❌) are safe to remove", "dim");
      this.log("   2. Run tests after removal to ensure nothing breaks", "dim");
      this.log("   3. Consider if docs-only items should remain for reference", "dim");
    }

    this.log("\n" + "━".repeat(50), "dim");
  }

  private getHealthScore(unusedCount: number, totalCount: number): string {
    if (totalCount === 0) return "EXCELLENT 🎉";
    
    const percentage = (unusedCount / totalCount) * 100;
    
    if (percentage === 0) return "EXCELLENT 🎉";
    if (percentage < 10) return "VERY GOOD 👍";
    if (percentage < 25) return "GOOD ✅";
    if (percentage < 50) return "NEEDS ATTENTION ⚠️";
    return "NEEDS MAJOR CLEANUP 🚨";
  }

  public checkFile(filePath: string): void {
    this.results = this.processFile(filePath);
  }

  // Simplified method that only checks file-level imports
  public checkFileImportOnly(filePath: string): boolean {
    const resolvedPath = resolve(filePath);
    
    if (!existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return this.checkFileImports(resolvedPath);
  }

  public checkString(searchTerm: string): void {
    this.verboseLog(`🔍 Searching for: "${searchTerm}"`, "blue");
    const result = this.checkUsage(searchTerm);
    this.results = [result];
  }

  public async run(): Promise<void> {
    if (!this.validateEnvironment()) {
      process.exit(1);
    }

    if (!this.verbose && !this.jsonOutput) {
      this.log("🔍 Analyzing usage patterns...", "blue");
    }

    const startTime = Date.now();
    this.reportResults();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    this.verboseLog(`\nAnalysis completed in ${duration}s`, "dim");
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");
const jsonOutput = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const importOnly = args.includes("--import-only") || args.includes("--imports");

// Get the search target
const fileFlag = args.findIndex(arg => arg === "--file" || arg === "-f");
const stringFlag = args.findIndex(arg => arg === "--string" || arg === "-s");

if (showHelp || args.length === 0) {
  console.log(`
🔍 Usage Checker

USAGE:
  npx tsx scripts/check-usage.ts [OPTIONS] <TARGET>

OPTIONS:
  --file, -f <path>     Check all exports in a specific file
  --string, -s <name>   Check usage of a specific string/element
  --import-only         Only check if file is imported (fastest, most accurate)
  --verbose, -v         Show detailed progress and analysis
  --json               Output results as JSON (for CI/automation)
  --help, -h           Show this help message

EXAMPLES:
  # Check if a file is imported anywhere (recommended)
  pnpm check-usage --file src/components/upgrade-prompt.tsx --import-only
  
  # Full analysis of a file (slower, may have false positives)
  pnpm check-usage --file src/components/upgrade-prompt.tsx
  
  # Check a specific string/component
  pnpm check-usage --string UpgradePrompt
  
  # Verbose output
  pnpm check-usage --file path/to/file.tsx --verbose

OUTPUT:
  ✅ GREEN - Used in code (actively referenced)
  📖 YELLOW - Only in documentation (review needed)
  ❌ RED - Completely unused (safe to remove)

HEALTH SCORES:
  🎉 EXCELLENT - No unused code
  👍 VERY GOOD - <10% unused
  ✅ GOOD - <25% unused  
  ⚠️ NEEDS ATTENTION - <50% unused
  🚨 NEEDS MAJOR CLEANUP - ≥50% unused
  `);
  process.exit(0);
}

const checker = new UsageChecker(verbose, jsonOutput);

try {
  if (fileFlag !== -1 && args[fileFlag + 1]) {
    // Check file mode
    const filePath = args[fileFlag + 1];
    
    if (importOnly) {
      // Simple import-only check
      const isImported = checker.checkFileImportOnly(filePath);
      if (jsonOutput) {
        console.log(JSON.stringify({ 
          file: filePath, 
          imported: isImported,
          status: isImported ? "used" : "unused"
        }, null, 2));
      } else {
        const relativePath = filePath.replace(/^.*\/src\//, "");
        if (isImported) {
          console.log(`🔗 ${relativePath} IS imported elsewhere ✅`);
          console.log(`   File is actively used in the codebase`);
        } else {
          console.log(`🔗 ${relativePath} is NOT imported anywhere ❌`);
          console.log(`   File can likely be safely removed`);
        }
      }
      process.exit(0);
    } else {
      checker.checkFile(filePath);
    }
  } else if (stringFlag !== -1 && args[stringFlag + 1]) {
    // Check string mode
    const searchString = args[stringFlag + 1];
    checker.checkString(searchString);
  } else {
    // Try to infer from the first non-flag argument
    const target = args.find(arg => !arg.startsWith("--") && !arg.startsWith("-"));
    if (target) {
      if (target.includes("/") || target.includes(".")) {
        // Looks like a file path
        if (importOnly) {
          const isImported = checker.checkFileImportOnly(target);
          const relativePath = target.replace(/^.*\/src\//, "");
          if (isImported) {
            console.log(`🔗 ${relativePath} IS imported elsewhere ✅`);
          } else {
            console.log(`🔗 ${relativePath} is NOT imported anywhere ❌`);
          }
          process.exit(0);
        } else {
          checker.checkFile(target);
        }
      } else {
        // Looks like a string search
        checker.checkString(target);
      }
    } else {
      console.error("❌ Error: Please specify either --file <path> or --string <name>");
      console.error("Use --help for usage examples");
      process.exit(1);
    }
  }

  checker.run().catch((error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`❌ Error: ${(error as Error).message}`);
  process.exit(1);
}