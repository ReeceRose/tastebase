#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

type ImportNode = {
  file: string;
  imports: string[];
  exports: string[];
};

type ImportViolation = {
  file: string;
  line: number;
  type: "circular" | "relative" | "unused" | "long-chain";
  severity: "error" | "warning" | "info";
  content: string;
  suggestion: string;
};

type CircularDependency = {
  chain: string[];
  severity: "error" | "warning";
};

class ImportAnalyzer {
  private importGraph = new Map<string, ImportNode>();
  private violations: ImportViolation[] = [];
  private circularDeps: CircularDependency[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyCircular = false;
  private onlyRelative = false;
  private onlyUnused = false;

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyCircular = args.includes("--circular");
    this.onlyRelative = args.includes("--relative");
    this.onlyUnused = args.includes("--unused");
  }

  public async analyze(): Promise<void> {
    if (!this.ciMode) {
      console.log("🔄 IMPORT ANALYZER");
      console.log("==================");
      console.log("");
    }

    const startTime = Date.now();

    // Build import graph
    await this.buildImportGraph();

    // Run requested analyses
    if (!this.onlyRelative && !this.onlyUnused) {
      this.detectCircularDependencies();
    }

    if (!this.onlyCircular && !this.onlyUnused) {
      this.findRelativeImportViolations();
    }

    if (!this.onlyCircular && !this.onlyRelative) {
      this.findUnusedImports();
    }

    const duration = Date.now() - startTime;

    if (!this.ciMode) {
      this.displayResults(duration);
    }

    // Exit with appropriate code for CI
    if (this.ciMode) {
      const errors = this.violations.filter((v) => v.severity === "error").length;
      const circularErrors = this.circularDeps.filter((c) => c.severity === "error").length;
      
      if (errors > 0 || circularErrors > 0) {
        console.error(`Import issues found: ${errors} violations, ${circularErrors} circular dependencies`);
        process.exit(1);
      } else {
        console.log("✅ No critical import issues found");
        process.exit(0);
      }
    }
  }

  private async buildImportGraph(): Promise<void> {
    try {
      // Find all TypeScript/JavaScript files
      const files = execSync(
        'find ./src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v __tests__ | head -100',
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      if (this.verbose) {
        console.log(`📂 Analyzing ${files.length} files...`);
      }

      for (const file of files) {
        const node = this.parseFileImports(file);
        if (node) {
          this.importGraph.set(file, node);
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.error("Error building import graph:", error);
      }
    }
  }

  private parseFileImports(filePath: string): ImportNode | null {
    try {
      const content = execSync(`cat "${filePath}"`, { encoding: "utf8" });
      const imports: string[] = [];
      const exports: string[] = [];

      // Extract import statements
      const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Extract dynamic imports
      const dynamicImportRegex = /import\s*\(\s*['"']([^'"]+)['"']\s*\)/g;
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Extract require statements
      const requireRegex = /require\s*\(\s*['"']([^'"]+)['"']\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Extract export statements (for unused import detection)
      const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|type|interface)\s+(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }

      return {
        file: filePath,
        imports: [...new Set(imports)], // Remove duplicates
        exports: [...new Set(exports)],
      };
    } catch (error) {
      if (this.verbose) {
        console.error(`Error parsing ${filePath}:`, error);
      }
      return null;
    }
  }

  private detectCircularDependencies(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const cycles: CircularDependency[] = [];

    const dfs = (file: string, path: string[]): void => {
      if (visiting.has(file)) {
        // Found a cycle
        const cycleStart = path.indexOf(file);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(file);
          const severity = cycle.length <= 3 ? "error" : "warning";
          cycles.push({ chain: cycle, severity });
        }
        return;
      }

      if (visited.has(file)) {
        return;
      }

      visiting.add(file);
      const node = this.importGraph.get(file);
      
      if (node) {
        for (const importPath of node.imports) {
          // Resolve relative imports to absolute paths
          const resolvedPath = this.resolveImportPath(file, importPath);
          if (resolvedPath && this.importGraph.has(resolvedPath)) {
            dfs(resolvedPath, [...path, file]);
          }
        }
      }

      visiting.delete(file);
      visited.add(file);
    };

    // Check each file for circular dependencies
    for (const file of this.importGraph.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    this.circularDeps = cycles;
  }

  private findRelativeImportViolations(): void {
    for (const [file, node] of this.importGraph) {
      const lines = this.getFileLines(file);
      
      for (const importPath of node.imports) {
        // Check for relative imports that should use @/ alias
        if (importPath.startsWith("../")) {
          const lineNumber = this.findImportLine(lines, importPath);
          const suggestion = this.suggestAliasImport(importPath);
          
          this.violations.push({
            file,
            line: lineNumber,
            type: "relative",
            severity: "warning",
            content: importPath,
            suggestion: suggestion || "Consider using @/ alias instead",
          });
        }

        // Check for long import chains (deep relative paths)
        if (importPath.includes("../") && importPath.split("../").length > 3) {
          const lineNumber = this.findImportLine(lines, importPath);
          
          this.violations.push({
            file,
            line: lineNumber,
            type: "long-chain",
            severity: "info",
            content: importPath,
            suggestion: "Consider using @/ alias or restructuring files",
          });
        }
      }
    }
  }

  private findUnusedImports(): void {
    for (const [file, node] of this.importGraph) {
      const fileContent = this.getFileContent(file);
      const lines = fileContent.split("\n");

      // Extract named imports from import statements
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle both regular and type imports: import { ... } and import type { ... }
        const namedImportMatch = line.match(/import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"'][^'"]+['"]/);
        
        if (namedImportMatch) {
          const isTypeOnlyImport = line.includes("import type");
          const namedImports = namedImportMatch[1]
            .split(",")
            .map((name) => {
              // Handle both "name" and "type name" patterns within destructuring
              const cleanName = name.trim().replace(/^type\s+/, "").split(" as ")[0].trim();
              return cleanName;
            })
            .filter(Boolean);

          for (const importName of namedImports) {
            // For mixed imports like `import { Component, type ComponentProps }`, 
            // we need to check if this specific import has 'type' prefix
            const hasTypePrefix = namedImportMatch[1].includes(`type ${importName}`);
            const isTypeImport = isTypeOnlyImport || hasTypePrefix;
            
            // Check if the import is used in the file
            const isUsed = this.isImportUsedInFile(fileContent, importName, line);
            
            if (!isUsed) {
              const displayName = isTypeImport ? `type ${importName}` : importName;
              this.violations.push({
                file,
                line: i + 1,
                type: "unused",
                severity: "info",
                content: displayName,
                suggestion: `Remove unused import '${displayName}'`,
              });
            }
          }
        }
      }
    }
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      // Handle relative imports
      const path = require("path");
      const currentDir = path.dirname(currentFile);
      const resolved = path.resolve(currentDir, importPath);
      
      // Try different extensions
      const extensions = [".ts", ".tsx", ".js", ".jsx"];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (existsSync(withExt)) {
          return withExt;
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexFile = path.join(resolved, `index${ext}`);
        if (existsSync(indexFile)) {
          return indexFile;
        }
      }
    }
    
    return null;
  }

  private getFileLines(filePath: string): string[] {
    try {
      const content = execSync(`cat "${filePath}"`, { encoding: "utf8" });
      return content.split("\n");
    } catch {
      return [];
    }
  }

  private getFileContent(filePath: string): string {
    try {
      return execSync(`cat "${filePath}"`, { encoding: "utf8" });
    } catch {
      return "";
    }
  }

  private findImportLine(lines: string[], importPath: string): number {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(importPath)) {
        return i + 1;
      }
    }
    return 1;
  }

  private suggestAliasImport(relativePath: string): string | null {
    // Simple heuristic to suggest @/ alias
    if (relativePath.includes("/src/")) {
      return relativePath.replace(/.*\/src\//, "@/");
    }
    
    // Count "../" to suggest appropriate @/ path
    const upLevels = (relativePath.match(/\.\.\//g) || []).length;
    if (upLevels >= 2) {
      const pathPart = relativePath.replace(/\.\.\/+/g, "");
      return `@/${pathPart}`;
    }
    
    return null;
  }

  private isImportUsedInFile(content: string, importName: string, importLine: string): boolean {
    // Remove the import line to avoid false positives
    const contentWithoutImport = content.replace(importLine, "");
    
    // Clean the import name (remove 'type ' prefix if it exists)
    const cleanImportName = importName.replace(/^type\s+/, "");
    
    // Check for usage patterns
    const usagePatterns = [
      new RegExp(`\\b${cleanImportName}\\b`, "g"), // General usage
      new RegExp(`<${cleanImportName}\\b`, "g"), // JSX usage
      new RegExp(`{${cleanImportName}}`, "g"), // Destructuring
      new RegExp(`:\\s*${cleanImportName}\\b`, "g"), // Type annotations
      new RegExp(`extends\\s+${cleanImportName}\\b`, "g"), // Interface extension
      new RegExp(`implements\\s+${cleanImportName}\\b`, "g"), // Class implementation
    ];

    const isUsed = usagePatterns.some((pattern) => pattern.test(contentWithoutImport));
    
    // Additional check for function parameter types (common in Next.js routes)
    if (!isUsed && cleanImportName === "NextRequest") {
      // Special case for NextRequest - it's often used as function parameter
      const functionParamPattern = new RegExp(`\\b\\w+:\\s*${cleanImportName}\\b`, "g");
      return functionParamPattern.test(contentWithoutImport);
    }
    
    return isUsed;
  }

  private displayResults(duration: number): void {
    const totalViolations = this.violations.length;
    const totalCircular = this.circularDeps.length;

    // Display circular dependencies
    if (this.circularDeps.length > 0 && (!this.onlyRelative && !this.onlyUnused)) {
      console.log("🔄 CIRCULAR DEPENDENCIES:");
      for (const cycle of this.circularDeps) {
        const icon = cycle.severity === "error" ? "❌" : "⚠️ ";
        const chainStr = cycle.chain.join(" → ");
        console.log(`   ${icon} ${chainStr}`);
      }
      console.log("");
    }

    // Group violations by type
    const violationsByType = this.violations.reduce(
      (acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Display relative import violations
    if (violationsByType.relative && (!this.onlyCircular && !this.onlyUnused)) {
      console.log("📁 RELATIVE IMPORT VIOLATIONS:");
      const relativeViolations = this.violations.filter((v) => v.type === "relative");
      for (const violation of relativeViolations.slice(0, 5)) {
        console.log(`   🔍 ${violation.file}:${violation.line} - ${violation.content}`);
        if (this.verbose) {
          console.log(`      💡 ${violation.suggestion}`);
        }
      }
      if (relativeViolations.length > 5) {
        console.log(`   ... and ${relativeViolations.length - 5} more`);
      }
      console.log("");
    }

    // Display unused imports
    if (violationsByType.unused && (!this.onlyCircular && !this.onlyRelative)) {
      console.log("🗑️  UNUSED IMPORTS:");
      const unusedViolations = this.violations.filter((v) => v.type === "unused");
      for (const violation of unusedViolations.slice(0, 5)) {
        console.log(`   📄 ${violation.file}:${violation.line} - ${violation.content}`);
      }
      if (unusedViolations.length > 5) {
        console.log(`   ... and ${unusedViolations.length - 5} more`);
      }
      console.log("");
    }

    // Display long chain violations
    if (violationsByType["long-chain"]) {
      console.log("🔗 LONG IMPORT CHAINS:");
      const longChainViolations = this.violations.filter((v) => v.type === "long-chain");
      for (const violation of longChainViolations.slice(0, 3)) {
        console.log(`   ⚠️  ${violation.file}:${violation.line} - ${violation.content}`);
      }
      if (longChainViolations.length > 3) {
        console.log(`   ... and ${longChainViolations.length - 3} more`);
      }
      console.log("");
    }

    // Summary
    if (totalCircular === 0 && totalViolations === 0) {
      console.log("📊 IMPORT HEALTH: EXCELLENT ✅");
      console.log(`⚡ Analysis completed in ${duration}ms`);
    } else {
      const errors = this.violations.filter((v) => v.severity === "error").length + 
                    this.circularDeps.filter((c) => c.severity === "error").length;
      const warnings = this.violations.filter((v) => v.severity === "warning").length + 
                      this.circularDeps.filter((c) => c.severity === "warning").length;
      
      if (errors > 0) {
        console.log("📊 IMPORT HEALTH: CRITICAL ISSUES ❌");
        console.log(`❌ ${errors} errors found`);
      } else if (warnings > 0) {
        console.log("📊 IMPORT HEALTH: NEEDS ATTENTION ⚠️");
        console.log(`⚠️  ${warnings} warnings found`);
      } else {
        console.log("📊 IMPORT HEALTH: GOOD ✅");
        console.log(`🔍 ${totalViolations} minor issues found`);
      }
      
      console.log(`🔄 ${totalCircular} circular dependencies`);
      console.log(`📁 ${violationsByType.relative || 0} relative import violations`);
      console.log(`🗑️  ${violationsByType.unused || 0} unused imports`);
      console.log(`⚡ Analysis completed in ${duration}ms`);
    }

    if (this.verbose && totalViolations > 0) {
      console.log("\n📝 DETAILED VIOLATIONS:");
      for (const violation of this.violations) {
        console.log(`   ${violation.file}:${violation.line} - ${violation.type}: ${violation.content}`);
        console.log(`      💡 ${violation.suggestion}`);
      }
    }
  }
}

// Run the analyzer
const analyzer = new ImportAnalyzer();
analyzer.analyze().catch((error) => {
  console.error("Analysis failed:", error);
  process.exit(1);
});