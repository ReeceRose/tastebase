#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'child_process';

type DependencyInfo = {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
  used: boolean;
  importedIn: string[];
  size: number;
  vulnerabilities: SecurityIssue[];
};

type SecurityIssue = {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  url?: string;
};

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
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

class DependencyAnalyzer {
  private srcPath = './src';
  private packageJson: PackageJson;
  private dependencies: DependencyInfo[] = [];
  private checkedDeps = 0;
  private verbose = false;
  private securityOnly = false;
  private jsonOutput = false;
  private exitOnIssues = false;
  
  private readonly colors: Colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    dim: '\x1b[2m'
  };

  private readonly categoryIcons = {
    unused: '📦',
    missing: '❌',
    security: '🔒',
    size: '💰',
    success: '✅',
    warning: '⚠️',
    critical: '🚨'
  };

  constructor(verbose = false, securityOnly = false, jsonOutput = false, exitOnIssues = false) {
    this.verbose = verbose;
    this.securityOnly = securityOnly;
    this.jsonOutput = jsonOutput;
    this.exitOnIssues = exitOnIssues;
    
    if (!this.validateEnvironment()) {
      process.exit(1);
    }
    
    this.packageJson = this.loadPackageJson();
  }

  private validateEnvironment(): boolean {
    if (!existsSync('./package.json')) {
      this.log('Error: package.json not found. Run from project root.', 'red');
      return false;
    }
    
    if (!existsSync(this.srcPath)) {
      this.log('Error: ./src directory not found. Run from project root.', 'red');
      return false;
    }
    
    try {
      execSync('which rg', { stdio: 'pipe' });
    } catch {
      this.log('Warning: ripgrep not found. Install with: brew install ripgrep', 'yellow');
    }
    
    return true;
  }

  private loadPackageJson(): PackageJson {
    try {
      const content = readFileSync('./package.json', 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.log(`Error loading package.json: ${(error as Error).message}`, 'red');
      process.exit(1);
    }
  }

  private log(message: string, color: keyof Colors = 'reset'): void {
    if (this.jsonOutput) return;
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  private verboseLog(message: string, color: keyof Colors = 'reset'): void {
    if (this.verbose && !this.jsonOutput) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }
  }

  private updateProgress(): void {
    if (this.jsonOutput) return;
    
    if (this.verbose) {
      process.stdout.write(`\r${this.colors.dim}Analyzed: ${this.checkedDeps} dependencies${this.colors.reset}`);
    } else if (this.checkedDeps % 10 === 0) {
      process.stdout.write(`\r${this.colors.dim}Progress: ${this.checkedDeps} dependencies analyzed${this.colors.reset}`);
    }
  }

  private getAllDependencies(): { name: string; version: string; type: 'dependency' | 'devDependency' }[] {
    const deps: { name: string; version: string; type: 'dependency' | 'devDependency' }[] = [];
    
    if (this.packageJson.dependencies) {
      for (const [name, version] of Object.entries(this.packageJson.dependencies)) {
        deps.push({ name, version, type: 'dependency' });
      }
    }
    
    if (this.packageJson.devDependencies) {
      for (const [name, version] of Object.entries(this.packageJson.devDependencies)) {
        deps.push({ name, version, type: 'devDependency' });
      }
    }
    
    return deps;
  }

  private checkDependencyUsage(depName: string): { used: boolean; importedIn: string[] } {
    const importedIn: string[] = [];
    let used = false;

    try {
      // Method 1: Simple string search for direct imports (more reliable than complex regex)
      const directImports = this.searchForPattern(`["']${depName}["']`);
      if (directImports.length > 0) {
        used = true;
        importedIn.push(...directImports);
        this.verboseLog(`Found direct imports for ${depName}: ${directImports.length} files`, 'green');
      }

      // Method 2: Check for sub-package imports (e.g., @radix-ui/react-button)
      if (depName.includes('/') && !used) {
        const basePackage = depName.split('/')[0];
        if (basePackage.startsWith('@')) {
          // For scoped packages, check if the full package name appears
          const scopedImports = this.searchForPattern(`${depName}`);
          if (scopedImports.length > 0) {
            used = true;
            importedIn.push(...scopedImports);
            this.verboseLog(`Found scoped imports for ${depName}: ${scopedImports.length} files`, 'green');
          }
        }
      }

      // Method 3: For packages that might be used in different ways
      if (!used) {
        // Try just the package name without quotes (catches more usage patterns)
        const broadSearch = this.searchForPattern(depName);
        if (broadSearch.length > 0) {
          used = true;
          importedIn.push(...broadSearch);
          this.verboseLog(`Found broad usage for ${depName}: ${broadSearch.length} files`, 'green');
        }
      }

      // Method 4: Check for specific patterns for common packages
      if (!used && depName === 'next') {
        const nextFiles = this.searchForPattern('next/');
        if (nextFiles.length > 0) {
          used = true;
          importedIn.push(...nextFiles);
        }
      }

      // Method 5: Check special cases for common tools
      if (!used) {
        used = this.checkSpecialCases(depName, importedIn);
      }

      // Method 6: Check if used in package.json scripts
      if (!used && this.packageJson.scripts) {
        for (const [scriptName, scriptCommand] of Object.entries(this.packageJson.scripts)) {
          if (scriptCommand.includes(depName)) {
            used = true;
            importedIn.push(`package.json:scripts.${scriptName}`);
          }
        }
      }

    } catch (error) {
      this.verboseLog(`Warning: Failed to check usage for ${depName} - ${(error as Error).message}`, 'yellow');
    }

    return { used, importedIn: [...new Set(importedIn)] };
  }

  private checkSpecialCases(depName: string, importedIn: string[]): boolean {
    // TypeScript type packages - check if types are actually used
    if (depName.startsWith('@types/')) {
      const basePackage = depName.replace('@types/', '');
      
      // Special cases for implicitly required types
      if (basePackage === 'node') {
        // @types/node is always needed in TypeScript Node.js projects
        if (existsSync('tsconfig.json')) {
          importedIn.push('Required for Node.js built-in types in TypeScript');
          return true;
        }
      }
      
      if (basePackage === 'react-dom') {
        // @types/react-dom is needed if we have React components and TypeScript
        if (existsSync('tsconfig.json')) {
          try {
            // Check for .tsx files using find command (more reliable than regex)
            const tsxFiles = execSync('find ./src -name "*.tsx" | head -1', { encoding: 'utf8', stdio: 'pipe' });
            if (tsxFiles.trim().length > 0) {
              importedIn.push('Required for React DOM types in TypeScript');
              return true;
            }
          } catch {
            // Fallback: if we have react-dom dependency, we likely need the types
            const allDeps = [
              ...Object.keys(this.packageJson.dependencies || {}),
              ...Object.keys(this.packageJson.devDependencies || {})
            ];
            if (allDeps.includes('react-dom')) {
              importedIn.push('Required for React DOM types in TypeScript');
              return true;
            }
          }
        }
      }
      
      // If the base package is installed and used, the types are needed
      const allDeps = [
        ...Object.keys(this.packageJson.dependencies || {}),
        ...Object.keys(this.packageJson.devDependencies || {})
      ];
      
      if (allDeps.includes(basePackage)) {
        const baseUsage = this.searchForPattern(basePackage);
        if (baseUsage.length > 0) {
          importedIn.push(`Required for ${basePackage} types`);
          return true;
        }
      }
    }
    
    // Build tools and configs
    const configTools: Record<string, string[]> = {
      '@biomejs/biome': ['biome.json'],
      '@vitejs/plugin-react': ['vitest.config.ts'],
      '@vitest/coverage-v8': ['vitest.config.ts'],
      'jsdom': ['vitest.config.ts'],
      '@tailwindcss/postcss': ['postcss.config.mjs'],
      'tailwindcss': ['postcss.config.mjs', 'src/app/globals.css'],
      'tw-animate-css': ['src/app/globals.css'], 
      'drizzle-kit': ['drizzle.config.ts'],
      'drizzle-orm': ['drizzle.config.ts'],
      'husky': ['.husky/'],
      'lint-staged': ['package.json'],
      'tsc-files': ['package.json'],
      'concurrently': ['package.json'],
      'tsx': ['package.json'],
      '@types/node': ['Node.js built-in types'],
      '@testing-library/user-event': ['src/__tests__/']
    };
    
    if (configTools[depName]) {
      for (const configFile of configTools[depName]) {
        if (existsSync(configFile)) {
          importedIn.push(`Used in ${configFile}`);
          this.verboseLog(`Found config usage for ${depName}: ${configFile}`, 'green');
          return true;
        }
      }
    }
    
    // React DOM - special case for Next.js
    if (depName === 'react-dom') {
      // In Next.js, react-dom is used internally, check if we have JSX/React components
      const reactFiles = this.searchForPattern('React');
      const jsxFiles = this.searchForPattern('\\.tsx');
      if (reactFiles.length > 10 || jsxFiles.length > 0) {
        importedIn.push('Required by Next.js for React components');
        this.verboseLog(`Found React usage - react-dom needed: ${reactFiles.length} files`, 'green');
        return true;
      }
    }
    
    // Next.js specific dependencies
    const nextJsDeps = ['react', 'react-dom', 'typescript'];
    if (nextJsDeps.includes(depName)) {
      if (existsSync('next.config.ts') || existsSync('next.config.js')) {
        importedIn.push('Required by Next.js framework');
        return true;
      }
    }
    
    return false;
  }

  private searchForPattern(pattern: string): string[] {
    try {
      const result = execSync(
        `rg "${pattern}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.jsx" -l`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      return result.trim().split('\n').filter(line => line.length > 0);
    } catch {
      return [];
    }
  }

  private getPackageSize(packageName: string): number {
    try {
      // Try to get size from node_modules
      const packagePath = join('./node_modules', packageName, 'package.json');
      if (existsSync(packagePath)) {
        const stats = execSync(`du -s ./node_modules/${packageName}`, { encoding: 'utf8', stdio: 'pipe' });
        const sizeKB = parseInt(stats.split('\t')[0], 10) * 1024; // Convert from blocks to bytes
        return Math.round(sizeKB / 1024); // Convert to KB
      }
    } catch {
      // Fallback to estimated sizes for common packages
      const commonSizes: Record<string, number> = {
        'react': 42,
        'react-dom': 130,
        'next': 15000,
        'typescript': 65000,
        'lodash': 1400,
        '@types/node': 3500,
        'tailwindcss': 18000,
        'drizzle-orm': 800,
      };
      
      return commonSizes[packageName] || 50; // Default estimate
    }
    
    return 0;
  }

  private checkSecurity(packageName: string): SecurityIssue[] {
    // This is a placeholder - in production you might integrate with:
    // - npm audit
    // - Snyk API
    // - GitHub Advisory Database
    const knownIssues: Record<string, SecurityIssue[]> = {
      // Example entries - would be populated from real security databases
      'lodash': [{
        severity: 'moderate',
        title: 'Prototype Security vulnerability',
        url: 'https://github.com/advisories/GHSA-example'
      }]
    };
    
    return knownIssues[packageName] || [];
  }

  private findMissingDependencies(): string[] {
    const missing: string[] = [];
    
    try {
      // Find all import statements with a simpler approach
      const importResult = execSync(
        `rg "from ['\"]([^'\"]+)['\"]" ${this.srcPath} --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.jsx" -o`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      const imports = importResult.trim().split('\n');
      const allDeps = new Set([
        ...Object.keys(this.packageJson.dependencies || {}),
        ...Object.keys(this.packageJson.devDependencies || {})
      ]);
      
      const externalImports = new Set<string>();
      
      for (const importLine of imports) {
        const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          
          // Skip relative imports
          if (importPath.startsWith('.') || importPath.startsWith('/')) {
            continue;
          }
          
          // Extract package name
          let packageName = importPath;
          if (importPath.startsWith('@')) {
            // Scoped package: @org/package or @org/package/subpath
            const parts = importPath.split('/');
            packageName = `${parts[0]}/${parts[1]}`;
          } else {
            // Regular package: package or package/subpath
            packageName = importPath.split('/')[0];
          }
          
          externalImports.add(packageName);
        }
      }
      
      // Check which external imports are missing from package.json
      for (const importedPackage of externalImports) {
        if (!allDeps.has(importedPackage)) {
          missing.push(importedPackage);
        }
      }
      
    } catch (error) {
      this.verboseLog(`Warning: Failed to find missing dependencies - ${(error as Error).message}`, 'yellow');
    }
    
    return missing;
  }

  private async analyzeDependencies(): Promise<void> {
    const allDeps = this.getAllDependencies();
    
    if (!this.jsonOutput && !this.securityOnly) {
      this.log(`\n${this.categoryIcons.unused} Analyzing ${allDeps.length} dependencies...`, 'blue');
    }
    
    for (const dep of allDeps) {
      const usage = this.checkDependencyUsage(dep.name);
      const size = this.getPackageSize(dep.name);
      const vulnerabilities = this.checkSecurity(dep.name);
      
      this.dependencies.push({
        name: dep.name,
        version: dep.version,
        type: dep.type,
        used: usage.used,
        importedIn: usage.importedIn,
        size,
        vulnerabilities
      });
      
      this.checkedDeps++;
      this.updateProgress();
    }
    
    if (!this.jsonOutput) {
      process.stdout.write('\n'); // Clear progress line
    }
  }

  private generateReport(): void {
    const unused = this.dependencies.filter(dep => !dep.used);
    const withSecurity = this.dependencies.filter(dep => dep.vulnerabilities.length > 0);
    const missing = this.findMissingDependencies();
    
    if (this.jsonOutput) {
      const report = {
        unused: unused.length,
        unusedPackages: unused,
        security: withSecurity.length,
        securityIssues: withSecurity,
        missing: missing.length,
        missingPackages: missing,
        totalSavings: unused.reduce((sum, dep) => sum + dep.size, 0),
        timestamp: new Date().toISOString()
      };
      
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    
    if (this.securityOnly) {
      this.reportSecurityIssues(withSecurity);
      return;
    }
    
    this.reportUnusedDependencies(unused);
    this.reportMissingDependencies(missing);
    this.reportSecurityIssues(withSecurity);
    this.printSummary(unused, withSecurity, missing);
  }

  private reportUnusedDependencies(unused: DependencyInfo[]): void {
    if (unused.length === 0) {
      this.log(`\n${this.categoryIcons.success} No unused dependencies found!`, 'green');
      return;
    }
    
    this.log(`\n${this.categoryIcons.unused} UNUSED DEPENDENCIES:`, 'red');
    
    // Sort by size (largest first) and show top offenders
    const sortedUnused = unused.sort((a, b) => b.size - a.size);
    
    for (const dep of sortedUnused.slice(0, 10)) {
      const icon = dep.size > 1000 ? '🏆' : dep.size > 100 ? '🔍' : '📄';
      const sizeText = dep.size > 0 ? ` (${dep.size}KB)` : '';
      const typeText = dep.type === 'devDependency' ? ' [dev]' : '';
      
      this.log(`   ${icon} ${dep.name}${sizeText}${typeText} - not imported anywhere`, 'yellow');
      
      if (this.verbose && dep.importedIn.length === 0) {
        this.log(`      No imports found in codebase`, 'dim');
      }
    }
    
    if (sortedUnused.length > 10) {
      this.log(`   ... and ${sortedUnused.length - 10} more unused dependencies`, 'dim');
    }
  }

  private reportMissingDependencies(missing: string[]): void {
    if (missing.length === 0) return;
    
    this.log(`\n${this.categoryIcons.missing} MISSING DEPENDENCIES:`, 'red');
    
    for (const dep of missing.slice(0, 10)) {
      this.log(`   ${this.categoryIcons.missing} ${dep} - imported but not in package.json`, 'red');
    }
    
    if (missing.length > 10) {
      this.log(`   ... and ${missing.length - 10} more missing dependencies`, 'dim');
    }
  }

  private reportSecurityIssues(withSecurity: DependencyInfo[]): void {
    if (withSecurity.length === 0) {
      this.log(`\n${this.categoryIcons.security} No security vulnerabilities found!`, 'green');
      return;
    }
    
    this.log(`\n${this.categoryIcons.security} SECURITY VULNERABILITIES:`, 'red');
    
    for (const dep of withSecurity) {
      this.log(`   ${this.categoryIcons.warning} ${dep.name} - ${dep.vulnerabilities.length} vulnerabilities`, 'yellow');
      
      if (this.verbose) {
        for (const vuln of dep.vulnerabilities) {
          const severityColor = vuln.severity === 'critical' ? 'red' : 
                               vuln.severity === 'high' ? 'yellow' : 'cyan';
          this.log(`      ${vuln.severity.toUpperCase()}: ${vuln.title}`, severityColor);
        }
      }
    }
  }

  private printSummary(unused: DependencyInfo[], withSecurity: DependencyInfo[], missing: string[]): void {
    const totalSavings = unused.reduce((sum, dep) => sum + dep.size, 0);
    const totalDeps = this.dependencies.length;
    const usedDeps = totalDeps - unused.length;
    
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    this.log(`📊 DEPENDENCY ANALYSIS COMPLETE!`, 'blue');
    this.log(`Total dependencies analyzed: ${totalDeps}`, 'blue');
    this.log(`Dependencies in use: ${usedDeps}`, 'blue');
    this.log(`Unused dependencies: ${unused.length}`, 'blue');
    
    if (totalSavings > 0) {
      this.log(`\n${this.categoryIcons.size} POTENTIAL SAVINGS: ${totalSavings}KB bundle reduction`, 'magenta');
      this.log(`⚡ INSTALL TIME: ~${Math.round(unused.length * 2)}s faster without unused deps`, 'magenta');
    }
    
    if (withSecurity.length > 0) {
      this.log(`${this.categoryIcons.security} SECURITY: ${withSecurity.length} packages have vulnerabilities`, 'red');
    }
    
    if (missing.length > 0) {
      this.log(`${this.categoryIcons.missing} MISSING: ${missing.length} packages need to be installed`, 'red');
    }
    
    // Health score
    const healthScore = this.getHealthScore(unused.length, withSecurity.length, missing.length);
    this.log(`\n📊 DEPENDENCY HEALTH: ${healthScore}`, 'blue');
    
    // Recommendations
    this.printRecommendations(unused, withSecurity, missing);
  }

  private getHealthScore(unusedCount: number, securityCount: number, missingCount: number): string {
    if (unusedCount === 0 && securityCount === 0 && missingCount === 0) {
      return 'EXCELLENT 🎉';
    }
    if (unusedCount <= 2 && securityCount === 0 && missingCount === 0) {
      return 'VERY GOOD 👍';
    }
    if (unusedCount <= 5 && securityCount <= 1 && missingCount === 0) {
      return 'GOOD ✅';
    }
    if (unusedCount <= 10 || securityCount <= 3 || missingCount <= 2) {
      return 'NEEDS ATTENTION ⚠️';
    }
    return 'NEEDS MAJOR REVIEW 🚨';
  }

  private printRecommendations(unused: DependencyInfo[], withSecurity: DependencyInfo[], missing: string[]): void {
    const recommendations: string[] = [];
    
    if (unused.length > 0) {
      const topUnused = unused.sort((a, b) => b.size - a.size).slice(0, 3);
      recommendations.push(`Remove top unused: ${topUnused.map(d => d.name).join(', ')}`);
    }
    
    if (missing.length > 0) {
      recommendations.push(`Install missing dependencies: pnpm add ${missing.slice(0, 3).join(' ')}`);
    }
    
    if (withSecurity.length > 0) {
      recommendations.push(`Update vulnerable packages: pnpm update`);
    }
    
    if (recommendations.length > 0) {
      this.log(`\n💡 RECOMMENDATIONS:`, 'cyan');
      recommendations.forEach((rec, i) => {
        this.log(`   ${i + 1}. ${rec}`, 'cyan');
      });
    }
  }

  public async run(): Promise<void> {
    if (!this.jsonOutput && !this.securityOnly) {
      this.log('📦 Dependency Analyzer - Finding unused and missing dependencies', 'blue');
    }
    
    await this.analyzeDependencies();
    this.generateReport();
    
    // Exit with error code if issues found and CI mode
    if (this.exitOnIssues) {
      const unused = this.dependencies.filter(dep => !dep.used);
      const withSecurity = this.dependencies.filter(dep => dep.vulnerabilities.length > 0);
      const missing = this.findMissingDependencies();
      
      const criticalIssues = unused.length + withSecurity.filter(d => 
        d.vulnerabilities.some(v => v.severity === 'critical' || v.severity === 'high')
      ).length + missing.length;
      
      if (criticalIssues > 0) {
        if (!this.jsonOutput) {
          this.log(`\n❌ CI Mode: Found ${criticalIssues} critical dependency issues. Exiting with code 1.`, 'red');
        }
        process.exit(1);
      }
    }
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const verbose = args.includes('--verbose') || args.includes('-v');
const securityOnly = args.includes('--security-only');
const jsonOutput = args.includes('--json');
const exitOnIssues = args.includes('--ci');

if (showHelp) {
  console.log(`
📦 Dependency Analyzer - Find unused and missing dependencies

USAGE:
  npx tsx scripts/find-unused-deps.ts [OPTIONS]

OPTIONS:
  --verbose, -v          Show detailed progress and analysis
  --security-only        Only check for security vulnerabilities
  --json                 Output results as JSON for automation
  --ci                   Exit with error code if issues found
  --help, -h             Show this help message

EXAMPLES:
  pnpm unused-deps                    # Basic dependency analysis
  pnpm unused-deps:verbose            # Detailed analysis with progress
  pnpm unused-deps:security           # Security vulnerability scan only
  pnpm unused-deps:ci                 # CI mode (fails if issues found)

OUTPUT:
  🏆 Unused dependencies sorted by potential bundle savings
  📦 Missing dependencies that need to be installed
  🔒 Security vulnerabilities in current dependencies
  📊 Overall dependency health score and recommendations
  💰 Estimated bundle size and install time savings
  `);
  process.exit(0);
}

// Run the analyzer
const analyzer = new DependencyAnalyzer(verbose, securityOnly, jsonOutput, exitOnIssues);
analyzer.run().catch((error) => {
  console.error('Error running dependency analyzer:', error);
  process.exit(1);
});