#!/usr/bin/env tsx

import { execSync } from "node:child_process";

type HealthCheckResult = {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
  duration: number;
  critical: boolean;
  metrics?: {
    criticalIssues?: number;
    warningIssues?: number;
    infoIssues?: number;
    totalIssues?: number;
    coveragePercent?: number;
    filesAnalyzed?: number;
    keyFindings?: string[];
  };
};

type HealthCheckConfig = {
  name: string;
  script: string;
  critical: boolean;
  timeout: number;
  description: string;
  fullReportScript?: string;
};

class HealthChecker {
  private results: HealthCheckResult[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyFailed = false;
  private onlyCritical = false;
  private quick = false;
  private fullReport = false;

  private readonly checks: HealthCheckConfig[] = [
    {
      name: "Code Quality",
      script: "code-quality:ci",
      critical: true,
      timeout: 30000,
      description: "Check for debug code, TODOs, and type safety issues",
      fullReportScript: "code-quality:verbose"
    },
    {
      name: "Architecture",
      script: "architecture:ci",
      critical: true,
      timeout: 30000,
      description: "Validate architectural patterns and file organization",
      fullReportScript: "architecture:verbose"
    },
    {
      name: "Import Issues",
      script: "import-issues:ci",
      critical: true,
      timeout: 30000,
      description: "Detect circular dependencies and import violations",
      fullReportScript: "import-issues:verbose"
    },
    {
      name: "Page Server Logic",
      script: "page-server-logic:ci",
      critical: true,
      timeout: 30000,
      description: "Detect server logic in page files that should be extracted",
      fullReportScript: "page-server-logic:verbose"
    },
    {
      name: "Performance",
      script: "performance:ci",
      critical: false,
      timeout: 45000,
      description: "Analyze performance bottlenecks and optimizations",
      fullReportScript: "performance:verbose"
    },
    {
      name: "Test Coverage",
      script: "test-coverage:ci",
      critical: false,
      timeout: 45000,
      description: "Evaluate test coverage and identify gaps",
      fullReportScript: "test-coverage:verbose"
    },
    {
      name: "Unused Code",
      script: "unused-code:ci",
      critical: false,
      timeout: 60000,
      description: "Find unused exports, functions, and dead code",
      fullReportScript: "unused-code:verbose"
    }
  ];

  private readonly quickChecks: HealthCheckConfig[] = [
    {
      name: "Critical Code Quality",
      script: "code-quality:debug",
      critical: true,
      timeout: 15000,
      description: "Check only for debug code (console.log, debugger)"
    },
    {
      name: "Import Violations",
      script: "architecture:imports",
      critical: true,
      timeout: 15000,
      description: "Check for relative import violations"
    },
    {
      name: "Circular Dependencies",
      script: "import-issues:circular",
      critical: true,
      timeout: 15000,
      description: "Detect circular dependency issues"
    }
  ];

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyFailed = args.includes("--failed");
    this.onlyCritical = args.includes("--critical");
    this.quick = args.includes("--quick");
    this.fullReport = args.includes("--full-report");
  }

  public async runHealthChecks(): Promise<void> {
    const startTime = Date.now();
    const checksToRun = this.quick ? this.quickChecks : this.checks;

    if (!this.ciMode) {
      let title = "🏥 CODEBASE HEALTH CHECK";
      if (this.quick) {
        title = "🚀 QUICK HEALTH CHECK";
      } else if (this.fullReport) {
        title = "📋 COMPREHENSIVE HEALTH REPORT";
      }
      console.log(title);
      console.log("==========================================");
      console.log("");
    }

    // Run health checks
    for (const check of checksToRun) {
      // Skip non-critical checks if only-critical flag is set
      if (this.onlyCritical && !check.critical) {
        continue;
      }

      const result = await this.runCheck(check);
      this.results.push(result);

      if (!this.ciMode && this.verbose) {
        this.displayCheckResult(result);
      }
    }

    const totalDuration = Date.now() - startTime;

    if (!this.ciMode) {
      this.displaySummary(totalDuration);
    }

    // Handle CI exit codes
    if (this.ciMode) {
      const criticalFailures = this.results.filter(r => r.status === "fail" && r.critical);
      const totalFailures = this.results.filter(r => r.status === "fail");
      
      if (criticalFailures.length > 0) {
        console.error(`Critical health check failures: ${criticalFailures.length}`);
        criticalFailures.forEach(failure => {
          console.error(`❌ ${failure.name}: ${failure.message}`);
        });
        process.exit(1);
      } else if (totalFailures.length > 0) {
        console.log(`Non-critical health check failures: ${totalFailures.length}`);
        totalFailures.forEach(failure => {
          console.log(`⚠️  ${failure.name}: ${failure.message}`);
        });
        process.exit(0); // Don't fail CI for non-critical issues
      } else {
        console.log("✅ All health checks passed");
        process.exit(0);
      }
    }
  }

  private async runCheck(check: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    if (!this.ciMode && !this.verbose) {
      process.stdout.write(`${this.getStatusIcon("running")} ${check.name}...`);
    }

    try {
      // For full report mode, run the verbose version of the script to get detailed output
      const scriptToRun = this.fullReport && check.fullReportScript ? check.fullReportScript : check.script;
      
      const output = execSync(`pnpm run ${scriptToRun}`, {
        encoding: "utf8",
        timeout: check.timeout,
        stdio: "pipe"
      });

      const duration = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: check.name,
        status: "pass",
        message: "All checks passed",
        details: (this.verbose || this.fullReport) ? output : undefined,
        duration,
        critical: check.critical,
        metrics: this.extractMetrics(check.name, output)
      };

      if (!this.ciMode && !this.verbose) {
        process.stdout.write(`\r✅ ${check.name} (${duration}ms)\n`);
      }

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const isTimeout = error.signal === "SIGTERM";
      const status = check.critical ? "fail" : "warning";
      
      let message = "Check failed";
      if (isTimeout) {
        message = `Check timed out after ${check.timeout}ms`;
      } else if (error.stdout) {
        // Extract meaningful error message from output
        const output = error.stdout.toString();
        const lines = output.split("\n").filter((line: string) => line.trim());
        const errorLine = lines.find((line: string) => 
          line.includes("critical") || 
          line.includes("violations") || 
          line.includes("issues found") ||
          line.includes("failed")
        );
        if (errorLine) {
          message = errorLine.replace(/^\s*[❌⚠️🚨]\s*/, "").trim();
        }
      }

      const result: HealthCheckResult = {
        name: check.name,
        status,
        message,
        details: (this.verbose || this.fullReport) ? error.stdout?.toString() : undefined,
        duration,
        critical: check.critical,
        metrics: this.extractMetrics(check.name, error.stdout?.toString() || "")
      };

      if (!this.ciMode && !this.verbose) {
        const icon = check.critical ? "❌" : "⚠️ ";
        process.stdout.write(`\r${icon} ${check.name} (${duration}ms)\n`);
      }

      return result;
    }
  }

  private displayCheckResult(result: HealthCheckResult): void {
    const icon = this.getStatusIcon(result.status);
    const criticalBadge = result.critical ? " [CRITICAL]" : "";
    
    console.log(`${icon} ${result.name}${criticalBadge} (${result.duration}ms)`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      if (this.fullReport) {
        // Show complete details in full report mode
        console.log("");
        console.log(`━━━━ ${result.name.toUpperCase()} DETAILED REPORT ━━━━`);
        console.log(result.details);
        console.log(`━━━━ END ${result.name.toUpperCase()} REPORT ━━━━`);
      } else if (result.status !== "pass") {
        // Show first few lines of details for failures in verbose mode
        const lines = result.details.split("\n").slice(0, 5);
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`   ${line}`);
          }
        });
        if (result.details.split("\n").length > 5) {
          console.log(`   ... (truncated)`);
        }
      }
    }
    console.log("");
  }

  private displaySummary(totalDuration: number): void {
    const passed = this.results.filter(r => r.status === "pass").length;
    const failed = this.results.filter(r => r.status === "fail").length;
    const warnings = this.results.filter(r => r.status === "warning").length;
    const criticalFailed = this.results.filter(r => r.status === "fail" && r.critical).length;

    console.log("==========================================");
    console.log("📋 HEALTH CHECK SUMMARY");
    console.log("==========================================");
    console.log("");

    // Filter results for display
    let resultsToShow = this.results;
    if (this.onlyFailed) {
      resultsToShow = this.results.filter(r => r.status !== "pass");
    }
    if (this.onlyCritical) {
      resultsToShow = resultsToShow.filter(r => r.critical);
    }

    // Display individual results
    resultsToShow.forEach(result => {
      const icon = this.getStatusIcon(result.status);
      const criticalBadge = result.critical ? " 🔥" : "";
      const durationText = `${result.duration}ms`;
      
      console.log(`${icon} ${result.name}${criticalBadge} (${durationText})`);
      if (result.message !== "All checks passed" || result.status !== "pass") {
        console.log(`   ${result.message}`);
      }
      
      // Show full report details if enabled
      if (this.fullReport && result.details) {
        console.log("");
        console.log(`━━━━ ${result.name.toUpperCase()} DETAILED REPORT ━━━━`);
        console.log(result.details);
        console.log(`━━━━ END ${result.name.toUpperCase()} REPORT ━━━━`);
        console.log("");
      }
    });

    console.log("");
    console.log("==========================================");

    // Overall status
    if (criticalFailed > 0) {
      console.log("🚨 HEALTH STATUS: CRITICAL FAILURES");
      console.log(`❌ ${criticalFailed} critical check(s) failed`);
    } else if (failed > 0) {
      console.log("⚠️  HEALTH STATUS: NON-CRITICAL ISSUES");
      console.log(`⚠️  ${failed} non-critical check(s) failed`);
    } else if (warnings > 0) {
      console.log("✅ HEALTH STATUS: GOOD WITH WARNINGS");
      console.log(`⚠️  ${warnings} warning(s) found`);
    } else {
      console.log("✅ HEALTH STATUS: EXCELLENT");
      console.log("All health checks passed!");
    }

    console.log("");
    console.log(`📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    console.log(`⏱️  Total time: ${totalDuration}ms`);

    // Show performance breakdown if verbose
    if (this.verbose) {
      console.log("");
      console.log("⏱️  Performance Breakdown:");
      const sortedResults = [...this.results].sort((a, b) => b.duration - a.duration);
      sortedResults.forEach(result => {
        console.log(`   ${result.name}: ${result.duration}ms`);
      });
    }

    // Executive Summary for Full Report Mode
    if (this.fullReport) {
      this.displayExecutiveSummary();
    }

    // Suggestions
    if (failed > 0 || warnings > 0) {
      console.log("");
      console.log("💡 SUGGESTIONS:");
      if (criticalFailed > 0) {
        console.log("   • Fix critical issues before deploying to production");
        console.log("   • Run individual scripts with --verbose for detailed output");
      }
      if (failed > 0 || warnings > 0) {
        console.log("   • Consider running specific checks: pnpm run <script-name>");
        console.log("   • Use --verbose flag for detailed analysis");
      }
    }
  }

  private displayExecutiveSummary(): void {
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 EXECUTIVE SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    // Overall health metrics
    const totalCriticalIssues = this.results.reduce((sum, result) => sum + (result.metrics?.criticalIssues || 0), 0);
    const totalWarningIssues = this.results.reduce((sum, result) => sum + (result.metrics?.warningIssues || 0), 0);
    const totalInfoIssues = this.results.reduce((sum, result) => sum + (result.metrics?.infoIssues || 0), 0);
    const totalIssues = totalCriticalIssues + totalWarningIssues + totalInfoIssues;

    console.log("🎯 OVERALL HEALTH METRICS:");
    console.log(`   🚨 ${totalCriticalIssues} critical issues across all checks`);
    console.log(`   ⚠️  ${totalWarningIssues} warnings across all checks`);
    console.log(`   ℹ️  ${totalInfoIssues} info items across all checks`);
    console.log(`   📊 ${totalIssues} total issues identified`);
    console.log("");

    // Key findings by category
    console.log("🔍 KEY FINDINGS BY CATEGORY:");
    this.results.forEach(result => {
      if (result.metrics && result.metrics.keyFindings && result.metrics.keyFindings.length > 0) {
        const icon = this.getStatusIcon(result.status);
        console.log(`   ${icon} ${result.name}:`);
        result.metrics.keyFindings.forEach(finding => {
          console.log(`      • ${finding}`);
        });

        // Add specific metrics for key categories
        if (result.name === "Test Coverage" && result.metrics.coveragePercent !== undefined) {
          console.log(`      • Test coverage: ${result.metrics.coveragePercent}%`);
        }
        if (result.metrics.totalIssues && result.metrics.totalIssues > 0) {
          console.log(`      • ${result.metrics.totalIssues} issues found`);
        }
      }
    });

    console.log("");

    // Priority actions
    console.log("🚀 PRIORITY ACTIONS:");
    const criticalResults = this.results.filter(r => (r.metrics?.criticalIssues || 0) > 0);
    
    if (criticalResults.length > 0) {
      console.log("   🔥 CRITICAL (Fix Immediately):");
      criticalResults.forEach(result => {
        const criticalCount = result.metrics?.criticalIssues || 0;
        console.log(`      • ${result.name}: ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}`);
        if (result.metrics?.keyFindings && result.metrics.keyFindings.length > 0) {
          console.log(`        ${result.metrics.keyFindings[0]}`);
        }
      });
      console.log("");
    }

    // Test Coverage special handling
    const testCoverage = this.results.find(r => r.name === "Test Coverage");
    if (testCoverage && testCoverage.metrics?.coveragePercent !== undefined && testCoverage.metrics.coveragePercent < 30) {
      console.log("   🧪 TEST COVERAGE (High Priority):");
      console.log(`      • Current coverage: ${testCoverage.metrics.coveragePercent}%`);
      console.log(`      • Files analyzed: ${testCoverage.metrics.filesAnalyzed || 'N/A'}`);
      console.log("      • Recommendation: Start with critical business logic");
      console.log("");
    }

    // Performance insights
    const performance = this.results.find(r => r.name === "Performance");
    if (performance && performance.metrics?.totalIssues && performance.metrics.totalIssues > 50) {
      console.log("   ⚡ PERFORMANCE (Medium Priority):");
      console.log(`      • ${performance.metrics.totalIssues} optimization opportunities`);
      if (performance.metrics.keyFindings && performance.metrics.keyFindings.length > 0) {
        console.log(`      • Focus area: ${performance.metrics.keyFindings[0]}`);
      }
      console.log("");
    }

    // Health trend
    const failedChecks = this.results.filter(r => r.status === "fail").length;
    const warningChecks = this.results.filter(r => r.status === "warning").length;
    const passedChecks = this.results.filter(r => r.status === "pass").length;

    console.log("📈 HEALTH TREND:");
    if (failedChecks === 0 && totalCriticalIssues === 0) {
      console.log("   ✅ Excellent - No critical issues detected");
      console.log("   🎯 Focus on reducing warnings and technical debt");
    } else if (totalCriticalIssues < 10) {
      console.log("   🟡 Good - Few critical issues to address");
      console.log("   🎯 Focus on fixing critical issues first");
    } else if (totalCriticalIssues < 50) {
      console.log("   🟠 Needs Attention - Multiple critical issues");  
      console.log("   🎯 Prioritize critical fixes before new features");
    } else {
      console.log("   🔴 Needs Immediate Action - Many critical issues");
      console.log("   🎯 Stop new development, focus on critical fixes");
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  }

  private extractMetrics(checkName: string, output: string): { criticalIssues?: number; warningIssues?: number; infoIssues?: number; totalIssues?: number; coveragePercent?: number; filesAnalyzed?: number; keyFindings?: string[] } {
    const metrics: any = {};

    switch (checkName) {
      case "Code Quality": {
        // Extract: 🚨 33 critical, ⚠️  69 warnings, ℹ️  37 info
        const summaryMatch = output.match(/🚨\s*(\d+)\s*critical,\s*⚠️\s*(\d+)\s*warnings,\s*ℹ️\s*(\d+)\s*info/);
        if (summaryMatch) {
          metrics.criticalIssues = parseInt(summaryMatch[1], 10);
          metrics.warningIssues = parseInt(summaryMatch[2], 10);
          metrics.infoIssues = parseInt(summaryMatch[3], 10);
          metrics.totalIssues = metrics.criticalIssues + metrics.warningIssues + metrics.infoIssues;
        }

        const keyFindings: string[] = [];
        if (output.includes("DEBUG CODE FOUND")) keyFindings.push("Debug code found");
        if (output.includes("TECHNICAL DEBT")) keyFindings.push("Technical debt (TODOs)");
        if (output.includes("TYPE SAFETY")) keyFindings.push("Type safety issues");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Architecture": {
        const summaryMatch = output.match(/🚨\s*(\d+)\s*critical,\s*⚠️\s*(\d+)\s*warnings,\s*ℹ️\s*(\d+)\s*info/);
        if (summaryMatch) {
          metrics.criticalIssues = parseInt(summaryMatch[1], 10);
          metrics.warningIssues = parseInt(summaryMatch[2], 10);
          metrics.infoIssues = parseInt(summaryMatch[3], 10);
          metrics.totalIssues = metrics.criticalIssues + metrics.warningIssues + metrics.infoIssues;
        }

        const keyFindings: string[] = [];
        if (output.includes("IMPORT PATH VIOLATIONS")) keyFindings.push("Relative imports found");
        if (output.includes("ROUTE STRUCTURE VIOLATIONS")) keyFindings.push("Route structure issues");
        if (output.includes("FILE SIZE ANALYSIS")) keyFindings.push("Large files detected");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Test Coverage": {
        // Extract: Files with tests: 0/46 (0%)
        const coverageMatch = output.match(/Files with tests:\s*\d+\/\d+\s*\((\d+)%\)/);
        if (coverageMatch) {
          metrics.coveragePercent = parseInt(coverageMatch[1], 10);
        }

        // Extract: Total testable files: 46
        const filesMatch = output.match(/Total testable files:\s*(\d+)/);
        if (filesMatch) {
          metrics.filesAnalyzed = parseInt(filesMatch[1], 10);
        }

        const keyFindings: string[] = [];
        if (metrics.coveragePercent === 0) keyFindings.push("No test coverage");
        if (output.includes("critical files without tests")) keyFindings.push("Critical files untested");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Performance": {
        const summaryMatch = output.match(/🚨\s*(\d+)\s*critical,\s*⚠️\s*(\d+)\s*warnings,\s*ℹ️\s*(\d+)\s*info/);
        if (summaryMatch) {
          metrics.criticalIssues = parseInt(summaryMatch[1], 10);
          metrics.warningIssues = parseInt(summaryMatch[2], 10);
          metrics.infoIssues = parseInt(summaryMatch[3], 10);
          metrics.totalIssues = metrics.criticalIssues + metrics.warningIssues + metrics.infoIssues;
        }

        const keyFindings: string[] = [];
        if (output.includes("BLOCKING OPERATIONS")) keyFindings.push("Blocking operations");
        if (output.includes("DATABASE QUERY ISSUES")) keyFindings.push("Database query issues");
        if (output.includes("MEMORY LEAK RISKS")) keyFindings.push("Memory leak risks");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Import Issues": {
        const summaryMatch = output.match(/🚨\s*(\d+)\s*critical,\s*⚠️\s*(\d+)\s*warnings,\s*ℹ️\s*(\d+)\s*info/);
        if (summaryMatch) {
          metrics.criticalIssues = parseInt(summaryMatch[1], 10);
          metrics.warningIssues = parseInt(summaryMatch[2], 10);
          metrics.infoIssues = parseInt(summaryMatch[3], 10);
          metrics.totalIssues = metrics.criticalIssues + metrics.warningIssues + metrics.infoIssues;
        }

        const keyFindings: string[] = [];
        if (output.includes("CIRCULAR DEPENDENCIES")) keyFindings.push("Circular dependencies");
        if (output.includes("UNUSED IMPORTS")) keyFindings.push("Unused imports");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Unused Code": {
        const summaryMatch = output.match(/🚨\s*(\d+)\s*critical,\s*⚠️\s*(\d+)\s*warnings,\s*ℹ️\s*(\d+)\s*info/);
        if (summaryMatch) {
          metrics.criticalIssues = parseInt(summaryMatch[1], 10);
          metrics.warningIssues = parseInt(summaryMatch[2], 10);
          metrics.infoIssues = parseInt(summaryMatch[3], 10);
          metrics.totalIssues = metrics.criticalIssues + metrics.warningIssues + metrics.infoIssues;
        }

        const keyFindings: string[] = [];
        if (output.includes("UNUSED EXPORTS")) keyFindings.push("Unused exports");
        if (output.includes("DEAD CODE")) keyFindings.push("Dead code");
        metrics.keyFindings = keyFindings;
        break;
      }

      case "Page Server Logic": {
        // Extract: Critical violations: 6, Warning violations: 17
        const criticalMatch = output.match(/Critical violations:\s*(\d+)/);
        const warningMatch = output.match(/Warning violations:\s*(\d+)/);
        
        if (criticalMatch) {
          metrics.criticalIssues = parseInt(criticalMatch[1], 10);
        }
        if (warningMatch) {
          metrics.warningIssues = parseInt(warningMatch[1], 10);
        }
        
        metrics.totalIssues = (metrics.criticalIssues || 0) + (metrics.warningIssues || 0);

        const keyFindings: string[] = [];
        if (output.includes("CRITICAL VIOLATIONS")) keyFindings.push("Database queries in page files");
        if (output.includes("business logic")) keyFindings.push("Complex business logic in pages");
        if (output.includes("PRIORITY REFACTORING TARGET")) {
          const targetMatch = output.match(/📄 (.*?) \((\d+) violations\)/);
          if (targetMatch) {
            keyFindings.push(`Worst: ${targetMatch[1]} (${targetMatch[2]} violations)`);
          }
        }
        metrics.keyFindings = keyFindings;
        break;
      }
    }

    return metrics;
  }

  private getStatusIcon(status: "pass" | "fail" | "warning" | "running"): string {
    switch (status) {
      case "pass": return "✅";
      case "fail": return "❌";
      case "warning": return "⚠️ ";
      case "running": return "🔄";
      default: return "❓";
    }
  }
}

// Usage help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏥 Codebase Health Checker

Usage: tsx scripts/health-check.ts [options]

Options:
  --quick        Run only quick critical checks (faster feedback)
  --critical     Run only critical health checks
  --failed       Show only failed checks in summary
  --verbose      Show detailed output for each check
  --full-report  Show complete detailed output from all health monitors
  --ci           CI mode with proper exit codes
  --help, -h     Show this help message

Examples:
  tsx scripts/health-check.ts                    # Run all health checks
  tsx scripts/health-check.ts --quick           # Quick critical checks only
  tsx scripts/health-check.ts --critical        # Critical checks only
  tsx scripts/health-check.ts --verbose         # Detailed output
  tsx scripts/health-check.ts --full-report     # Comprehensive detailed report
  tsx scripts/health-check.ts --ci              # CI mode
  tsx scripts/health-check.ts --failed --verbose # Show only failures with details

Health Checks:
  • Code Quality      [CRITICAL] - Debug code, TODOs, type safety
  • Architecture     [CRITICAL] - File organization, import patterns
  • Import Issues    [CRITICAL] - Circular dependencies, violations
  • Page Server Logic [CRITICAL] - Server logic in page files
  • Performance                 - Bottlenecks, optimization opportunities
  • Test Coverage               - Missing tests, coverage gaps
  • Unused Code                - Dead code, unused exports
`);
  process.exit(0);
}

// Run the health checker
const healthChecker = new HealthChecker();
healthChecker.runHealthChecks().catch((error) => {
  console.error("Health check failed:", error);
  process.exit(1);
});