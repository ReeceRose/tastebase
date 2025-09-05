#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import path from "node:path";

type TestCoverageIssue = {
  file: string;
  type: "untested-function" | "untested-component" | "untested-action" | "missing-test-file" | "critical-path" | "test-quality";
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion?: string;
  context?: string;
  functionName?: string;
  lineNumber?: number;
};

type TestableFile = {
  path: string;
  type: "component" | "server-action" | "utility" | "hook" | "api-route";
  functions: string[];
  hasTests: boolean;
  testPath?: string;
  complexity: "low" | "medium" | "high";
  isCritical: boolean;
};

class TestCoverageAnalyzer {
  private issues: TestCoverageIssue[] = [];
  private testableFiles: TestableFile[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyUntested = false;
  private onlyCritical = false;
  private onlyComponents = false;
  private onlyActions = false;

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyUntested = args.includes("--untested");
    this.onlyCritical = args.includes("--critical");
    this.onlyComponents = args.includes("--components");
    this.onlyActions = args.includes("--actions");
  }

  public async analyze(): Promise<void> {
    if (!this.ciMode) {
      console.log("🧪 TEST COVERAGE ANALYZER");
      console.log("=========================");
      console.log("");
    }

    const startTime = Date.now();

    // Get all testable files
    const files = await this.getTestableFiles();
    
    if (this.verbose && !this.ciMode) {
      console.log(`📁 Analyzing ${files.length} testable files...`);
    }

    // Analyze each file for test coverage
    for (const file of files) {
      await this.analyzeFile(file);
    }

    // Check for test quality issues
    await this.analyzeTestQuality();

    const duration = Date.now() - startTime;

    if (!this.ciMode) {
      this.displayResults(duration);
    }

    // Exit with appropriate code for CI
    if (this.ciMode) {
      const criticalIssues = this.issues.filter((issue) => issue.severity === "critical");
      const criticalUntested = this.testableFiles.filter(f => f.isCritical && !f.hasTests).length;
      
      if (criticalIssues.length > 0 || criticalUntested > 0) {
        console.error(`Critical test coverage gaps found: ${criticalIssues.length + criticalUntested} issues`);
        process.exit(1);
      } else {
        const warnings = this.issues.filter((issue) => issue.severity === "warning").length;
        const infos = this.issues.filter((issue) => issue.severity === "info").length;
        console.log(`✅ No critical test coverage gaps (${warnings} warnings, ${infos} info)`);
        process.exit(0);
      }
    }
  }

  private async getTestableFiles(): Promise<string[]> {
    try {
      // Find all TypeScript/JavaScript files that should have tests
      const files = execSync(
        'find ./src -type f \\( -name "*.ts" -o -name "*.tsx" \\) | grep -v __tests__ | grep -v \\.test\\. | grep -v \\.spec\\. | grep -v node_modules | head -100',
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      return files;
    } catch (error) {
      if (this.verbose) {
        console.error("Error getting testable files:", error);
      }
      return [];
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = execSync(`cat "${filePath}"`, { encoding: "utf8" });
      const testableFile = this.categorizeFile(filePath, content);
      
      if (testableFile) {
        this.testableFiles.push(testableFile);
        
        // Check if file has corresponding test
        const hasTest = await this.hasTestFile(filePath);
        testableFile.hasTests = hasTest;

        if (hasTest) {
          testableFile.testPath = this.getTestFilePath(filePath);
        }

        // Generate issues based on analysis
        this.generateCoverageIssues(testableFile);
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Error analyzing ${filePath}:`, error);
      }
    }
  }

  private categorizeFile(filePath: string, content: string): TestableFile | null {
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    
    // Skip certain file types
    if (fileName.includes(".d.ts") || fileName.includes("index.ts") || fileName.includes("schema")) {
      return null;
    }

    let type: TestableFile["type"];
    let isCritical = false;
    let complexity: TestableFile["complexity"] = "low";

    // Categorize file type
    if (filePath.includes("/components/") && fileName.endsWith(".tsx")) {
      type = "component";
      isCritical = this.isComponentCritical(content, filePath);
    } else if (filePath.includes("/server/") && fileName.includes("action")) {
      type = "server-action";
      isCritical = true; // All server actions are critical
    } else if (filePath.includes("/api/")) {
      type = "api-route";
      isCritical = true; // All API routes are critical
    } else if (filePath.includes("/hooks/")) {
      type = "hook";
      isCritical = this.isHookCritical(content);
    } else if (filePath.includes("/lib/") || filePath.includes("/utils/")) {
      type = "utility";
      isCritical = this.isUtilityCritical(content, filePath);
    } else {
      return null; // Skip non-testable files
    }

    // Analyze complexity
    const lines = content.split("\n").length;
    const functions = this.extractFunctions(content);
    
    if (lines > 200 || functions.length > 5) {
      complexity = "high";
    } else if (lines > 100 || functions.length > 3) {
      complexity = "medium";
    }

    return {
      path: filePath,
      type,
      functions,
      hasTests: false,
      complexity,
      isCritical
    };
  }

  private isComponentCritical(content: string, filePath: string): boolean {
    // Critical components: forms, data displays, user interactions
    const criticalPatterns = [
      /onSubmit|handleSubmit/,
      /useState|useEffect/,
      /form|Form/,
      /button|Button/,
      /input|Input/,
      /dialog|Dialog|Modal/,
      /\bauth\b|\bAuth\b/,
      /\bbilling\b|\bBilling\b/,
      /\bpayment\b|\bPayment\b/
    ];

    const isCriticalPath = filePath.includes("/billing/") || 
                          filePath.includes("/auth/") || 
                          filePath.includes("/payment/") ||
                          filePath.includes("/admin/");

    return isCriticalPath || criticalPatterns.some(pattern => pattern.test(content));
  }

  private isHookCritical(content: string): boolean {
    // Custom hooks with side effects are critical
    return /useEffect|useMutation|useQuery|fetch|axios/.test(content);
  }

  private isUtilityCritical(content: string, filePath: string): boolean {
    // Critical utilities: validation, security, data transformation
    const criticalPatterns = [
      /validate|Validate/,
      /auth|Auth/,
      /security|Security/,
      /encrypt|decrypt/,
      /hash|Hash/,
      /\bapi\b|\bAPI\b/,
      /transform|Transform/,
      /parse|Parse/
    ];

    const isCriticalPath = filePath.includes("/auth/") || 
                          filePath.includes("/security/") || 
                          filePath.includes("/validation/");

    return isCriticalPath || criticalPatterns.some(pattern => pattern.test(content));
  }

  private extractFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Extract function declarations and expressions
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
    }

    return functions;
  }

  private async hasTestFile(filePath: string): Promise<boolean> {
    const testPath = this.getTestFilePath(filePath);
    
    try {
      execSync(`test -f "${testPath}"`, { stdio: 'ignore' });
      return true;
    } catch {
      // Try alternative test locations
      const alternativeTestPaths = this.getAlternativeTestPaths(filePath);
      
      for (const altPath of alternativeTestPaths) {
        try {
          execSync(`test -f "${altPath}"`, { stdio: 'ignore' });
          return true;
        } catch {
          continue;
        }
      }
      
      return false;
    }
  }

  private getTestFilePath(filePath: string): string {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    return path.join(dir, `${baseName}.test${ext}`);
  }

  private getAlternativeTestPaths(filePath: string): string[] {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    return [
      path.join(dir, `${baseName}.spec${ext}`),
      path.join(dir, "__tests__", `${baseName}.test${ext}`),
      path.join(dir, "__tests__", `${baseName}.spec${ext}`),
      path.join("tests", filePath.replace("src/", "").replace(ext, `.test${ext}`))
    ];
  }

  private generateCoverageIssues(file: TestableFile): void {
    // Skip based on CLI flags
    if (this.onlyComponents && file.type !== "component") return;
    if (this.onlyActions && file.type !== "server-action") return;
    if (this.onlyCritical && !file.isCritical) return;
    if (this.onlyUntested && file.hasTests) return;

    if (!file.hasTests) {
      let severity: TestCoverageIssue["severity"] = "info";
      
      if (file.isCritical) {
        severity = "critical";
      } else if (file.complexity === "high" || file.functions.length > 3) {
        severity = "warning";
      }

      this.issues.push({
        file: file.path,
        type: "missing-test-file",
        severity,
        message: `No test file found for ${file.type}`,
        suggestion: `Create test file at ${this.getTestFilePath(file.path)}`,
        context: `${file.functions.length} functions, ${file.complexity} complexity`
      });
    }

    // Check for untested critical functions
    if (file.hasTests && file.isCritical) {
      // This would require parsing test files to see which functions are tested
      // For now, we'll assume if there's a test file, it's partially covered
      if (file.functions.length > 5) {
        this.issues.push({
          file: file.path,
          type: "critical-path",
          severity: "warning",
          message: `Large critical file may have incomplete test coverage`,
          suggestion: "Review test completeness for all exported functions",
          context: `${file.functions.length} functions in critical ${file.type}`
        });
      }
    }
  }

  private async analyzeTestQuality(): Promise<void> {
    try {
      // Find all test files
      const testFiles = execSync(
        'find ./src -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\) 2>/dev/null || true',
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      for (const testFile of testFiles) {
        await this.analyzeTestFile(testFile);
      }
    } catch (error) {
      if (this.verbose) {
        console.error("Error analyzing test files:", error);
      }
    }
  }

  private async analyzeTestFile(testPath: string): Promise<void> {
    try {
      const content = execSync(`cat "${testPath}"`, { encoding: "utf8" });
      
      // Check for basic test quality indicators
      const hasDescribe = /describe\s*\(/.test(content);
      const hasIt = /it\s*\(|test\s*\(/.test(content);
      const hasAssertions = /expect\s*\(/.test(content);
      const testCount = (content.match(/it\s*\(|test\s*\(/g) || []).length;
      
      if (!hasDescribe || !hasIt || !hasAssertions) {
        this.issues.push({
          file: testPath,
          type: "test-quality",
          severity: "warning",
          message: "Test file may be incomplete or malformed",
          suggestion: "Ensure test file has describe blocks, test cases, and assertions"
        });
      }
      
      if (testCount < 2) {
        this.issues.push({
          file: testPath,
          type: "test-quality",
          severity: "info",
          message: `Limited test coverage (${testCount} test${testCount !== 1 ? 's' : ''})`,
          suggestion: "Consider adding more comprehensive test cases"
        });
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Error analyzing test file ${testPath}:`, error);
      }
    }
  }

  private displayResults(duration: number): void {
    const issuesByType = this.groupIssuesByType();
    const issuesBySeverity = this.groupIssuesBySeverity();

    // Calculate coverage statistics
    const totalTestable = this.testableFiles.length;
    const testedFiles = this.testableFiles.filter(f => f.hasTests).length;
    const coveragePercent = totalTestable > 0 ? Math.round((testedFiles / totalTestable) * 100) : 0;
    
    const criticalFiles = this.testableFiles.filter(f => f.isCritical).length;
    const testedCritical = this.testableFiles.filter(f => f.isCritical && f.hasTests).length;
    const criticalCoveragePercent = criticalFiles > 0 ? Math.round((testedCritical / criticalFiles) * 100) : 0;

    // Display coverage overview
    console.log("📊 TEST COVERAGE OVERVIEW:");
    console.log(`   📁 Total testable files: ${totalTestable}`);
    console.log(`   ✅ Files with tests: ${testedFiles} (${coveragePercent}%)`);
    console.log(`   🚨 Critical files: ${criticalFiles}`);
    console.log(`   🛡️  Critical coverage: ${testedCritical}/${criticalFiles} (${criticalCoveragePercent}%)`);
    console.log("");

    // Display missing test files
    if (issuesByType["missing-test-file"] && issuesByType["missing-test-file"].length > 0) {
      console.log("🚫 MISSING TEST FILES:");
      const missingCritical = issuesByType["missing-test-file"].filter(i => i.severity === "critical").length;
      const missingWarning = issuesByType["missing-test-file"].filter(i => i.severity === "warning").length;
      const missingInfo = issuesByType["missing-test-file"].filter(i => i.severity === "info").length;

      if (missingCritical > 0) console.log(`   ❌ ${missingCritical} critical files without tests`);
      if (missingWarning > 0) console.log(`   ⚠️  ${missingWarning} complex files without tests`);
      if (missingInfo > 0) console.log(`   ℹ️  ${missingInfo} simple files without tests`);

      if (this.verbose) {
        const criticalMissing = issuesByType["missing-test-file"].filter(i => i.severity === "critical").slice(0, 5);
        for (const issue of criticalMissing) {
          console.log(`      ❌ ${issue.file} - ${issue.context}`);
        }
        if (missingCritical > 5) {
          console.log(`      ... and ${missingCritical - 5} more critical files`);
        }
      }
      console.log("");
    }

    // Display critical path issues
    if (issuesByType["critical-path"] && issuesByType["critical-path"].length > 0) {
      console.log("🎯 CRITICAL PATH COVERAGE:");
      console.log(`   ⚠️  ${issuesByType["critical-path"].length} critical files may have incomplete coverage`);
      if (this.verbose) {
        const criticalIssues = issuesByType["critical-path"].slice(0, 3);
        for (const issue of criticalIssues) {
          console.log(`      ${issue.file} - ${issue.context}`);
        }
      }
      console.log("");
    }

    // Display test quality issues
    if (issuesByType["test-quality"] && issuesByType["test-quality"].length > 0) {
      console.log("🧪 TEST QUALITY:");
      const qualityWarnings = issuesByType["test-quality"].filter(i => i.severity === "warning").length;
      const qualityInfo = issuesByType["test-quality"].filter(i => i.severity === "info").length;

      if (qualityWarnings > 0) console.log(`   ⚠️  ${qualityWarnings} test files with quality issues`);
      if (qualityInfo > 0) console.log(`   ℹ️  ${qualityInfo} test files with limited coverage`);
      console.log("");
    }

    // File type breakdown
    if (this.verbose) {
      console.log("📋 BREAKDOWN BY TYPE:");
      const byType = this.groupFilesByType();
      for (const [type, files] of Object.entries(byType)) {
        const tested = files.filter(f => f.hasTests).length;
        const coverage = files.length > 0 ? Math.round((tested / files.length) * 100) : 0;
        console.log(`   ${this.getTypeIcon(type)} ${type}: ${tested}/${files.length} (${coverage}%)`);
      }
      console.log("");
    }

    // Summary
    const totalIssues = this.issues.length;
    const criticalCount = issuesBySeverity.critical?.length || 0;
    const warningCount = issuesBySeverity.warning?.length || 0;
    const infoCount = issuesBySeverity.info?.length || 0;

    if (criticalCoveragePercent >= 90 && coveragePercent >= 70) {
      console.log("📊 TEST COVERAGE: EXCELLENT ✅");
    } else if (criticalCoveragePercent >= 70 && coveragePercent >= 50) {
      console.log("📊 TEST COVERAGE: GOOD ✅");
    } else if (criticalCoveragePercent >= 50) {
      console.log("📊 TEST COVERAGE: NEEDS IMPROVEMENT ⚠️");
    } else {
      console.log("📊 TEST COVERAGE: CRITICAL GAPS ❌");
    }

    console.log(`🚨 ${criticalCount} critical, ⚠️  ${warningCount} warnings, ℹ️  ${infoCount} info`);
    console.log(`⚡ Analysis completed in ${duration}ms`);

    if (this.verbose && totalIssues > 0) {
      console.log("\n📝 TOP PRIORITY ISSUES:");
      const priorityIssues = this.issues
        .filter(i => i.severity === "critical")
        .concat(this.issues.filter(i => i.severity === "warning"))
        .slice(0, 10);
        
      for (const issue of priorityIssues) {
        const severityIcon = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
        console.log(`   ${severityIcon} ${issue.file} - ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      }
      if (totalIssues > 10) {
        console.log(`   ... and ${totalIssues - 10} more issues`);
      }
    }
  }

  private getTypeIcon(type: string): string {
    const icons = {
      component: "🎨",
      "server-action": "⚡",
      "api-route": "🌐",
      hook: "🎣",
      utility: "🛠️"
    };
    return icons[type as keyof typeof icons] || "📄";
  }

  private groupIssuesByType(): Record<string, TestCoverageIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, TestCoverageIssue[]>);
  }

  private groupIssuesBySeverity(): Record<string, TestCoverageIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, TestCoverageIssue[]>);
  }

  private groupFilesByType(): Record<string, TestableFile[]> {
    return this.testableFiles.reduce((acc, file) => {
      acc[file.type] = acc[file.type] || [];
      acc[file.type].push(file);
      return acc;
    }, {} as Record<string, TestableFile[]>);
  }
}

// Run the analyzer
const analyzer = new TestCoverageAnalyzer();
analyzer.analyze().catch((error) => {
  console.error("Test coverage analysis failed:", error);
  process.exit(1);
});