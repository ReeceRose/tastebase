#!/usr/bin/env tsx

import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'child_process';

type ServerLogicItem = {
  path: string;
  category: 'database' | 'business-logic' | 'server-actions';
  violations: string[];
  lineCount: number;
  severity: 'critical' | 'warning';
};

type Colors = {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  reset: string;
  dim: string;
};

class PageServerLogicAnalyzer {
  private srcPath = './src';
  private results: ServerLogicItem[] = [];
  private checkedFiles = 0;
  private verbose = false;
  private jsonOutput = false;
  private exitOnFound = false;

  private colors: Colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    dim: '\x1b[2m'
  };

  private categoryIcons = {
    database: '🗃️',
    'business-logic': '⚙️',
    'server-actions': '🔧',
    critical: '🚨',
    warning: '⚠️',
    page: '📄'
  };

  constructor(verbose = false, jsonOutput = false, exitOnFound = false) {
    this.verbose = verbose;
    this.jsonOutput = jsonOutput;
    this.exitOnFound = exitOnFound;
  }

  private log(message: string, color: keyof Colors = 'reset'): void {
    if (!this.jsonOutput) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }
  }

  private verboseLog(message: string, color: keyof Colors = 'reset'): void {
    if (this.verbose) {
      this.log(message, color);
    }
  }

  private getAllPageFiles(): string[] {
    try {
      const result = execSync(
        `find ${this.srcPath}/app -name "page.tsx" -type f`,
        { encoding: 'utf8' }
      );
      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      this.log(`Error finding page files: ${(error as Error).message}`, 'red');
      return [];
    }
  }

  private analyzePageFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      const stats = statSync(filePath);
      const lineCount = content.split('\n').length;
      
      this.checkedFiles++;
      
      if (this.verbose && this.checkedFiles % 5 === 0) {
        process.stdout.write(`\r${this.colors.dim}Analyzed: ${this.checkedFiles} pages${this.colors.reset}`);
      }

      const violations = this.detectServerLogic(content);
      
      if (violations.length > 0) {
        const category = this.categorizeViolations(violations);
        const severity = this.getSeverity(violations);
        
        this.results.push({
          path: filePath,
          category,
          violations,
          lineCount,
          severity
        });

        this.verboseLog(
          `${this.categoryIcons[severity]} Found ${violations.length} violations in ${filePath}`,
          severity === 'critical' ? 'red' : 'yellow'
        );
      }
    } catch (error) {
      this.verboseLog(`Warning: Could not analyze ${filePath} - ${(error as Error).message}`, 'yellow');
    }
  }

  private detectServerLogic(content: string): string[] {
    const violations: string[] = [];

    // Database imports and usage patterns - MAIN FOCUS
    const dbPatterns = [
      { pattern: /import.*from\s+['"]@\/db['"]/, description: 'Direct database import' },
      { pattern: /\.select\(\)\.from\(/, description: 'Direct database query' },
      { pattern: /\.insert\(\)\.into\(/, description: 'Direct database insert' },
      { pattern: /\.update\(.*\)\.set\(/, description: 'Direct database update' },
      { pattern: /\.delete\(\)\.from\(/, description: 'Direct database delete' },
      { pattern: /db\.(select|insert|update|delete)/, description: 'Database operation' },
      { pattern: /Promise\.all\(\[[\s\S]*?db\./, description: 'Database query in Promise.all' },
    ];

    // Only check database patterns - focus on DB logic violations
    dbPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        violations.push(description);
      }
    });

    return violations;
  }

  private categorizeViolations(violations: string[]): 'database' | 'business-logic' | 'server-actions' {
    // Since we only check database patterns now, all violations are database-related
    return 'database';
  }

  private getSeverity(violations: string[]): 'critical' | 'warning' {
    // All database operations in page files are critical violations
    return violations.length > 0 ? 'critical' : 'warning';
  }

  private reportResults(): void {
    if (this.jsonOutput) {
      console.log(JSON.stringify({
        summary: {
          totalPages: this.checkedFiles,
          violatingPages: this.results.length,
          criticalIssues: this.results.filter(r => r.severity === 'critical').length,
          warnings: this.results.filter(r => r.severity === 'warning').length
        },
        violations: this.results
      }, null, 2));
      return;
    }

    this.log(`\n${this.categoryIcons.page} Page Server Logic Analysis Complete!`);
    this.log(`Total pages analyzed: ${this.checkedFiles}`);
    this.log(`Pages with violations: ${this.results.length}`);

    if (this.results.length === 0) {
      this.log('\n✅ Excellent! No server logic found in page files.', 'green');
      return;
    }

    // Group by severity
    const critical = this.results.filter(r => r.severity === 'critical');
    const warnings = this.results.filter(r => r.severity === 'warning');

    if (critical.length > 0) {
      this.log(`\n🚨 CRITICAL VIOLATIONS:`, 'red');
      critical.forEach(item => {
        this.log(`   ${this.categoryIcons[item.category]} ${item.path}`, 'red');
        this.log(`      Lines: ${item.lineCount} | Violations: ${item.violations.length}`, 'dim');
        item.violations.forEach(violation => {
          this.log(`      • ${violation}`, 'red');
        });
      });
    }

    if (warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS:`, 'yellow');
      warnings.forEach(item => {
        this.log(`   ${this.categoryIcons[item.category]} ${item.path}`, 'yellow');
        this.log(`      Lines: ${item.lineCount} | Violations: ${item.violations.length}`, 'dim');
        if (this.verbose) {
          item.violations.forEach(violation => {
            this.log(`      • ${violation}`, 'yellow');
          });
        }
      });
    }

    this.printHealthSummary();
    this.printRecommendations();
  }

  private printHealthSummary(): void {
    const criticalCount = this.results.filter(r => r.severity === 'critical').length;
    const warningCount = this.results.filter(r => r.severity === 'warning').length;
    
    this.log('\n📊 ARCHITECTURE HEALTH SUMMARY');
    this.log('━'.repeat(50));
    
    let healthStatus: string;
    let statusColor: keyof Colors;
    
    if (criticalCount === 0 && warningCount === 0) {
      healthStatus = 'EXCELLENT 🎉';
      statusColor = 'green';
    } else if (criticalCount === 0) {
      healthStatus = 'GOOD ✅';
      statusColor = 'green';
    } else if (criticalCount < 3) {
      healthStatus = 'NEEDS ATTENTION ⚠️';
      statusColor = 'yellow';
    } else {
      healthStatus = 'NEEDS MAJOR REFACTORING 🚨';
      statusColor = 'red';
    }

    this.log(`📈 PAGE ARCHITECTURE: ${healthStatus}`, statusColor);
    this.log(`   Critical violations: ${criticalCount}`, criticalCount > 0 ? 'red' : 'green');
    this.log(`   Warning violations: ${warningCount}`, warningCount > 0 ? 'yellow' : 'green');
  }

  private printRecommendations(): void {
    if (this.results.length === 0) return;

    this.log('\n💡 REFACTORING RECOMMENDATIONS:', 'cyan');
    this.log('   1. Move database queries to src/lib/server-actions/actions.ts', 'cyan');
    this.log('   2. Create dedicated server actions for data fetching', 'cyan');
    this.log('   3. Keep page files minimal - only UI composition and server action calls', 'cyan');
    this.log('   4. Import database queries from server actions, not directly from @/db', 'cyan');

    const worstOffender = this.results.reduce((worst, current) => 
      current.violations.length > worst.violations.length ? current : worst
    );

    this.log(`\n🏆 PRIORITY REFACTORING TARGET:`, 'magenta');
    this.log(`   ${this.categoryIcons.page} ${worstOffender.path} (${worstOffender.violations.length} violations)`, 'magenta');
  }

  public async run(): Promise<void> {
    if (!this.jsonOutput) {
      this.log('📄 Analyzing page files for server logic violations...\n', 'blue');
    }

    const pageFiles = this.getAllPageFiles();
    
    if (pageFiles.length === 0) {
      this.log('No page.tsx files found in src/app', 'yellow');
      return;
    }

    this.verboseLog(`Found ${pageFiles.length} page files to analyze`, 'blue');

    pageFiles.forEach(file => this.analyzePageFile(file));

    if (this.verbose) {
      process.stdout.write('\n');
    }

    this.reportResults();

    // Exit with error code if critical issues found and CI mode enabled
    if (this.exitOnFound && this.results.filter(r => r.severity === 'critical').length > 0) {
      if (!this.jsonOutput) {
        this.log(`\n❌ CI Mode: Found critical server logic violations in page files. Exiting with code 1.`, 'red');
      }
      process.exit(1);
    }
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const verbose = args.includes('--verbose') || args.includes('-v');
const jsonOutput = args.includes('--json');
const exitOnFound = args.includes('--ci');

if (showHelp) {
  console.log(`
📄 Page Server Logic Analyzer

Detects server-side logic that should be extracted from page.tsx files to maintain clean architecture.

USAGE:
  npx tsx scripts/find-page-server-logic.ts [OPTIONS]

OPTIONS:
  --verbose, -v          Show detailed progress and violations
  --help, -h             Show this help message
  --json                 Output results as JSON for automation
  --ci                   Exit with error code if critical violations found

EXAMPLES:
  pnpm page-server-logic                    # Basic analysis
  pnpm page-server-logic:verbose            # Detailed analysis
  pnpm page-server-logic --ci               # CI mode with exit codes

VIOLATIONS DETECTED:
  🗃️  Database operations (direct queries, imports)
  🔧  Database imports and query patterns

ARCHITECTURE GOAL:
  📄 Page files should only contain UI composition and server action calls
  🎯 All database queries and business logic should live in features/
  `);
  process.exit(0);
}

// Run the analyzer
const analyzer = new PageServerLogicAnalyzer(verbose, jsonOutput, exitOnFound);
analyzer.run().catch(console.error);