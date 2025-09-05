#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import path from "node:path";

type PerformanceIssue = {
  file: string;
  line: number;
  type: "blocking-operation" | "inefficient-query" | "memory-leak" | "render-performance" | "bundle-size" | "async-pattern";
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion?: string;
  context?: string;
  impact: "high" | "medium" | "low";
};

type PerformancePattern = {
  name: string;
  pattern: RegExp;
  type: PerformanceIssue["type"];
  severity: PerformanceIssue["severity"];
  impact: PerformanceIssue["impact"];
  message: string;
  suggestion: string;
  exclude?: RegExp[];
  fileTypeFilter?: string[];
};

class PerformanceProfiler {
  private issues: PerformanceIssue[] = [];
  private verbose = false;
  private ciMode = false;
  private onlyBlocking = false;
  private onlyQueries = false;
  private onlyRender = false;
  private onlyBundle = false;
  private onlyAsync = false;

  private readonly patterns: PerformancePattern[] = [
    // Blocking Operations
    {
      name: "Synchronous File Operations",
      pattern: /fs\.(readFileSync|writeFileSync|existsSync|statSync|readdirSync)/g,
      type: "blocking-operation",
      severity: "critical",
      impact: "high",
      message: "Synchronous file operation blocks event loop",
      suggestion: "Use async alternatives: fs.promises.readFile(), fs.promises.writeFile(), etc.",
      exclude: [/\/scripts\//, /\/tests?\//],
    },
    {
      name: "Blocking JSON Parse",
      pattern: /JSON\.parse\([^)]*\)/g,
      type: "blocking-operation",
      severity: "warning",
      impact: "medium",
      message: "Large JSON parsing can block main thread",
      suggestion: "Consider streaming JSON parsing for large payloads or use worker threads",
      fileTypeFilter: [".ts", ".tsx", ".js", ".jsx"],
    },
    {
      name: "Synchronous Crypto Operations",
      pattern: /crypto\.(createHash|pbkdf2Sync|scryptSync|randomBytes)/g,
      type: "blocking-operation",
      severity: "critical",
      impact: "high",
      message: "Synchronous crypto operations block event loop",
      suggestion: "Use async crypto methods: pbkdf2, scrypt, randomBytes with callbacks",
    },
    {
      name: "Blocking Sleep/Wait",
      pattern: /sleep\(|setTimeout.*await|new Promise.*setTimeout/g,
      type: "blocking-operation",
      severity: "warning",
      impact: "medium",
      message: "Blocking wait operation detected",
      suggestion: "Use proper async patterns instead of artificial delays",
    },

    // Database Query Issues
    {
      name: "N+1 Query Pattern",
      pattern: /(for|forEach|map).*await.*\.(select|find|get|query)/g,
      type: "inefficient-query",
      severity: "critical",
      impact: "high",
      message: "Potential N+1 query pattern in loop",
      suggestion: "Use batch queries, JOIN operations, or DataLoader pattern",
    },
    {
      name: "Missing Query Limits",
      pattern: /\b(?:db|ctx\.db)\s*\.\s*select\s*\([^)]*\)/g,
      type: "inefficient-query",
      severity: "warning",
      impact: "medium",
      message: "Database query without explicit limit",
      suggestion: "Add .limit() or .take() to prevent large result sets",
      exclude: [
        /\.limit\(/,
        /\.take\(/,
        /\.findUnique\(/,
        /\.findFirst\(/,
        // Common patterns for queries that should have limits but we know are safe
        /COUNT\(\*\)|count\(\*\)/i,
      ],
    },
    {
      name: "SELECT * Usage",
      pattern: /select\s+\*|SELECT\s+\*/g,
      type: "inefficient-query",
      severity: "warning",
      impact: "medium",
      message: "SELECT * queries fetch unnecessary data",
      suggestion: "Specify only needed columns in SELECT statement",
    },

    // Memory Leak Patterns
    {
      name: "Event Listener Without Cleanup",
      pattern: /(?:element|document|window|target)\.addEventListener\(|\.addEventListener\(/g,
      type: "memory-leak",
      severity: "warning",
      impact: "medium",
      message: "Event listener may not be properly cleaned up",
      suggestion: "Ensure removeEventListener in cleanup/unmount lifecycle",
      fileTypeFilter: [".tsx", ".jsx"],
      exclude: [/removeEventListener/, /useEffect.*return/, /cleanup/, /AbortController/],
    },
    {
      name: "setInterval Without Cleanup",
      pattern: /setInterval\(/g,
      type: "memory-leak",
      severity: "warning",
      impact: "high",
      message: "setInterval without cleanup can cause memory leaks",
      suggestion: "Store interval ID and clear in cleanup function",
    },
    {
      name: "Missing AbortController",
      pattern: /fetch\(|axios\.|http\.(get|post)/g,
      type: "memory-leak",
      severity: "info",
      impact: "medium",
      message: "HTTP request without abort controller",
      suggestion: "Use AbortController to cancel requests on component unmount",
      fileTypeFilter: [".tsx", ".jsx"],
    },

    // React Render Performance
    {
      name: "Missing React.memo",
      pattern: /export\s+(?:default\s+)?function\s+\w+.*\{[\s\S]*?useState|useEffect/g,
      type: "render-performance",
      severity: "info",
      impact: "medium",
      message: "Component with state may benefit from React.memo",
      suggestion: "Wrap with React.memo if props don't change frequently",
      fileTypeFilter: [".tsx"],
    },
    {
      name: "Inline Object Creation",
      pattern: /\{\s*\w+:\s*[^}]+\}/g,
      type: "render-performance",
      severity: "info",
      impact: "low",
      message: "Inline object creation can cause unnecessary re-renders",
      suggestion: "Move object creation outside render or use useMemo",
      fileTypeFilter: [".tsx", ".jsx"],
      exclude: [/const\s+\w+\s*=/, /return\s+\{/],
    },
    {
      name: "Missing useCallback",
      pattern: /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}/g,
      type: "render-performance",
      severity: "info",
      impact: "low",
      message: "Function recreated on every render",
      suggestion: "Use useCallback for functions passed as props",
      fileTypeFilter: [".tsx", ".jsx"],
    },

    // Bundle Size Issues
    {
      name: "Heavy Library Imports",
      pattern: /import.*from\s+['"]lodash['"]|import.*from\s+['"]moment['"]/g,
      type: "bundle-size",
      severity: "warning",
      impact: "high",
      message: "Heavy library imported entirely",
      suggestion: "Use specific imports: import debounce from 'lodash/debounce'",
    },
    {
      name: "Unused Heavy Dependencies",
      pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"](@radix-ui|framer-motion|three|chart\.js)['"]/g,
      type: "bundle-size",
      severity: "info",
      impact: "medium",
      message: "Heavy library imported entirely with wildcard",
      suggestion: "Use specific imports instead of wildcard imports for better tree-shaking",
    },

    // Async Pattern Issues
    {
      name: "Missing Error Handling",
      pattern: /await\s+(?!auth\(\)|.*\.log|.*\.redirect|.*\.notFound)[^;]+(?!\.catch\()/g,
      type: "async-pattern",
      severity: "warning",
      impact: "medium",
      message: "Async operation without error handling",
      suggestion: "Add .catch() or wrap in try-catch block",
      exclude: [
        /try\s*\{[\s\S]*?await[\s\S]*?\}\s*catch/,
        /await\s+auth\(/,
        /await\s+.*\.log/,
        /await\s+.*redirect/,
        /await\s+.*notFound/,
        /middleware/,
        /server.*action/i,
      ],
    },
    {
      name: "Promise.all Without Error Handling",
      pattern: /Promise\.all\([^)]+\)(?!\s*\.catch)/g,
      type: "async-pattern",
      severity: "critical",
      impact: "high",
      message: "Promise.all fails entirely if one promise rejects",
      suggestion: "Use Promise.allSettled() or add .catch(() => undefined) to individual promises",
    },
    {
      name: "Sequential Async Operations",
      pattern: /await\s+[^;]+;\s*await\s+[^;]+/g,
      type: "async-pattern",
      severity: "info",
      impact: "medium",
      message: "Sequential async operations could run in parallel",
      suggestion: "Use Promise.all() for independent async operations",
    },
    {
      name: "Async in forEach",
      pattern: /\.forEach\(.*async/g,
      type: "async-pattern",
      severity: "warning",
      impact: "medium",
      message: "forEach doesn't wait for async operations",
      suggestion: "Use for...of loop or Promise.all with map()",
    },
  ];

  constructor() {
    const args = process.argv.slice(2);
    this.verbose = args.includes("--verbose");
    this.ciMode = args.includes("--ci");
    this.onlyBlocking = args.includes("--blocking");
    this.onlyQueries = args.includes("--queries");
    this.onlyRender = args.includes("--render");
    this.onlyBundle = args.includes("--bundle");
    this.onlyAsync = args.includes("--async");
  }

  public async analyze(): Promise<void> {
    if (!this.ciMode) {
      console.log("⚡ PERFORMANCE PROFILER");
      console.log("=======================");
      console.log("");
    }

    const startTime = Date.now();

    // Get list of files to analyze
    const files = await this.getFilesToAnalyze();
    
    if (this.verbose && !this.ciMode) {
      console.log(`📁 Analyzing ${files.length} files for performance issues...`);
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
      const highImpactIssues = this.issues.filter((issue) => issue.impact === "high");
      
      if (criticalIssues.length > 0) {
        console.error(`Critical performance issues found: ${criticalIssues.length} issues`);
        process.exit(1);
      } else {
        const warnings = this.issues.filter((issue) => issue.severity === "warning").length;
        const infos = this.issues.filter((issue) => issue.severity === "info").length;
        console.log(`✅ No critical performance issues (${warnings} warnings, ${infos} info)`);
        process.exit(0);
      }
    }
  }

  private async getFilesToAnalyze(): Promise<string[]> {
    try {
      // Focus on source files that can have performance issues
      const files = execSync(
        'find ./src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) | grep -v __tests__ | grep -v node_modules | head -120',
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
      const lines = content.split("\n");
      const fileExt = path.extname(filePath);

      for (const pattern of this.patterns) {
        // Skip patterns based on CLI flags
        if (this.onlyBlocking && pattern.type !== "blocking-operation") continue;
        if (this.onlyQueries && pattern.type !== "inefficient-query") continue;
        if (this.onlyRender && pattern.type !== "render-performance") continue;
        if (this.onlyBundle && pattern.type !== "bundle-size") continue;
        if (this.onlyAsync && pattern.type !== "async-pattern") continue;

        // Skip async error handling checks in middleware files
        if (pattern.name === "Missing Error Handling" && filePath.includes("/middleware/")) {
          continue;
        }

        // Skip if file type doesn't match filter
        if (pattern.fileTypeFilter && !pattern.fileTypeFilter.includes(fileExt)) {
          continue;
        }

        // Use line-by-line processing for better performance
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          const matches = line.match(pattern.pattern);
          
          if (matches) {
            for (const match of matches) {
              // Check exclusion patterns
              if (this.shouldExcludeLine(line, match, pattern.exclude, content, lineIndex)) {
                continue;
              }

              this.issues.push({
                file: filePath,
                line: lineIndex + 1,
                type: pattern.type,
                severity: pattern.severity,
                impact: pattern.impact,
                message: pattern.message,
                suggestion: pattern.suggestion,
                context: line.trim()
              });
            }
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.error(`Error analyzing ${filePath}:`, error);
      }
    }
  }

  private shouldExcludeLine(
    line: string, 
    match: string, 
    excludePatterns?: RegExp[], 
    fullContent?: string, 
    lineIndex?: number
  ): boolean {
    if (!excludePatterns) return false;

    // Check line-level exclusions
    for (const excludePattern of excludePatterns) {
      if (excludePattern.test(line)) {
        return true;
      }
    }

    // Check context-aware exclusions (for try-catch blocks, query chains, etc.)
    if (fullContent && lineIndex !== undefined) {
      const lines = fullContent.split("\n");
      
      // For query patterns, check a larger context window (10 lines after the match)
      const contextStart = Math.max(0, lineIndex - 2);
      const contextEnd = Math.min(lines.length, lineIndex + 10);
      const context = lines.slice(contextStart, contextEnd).join("\n");
      
      for (const excludePattern of excludePatterns) {
        if (excludePattern.test(context)) {
          return true;
        }
      }
    }

    return false;
  }

  private displayResults(duration: number): void {
    const issuesByType = this.groupIssuesByType();
    const issuesBySeverity = this.groupIssuesBySeverity();
    const issuesByImpact = this.groupIssuesByImpact();

    // Display blocking operations
    if (issuesByType["blocking-operation"] && issuesByType["blocking-operation"].length > 0 && !this.onlyQueries && !this.onlyRender && !this.onlyBundle && !this.onlyAsync) {
      console.log("🚫 BLOCKING OPERATIONS:");
      const blockingIssues = issuesByType["blocking-operation"].slice(0, 5);
      for (const issue of blockingIssues) {
        const icon = issue.severity === "critical" ? "❌" : "⚠️ ";
        const impact = issue.impact === "high" ? "🔥" : issue.impact === "medium" ? "🟡" : "🔵";
        console.log(`   ${icon}${impact} ${issue.file}:${issue.line} - ${issue.message}`);
        if (this.verbose && issue.context) {
          console.log(`      Context: ${issue.context}`);
        }
      }
      if (issuesByType["blocking-operation"].length > 5) {
        console.log(`   ... and ${issuesByType["blocking-operation"].length - 5} more`);
      }
      console.log("");
    }

    // Display database query issues
    if (issuesByType["inefficient-query"] && issuesByType["inefficient-query"].length > 0 && !this.onlyBlocking && !this.onlyRender && !this.onlyBundle && !this.onlyAsync) {
      console.log("🗃️  DATABASE QUERY ISSUES:");
      const criticalQueries = issuesByType["inefficient-query"].filter(i => i.severity === "critical").length;
      const warningQueries = issuesByType["inefficient-query"].filter(i => i.severity === "warning").length;

      if (criticalQueries > 0) console.log(`   ❌ ${criticalQueries} critical query patterns (N+1 queries)`);
      if (warningQueries > 0) console.log(`   ⚠️  ${warningQueries} inefficient query patterns`);

      if (this.verbose) {
        const queryIssues = issuesByType["inefficient-query"].slice(0, 3);
        for (const issue of queryIssues) {
          const icon = issue.severity === "critical" ? "❌" : "⚠️ ";
          console.log(`      ${icon} ${issue.file}:${issue.line} - ${issue.message}`);
        }
      }
      console.log("");
    }

    // Display memory leak risks
    if (issuesByType["memory-leak"] && issuesByType["memory-leak"].length > 0 && !this.onlyBlocking && !this.onlyQueries && !this.onlyRender && !this.onlyBundle && !this.onlyAsync) {
      console.log("🧠 MEMORY LEAK RISKS:");
      console.log(`   ⚠️  ${issuesByType["memory-leak"].length} potential memory leak patterns`);
      
      if (this.verbose) {
        const memoryIssues = issuesByType["memory-leak"].slice(0, 3);
        for (const issue of memoryIssues) {
          console.log(`      ⚠️  ${issue.file}:${issue.line} - ${issue.message}`);
        }
      }
      console.log("");
    }

    // Display render performance issues
    if (issuesByType["render-performance"] && issuesByType["render-performance"].length > 0 && !this.onlyBlocking && !this.onlyQueries && !this.onlyBundle && !this.onlyAsync) {
      console.log("🎨 RENDER PERFORMANCE:");
      console.log(`   ℹ️  ${issuesByType["render-performance"].length} render optimization opportunities`);
      
      if (this.verbose) {
        const renderIssues = issuesByType["render-performance"].slice(0, 3);
        for (const issue of renderIssues) {
          console.log(`      ℹ️  ${issue.file}:${issue.line} - ${issue.message}`);
        }
      }
      console.log("");
    }

    // Display bundle size issues
    if (issuesByType["bundle-size"] && issuesByType["bundle-size"].length > 0 && (!this.onlyBlocking && !this.onlyQueries && !this.onlyRender && !this.onlyAsync || this.onlyBundle)) {
      console.log("📦 BUNDLE SIZE:");
      const bundleCritical = issuesByType["bundle-size"].filter(i => i.severity === "warning").length;
      const bundleInfo = issuesByType["bundle-size"].filter(i => i.severity === "info").length;

      if (bundleCritical > 0) console.log(`   ⚠️  ${bundleCritical} heavy library imports`);
      if (bundleInfo > 0) console.log(`   ℹ️  ${bundleInfo} potential unused imports`);

      if (this.verbose || this.onlyBundle) {
        const bundleIssues = issuesByType["bundle-size"].slice(0, 10);
        for (const issue of bundleIssues) {
          const icon = issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
          console.log(`      ${icon} ${issue.file}:${issue.line} - ${issue.message}`);
          if (issue.context) {
            console.log(`         Context: ${issue.context}`);
          }
        }
        if (issuesByType["bundle-size"].length > 10) {
          console.log(`      ... and ${issuesByType["bundle-size"].length - 10} more`);
        }
      }
      console.log("");
    }

    // Display async pattern issues
    if (issuesByType["async-pattern"] && issuesByType["async-pattern"].length > 0 && (!this.onlyBlocking && !this.onlyQueries && !this.onlyRender && !this.onlyBundle || this.onlyAsync)) {
      console.log("🔄 ASYNC PATTERNS:");
      const asyncCritical = issuesByType["async-pattern"].filter(i => i.severity === "critical").length;
      const asyncWarning = issuesByType["async-pattern"].filter(i => i.severity === "warning").length;
      const asyncInfo = issuesByType["async-pattern"].filter(i => i.severity === "info").length;

      if (asyncCritical > 0) console.log(`   ❌ ${asyncCritical} critical async patterns`);
      if (asyncWarning > 0) console.log(`   ⚠️  ${asyncWarning} suboptimal async patterns`);
      if (asyncInfo > 0) console.log(`   ℹ️  ${asyncInfo} async optimization opportunities`);

      if (this.verbose || this.onlyAsync) {
        const asyncIssues = issuesByType["async-pattern"].slice(0, 10);
        for (const issue of asyncIssues) {
          const severityIcon = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
          console.log(`      ${severityIcon} ${issue.file}:${issue.line} - ${issue.message}`);
          if (issue.context) {
            console.log(`         Context: ${issue.context}`);
          }
        }
        if (issuesByType["async-pattern"].length > 10) {
          console.log(`      ... and ${issuesByType["async-pattern"].length - 10} more`);
        }
      }
      console.log("");
    }

    // Summary
    const totalIssues = this.issues.length;
    const criticalCount = issuesBySeverity.critical?.length || 0;
    const warningCount = issuesBySeverity.warning?.length || 0;
    const infoCount = issuesBySeverity.info?.length || 0;
    
    const highImpactCount = issuesByImpact.high?.length || 0;
    const mediumImpactCount = issuesByImpact.medium?.length || 0;

    if (totalIssues === 0) {
      console.log("📊 PERFORMANCE: EXCELLENT ✅");
    } else if (criticalCount > 0 || highImpactCount > 3) {
      console.log("📊 PERFORMANCE: CRITICAL ISSUES ❌");
      console.log(`🔥 ${highImpactCount} high-impact issues found`);
    } else if (warningCount > 0 || mediumImpactCount > 5) {
      console.log("📊 PERFORMANCE: NEEDS OPTIMIZATION ⚠️");
      console.log(`🟡 ${mediumImpactCount} medium-impact issues found`);
    } else {
      console.log("📊 PERFORMANCE: GOOD ✅");
      console.log(`🔵 ${infoCount} optimization opportunities found`);
    }

    console.log(`🚨 ${criticalCount} critical, ⚠️  ${warningCount} warnings, ℹ️  ${infoCount} info`);
    console.log(`🔥 ${highImpactCount} high impact, 🟡 ${mediumImpactCount} medium impact`);
    console.log(`⚡ Analysis completed in ${duration}ms`);

    if (this.verbose && totalIssues > 0) {
      console.log("\n🔥 HIGH-IMPACT ISSUES:");
      const highImpactIssues = this.issues
        .filter(i => i.impact === "high")
        .concat(this.issues.filter(i => i.severity === "critical"))
        .slice(0, 10);
        
      for (const issue of highImpactIssues) {
        const severityIcon = issue.severity === "critical" ? "❌" : issue.severity === "warning" ? "⚠️ " : "ℹ️ ";
        const impactIcon = issue.impact === "high" ? "🔥" : issue.impact === "medium" ? "🟡" : "🔵";
        console.log(`   ${severityIcon}${impactIcon} ${issue.file}:${issue.line} - ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      }
      if (totalIssues > 10) {
        console.log(`   ... and ${totalIssues - 10} more issues`);
      }
    }
  }

  private groupIssuesByType(): Record<string, PerformanceIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, PerformanceIssue[]>);
  }

  private groupIssuesBySeverity(): Record<string, PerformanceIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {} as Record<string, PerformanceIssue[]>);
  }

  private groupIssuesByImpact(): Record<string, PerformanceIssue[]> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.impact] = acc[issue.impact] || [];
      acc[issue.impact].push(issue);
      return acc;
    }, {} as Record<string, PerformanceIssue[]>);
  }
}

// Run the profiler
const profiler = new PerformanceProfiler();
profiler.analyze().catch((error) => {
  console.error("Performance analysis failed:", error);
  process.exit(1);
});