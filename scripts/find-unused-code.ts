#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import { execSync } from "child_process";

type UnusedItem = {
  file: string;
  element: string;
  line: number;
  usageType: "unused" | "docs-only";
};

type Colors = {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  reset: string;
  dim: string;
};

const colors: Colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

class UnusedCodeFinder {
  private searchPaths = ["./src", "./scripts"];
  private scanPaths = ["./src"]; // Only scan src for unused code detection
  private unusedItems: UnusedItem[] = [];
  private checkedItems = 0;
  private verbose = false;
  private excludePatterns = [
    // Common patterns that might be false positives
    "default",
    "index",
    "props",
    "children",
    "className",
    "onClick",
    "onChange",
    "onSubmit",
    // React/Next.js specific
    "Page",
    "Layout",
    "loading",
    "error",
    "not-found",
    // JavaScript/TypeScript keywords and common words
    "if",
    "else",
    "for",
    "while",
    "do",
    "try",
    "catch",
    "finally",
    "throw",
    "return",
    "break",
    "continue",
    "switch",
    "case",
    "new",
    "delete",
    "typeof",
    "instanceof",
    "in",
    "of",
    "var",
    "let",
    "const",
    "function",
    "class",
    "extends",
    "implements",
    "import",
    "export",
    "from",
    "as",
    "type",
    "interface",
    "enum",
    "namespace",
    "module",
    // Common single letters and short words
    "a",
    "i",
    "e",
    "x",
    "y",
    "z",
    "id",
    "key",
    "ref",
    "src",
    "alt",
    "href",
    "name",
    "value",
    "data",
    "item",
    "items",
    "result",
    "results",
    "error",
    "success",
    "status",
    "state",
    "props",
    "context",
    "config",
    "options",
  ];

  constructor(
    verbose = false,
    private jsonOutput = false,
    private exitOnFound = false
  ) {
    this.verbose = verbose;
  }

  private log(message: string, color: keyof Colors = "reset"): void {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private verboseLog(message: string, color: keyof Colors = "reset"): void {
    if (this.verbose) {
      this.log(message, color);
    }
  }

  private getAllTsFiles(): string[] {
    try {
      // Get all files from scan paths only (excludes scripts)
      const result = execSync(
        `find ${this.scanPaths.join(
          " "
        )} -type f \\( -name "*.ts" -o -name "*.tsx" \\)`,
        { encoding: "utf8" }
      );
      return result
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);
    } catch (error) {
      this.log(
        `Error finding TypeScript files: ${(error as Error).message}`,
        "red"
      );
      return [];
    }
  }

  private isNextJsSpecialFile(filePath: string): boolean {
    // Check if this is a Next.js special file that gets used by the framework
    const nextJsPatterns = [
      // Page files
      /\/page\.(ts|tsx)$/,
      // Layout files
      /\/layout\.(ts|tsx)$/,
      // Loading files
      /\/loading\.(ts|tsx)$/,
      // Error files
      /\/error\.(ts|tsx)$/,
      // Not found files
      /\/not-found\.(ts|tsx)$/,
      // Global error files
      /\/global-error\.(ts|tsx)$/,
      // Template files
      /\/template\.(ts|tsx)$/,
      // Route handlers
      /\/route\.(ts|tsx)$/,
      // Middleware
      /\/middleware\.(ts|tsx)$/,
    ];

    return nextJsPatterns.some((pattern) => pattern.test(filePath));
  }

  private shouldSkipElement(elementName: string, filePath: string): boolean {
    // Skip if it's in our exclude patterns
    if (this.excludePatterns.includes(elementName)) {
      return true;
    }

    // Skip React lifecycle methods - these are called by React, not user code
    const reactLifecycleMethods = [
      "getDerivedStateFromError",
      "componentDidCatch",
      "componentDidMount",
      "componentDidUpdate",
      "componentWillUnmount",
      "shouldComponentUpdate",
      "getSnapshotBeforeUpdate",
    ];
    if (reactLifecycleMethods.includes(elementName)) {
      return true;
    }

    // Skip TypeScript type imports that are used in complex patterns
    const commonTypeImports = [
      "ClassValue", // Used in cn() function parameters
      "ErrorInfo", // Used in React error boundary interfaces
      "ToasterProps", // Used in component props and type assertions
      "ReactNode", // Used in React component interfaces
      "ComponentProps", // Used in component prop derivations
    ];
    if (commonTypeImports.includes(elementName)) {
      return true;
    }

    // Skip Drizzle ORM relation definitions (used implicitly by the ORM)
    if (elementName.endsWith("Relations") && filePath.includes("schema.")) {
      return true;
    }

    // Skip Next.js page components and other framework conventions
    if (this.isNextJsSpecialFile(filePath)) {
      // Common Next.js component naming patterns
      const nextJsPatterns = [
        /Page$/, // ComponentPage, RLSTestPage
        /Layout$/, // DashboardLayout
        /Loading$/, // ComponentLoading
        /Error$/, // ComponentError
        /NotFound$/, // ComponentNotFound
        /Template$/, // ComponentTemplate
        /Route$/, // API route handlers
        /Handler$/, // API handlers
        /Middleware$/, // Middleware functions
      ];

      if (nextJsPatterns.some((pattern) => pattern.test(elementName))) {
        return true;
      }
    }

    // Skip React component patterns that might be used indirectly
    const reactPatterns = [
      /^[A-Z][A-Za-z]*Provider$/, // AuthProvider, ThemeProvider
      /^[A-Z][A-Za-z]*Context$/, // UserContext, AppContext
      /^use[A-Z][A-Za-z]*$/, // useAuth, useState (custom hooks)
    ];

    return reactPatterns.some((pattern) => pattern.test(elementName));
  }

  private extractCodeElements(filePath: string, content: string): string[] {
    const elements = new Set<string>();

    // Function declarations
    const functionPatterns = [
      // Regular functions (must start with letter or underscore, not keywords)
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      // Arrow functions and const functions (minimum 3 chars)
      /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]{2,})\s*[:=]\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]*=>)/g,
      // Method definitions in classes/objects (minimum 3 chars, exclude common methods)
      /(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]{2,})\s*\([^)]*\)\s*(?:\{|:)/g,
    ];

    // Type definitions
    const typePatterns = [
      // Types and interfaces (minimum 3 chars)
      /(?:export\s+)?(?:type|interface)\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      // Enums (minimum 3 chars)
      /(?:export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      // Classes (minimum 3 chars)
      /(?:export\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
    ];

    // Constants and variables
    const varPatterns = [
      // Exported constants (minimum 3 chars, typically UPPER_CASE)
      /export\s+const\s+([A-Z_][A-Z0-9_]{2,})/g,
      // Regular exported variables (minimum 3 chars, exclude common patterns)
      /export\s+(?:let|const|var)\s+([A-Za-z_$][A-Za-z0-9_$]{2,})(?!\s*[:=]\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]*=>))/g,
    ];

    const allPatterns = [...functionPatterns, ...typePatterns, ...varPatterns];

    for (const pattern of allPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (
          name &&
          name.length > 2 &&
          !this.shouldSkipElement(name, filePath)
        ) {
          elements.add(name);
        }
      }
    }

    return Array.from(elements);
  }

  private checkReactComponentUsage(
    elementName: string,
    originFile: string
  ): boolean {
    try {
      // Check for JSX usage: <ComponentName> or <ComponentName ... >
      const jsxPattern = `<${elementName}(?:\\s|>|/)`;

      const result = execSync(
        `rg "${jsxPattern}" ${this.searchPaths.join(
          " "
        )} --glob "*.tsx" --glob "*.ts" -l`,
        { encoding: "utf8", stdio: "pipe" }
      );

      const matchingFiles = result
        .trim()
        .split("\n")
        .filter((file) => file !== originFile && file.length > 0);
      return matchingFiles.length > 0;
    } catch {
      return false;
    }
  }

  private checkElementUsage(
    elementName: string,
    originFile: string
  ): "used" | "unused" | "docs-only" {
    try {
      // First check if it's a React component (PascalCase starting with capital)
      const isComponent = /^[A-Z][A-Za-z0-9]*$/.test(elementName);

      if (
        isComponent &&
        this.checkReactComponentUsage(elementName, originFile)
      ) {
        return "used";
      }

      // Simple and fast: just use word boundaries and trust ripgrep
      // The file verification was the main performance bottleneck
      let foundInCode = false;
      let foundInDocs = false;

      try {
        // Use word boundary pattern but also check for method calls like this.methodName
        const wordBoundaryPattern = `\\b${elementName}\\b`;
        const methodCallPattern = `\\.${elementName}\\b`;

        const result = execSync(
          `rg "${wordBoundaryPattern}|${methodCallPattern}" ${this.searchPaths.join(
            " "
          )} --glob "*.ts" --glob "*.tsx" -l`,
          { encoding: "utf8", stdio: "pipe" }
        );

        const allMatchingFiles = result
          .trim()
          .split("\n")
          .filter((file) => file.length > 0);
        const externalFiles = allMatchingFiles.filter(
          (file) => file !== originFile
        );
        const hasOriginFile = allMatchingFiles.includes(originFile);

        foundInCode = externalFiles.length > 0;

        // If not found externally but found in origin file, check internal usage
        if (!foundInCode && hasOriginFile) {
          foundInCode = this.isUsedInternally(elementName, originFile);
        }
      } catch (error) {
        // rg returns non-zero exit code when no matches found
      }

      // Only check docs if not found in code (optimization)
      // Exclude refactoring documentation and context files - these are meta-documentation about code changes
      if (!foundInCode) {
        try {
          execSync(
            `rg "\\b${elementName}\\b" . --glob "*.md" --glob "!docs/refactoring-reports/**" --glob "!docs/context/**" -q`,
            {
              stdio: "pipe",
            }
          );
          foundInDocs = true;
        } catch (error) {
          // rg returns non-zero exit code when no matches found
        }
      }

      if (foundInCode) {
        return "used";
      } else if (foundInDocs) {
        return "docs-only";
      } else {
        return "unused";
      }
    } catch (error) {
      // If there's an error, assume it's used to be safe
      return "used";
    }
  }

  private isUsedInternally(elementName: string, filePath: string): boolean {
    try {
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // Special handling for TypeScript type imports with complex usage patterns
      if (this.isTypeImportWithComplexUsage(elementName, content)) {
        return true;
      }

      // Find all lines where the element appears - use precise matching
      const definitionLines: number[] = [];
      const usageLines: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Use word boundary pattern but also check for method calls like this.elementName
        const wordBoundaryPattern = new RegExp(`\\b${elementName}\\b`);
        const methodCallPattern = new RegExp(`\\.${elementName}\\b`);

        if (wordBoundaryPattern.test(line) || methodCallPattern.test(line)) {
          // Check if this line contains a definition vs usage
          // A definition line should have keywords like private, public, function, const, etc. BEFORE the elementName
          // More precise: require the definition pattern to be at start of declaration
          const definitionPattern = new RegExp(
            `^\\s*(?:export\\s+)?(?:private\\s+|public\\s+|protected\\s+)?(?:static\\s+)?(?:async\\s+)?(?:function\\s+${elementName}|const\\s+${elementName}|class\\s+${elementName}|interface\\s+${elementName}|type\\s+${elementName}|enum\\s+${elementName})(?!\\w)`
          );

          // Also check for arrow function definitions: const name = () =>
          const arrowFunctionPattern = new RegExp(
            `^\\s*(?:export\\s+)?const\\s+${elementName}\\s*=\\s*\\(`
          );

          // Check for class method definitions (private/public/protected methodName(...): type {)
          const methodDefinitionPattern = new RegExp(
            `^\\s*(?:private\\s+|public\\s+|protected\\s+)?(?:static\\s+)?(?:async\\s+)?${elementName}\\s*\\([^)]*\\)\\s*(?::\\s*[^{]+)?\\s*\\{`
          );

          // Check if this is a definition line
          if (
            definitionPattern.test(line) ||
            arrowFunctionPattern.test(line) ||
            methodDefinitionPattern.test(line)
          ) {
            // Make sure it's not a method call that happens to match the pattern
            const callPattern = new RegExp(`\\.${elementName}\\s*\\(`);
            if (!callPattern.test(line)) {
              definitionLines.push(i);
            } else {
              // This is actually a method call, not a definition
              usageLines.push(i);
            }
          } else {
            // This is a usage line (method calls, JSX, type usage, etc.)
            usageLines.push(i);
          }
        }
      }

      // If we have definitions and usages, and they're on different lines, it's used internally
      return (
        definitionLines.length > 0 &&
        usageLines.length > 0 &&
        usageLines.some((usage) => !definitionLines.includes(usage))
      );
    } catch (error) {
      return false;
    }
  }

  private isTypeImportWithComplexUsage(
    elementName: string,
    content: string
  ): boolean {
    // Check for TypeScript type imports that are used in complex patterns
    // that the regex might miss

    // Pattern 1: Used in function parameters as array types (ClassValue[])
    const arrayTypePattern = new RegExp(`${elementName}\\[\\]`);
    if (arrayTypePattern.test(content)) {
      return true;
    }

    // Pattern 2: Used in type assertions (as TypeName["property"])
    const typeAssertionPattern = new RegExp(`as\\s+${elementName}\\[`);
    if (typeAssertionPattern.test(content)) {
      return true;
    }

    // Pattern 3: Used in object destructuring with type annotation
    // ({ ...props }: TypeName)
    const destructuringPattern = new RegExp(`\\}\\s*:\\s*${elementName}`);
    if (destructuringPattern.test(content)) {
      return true;
    }

    // Pattern 4: Used in generic constraints or type combinations
    const genericPattern = new RegExp(`<[^>]*${elementName}[^>]*>`);
    if (genericPattern.test(content)) {
      return true;
    }

    // Pattern 5: Used in function parameter type annotations (including union types)
    // function name(param: TypeName | undefined) or (param: TypeName, ...)
    const functionParamPattern = new RegExp(`\\([^)]*:\\s*[^,)]*\\b${elementName}\\b[^,)]*[,)]`);
    if (functionParamPattern.test(content)) {
      return true;
    }

    // Pattern 6: Used in return type annotations
    // function name(): TypeName | SomethingElse
    const returnTypePattern = new RegExp(`\\)\\s*:\\s*[^{]*\\b${elementName}\\b[^{]*(?:\\{|;|$)`);
    if (returnTypePattern.test(content)) {
      return true;
    }

    // Pattern 7: Used in variable type annotations
    // const variable: TypeName | undefined
    const variableTypePattern = new RegExp(`:\\s*[^=]*\\b${elementName}\\b[^=]*=`);
    if (variableTypePattern.test(content)) {
      return true;
    }

    // Pattern 8: Used in union types (TypeName | OtherType)
    const unionTypePattern = new RegExp(`\\b${elementName}\\s*\\|[^;]+|[^;]+\\|\\s*${elementName}\\b`);
    if (unionTypePattern.test(content)) {
      return true;
    }

    return false;
  }

  private getLineNumber(content: string, elementName: string): number {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(elementName)) {
        return i + 1;
      }
    }
    return 1;
  }

  private processFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, "utf8");
      const elements = this.extractCodeElements(filePath, content);

      this.verboseLog(
        `\nChecking ${filePath} (${elements.length} elements)`,
        "dim"
      );

      for (const element of elements) {
        this.checkedItems++;

        if (this.verbose) {
          process.stdout.write(
            `\r${colors.dim}Checked: ${this.checkedItems} items${colors.reset}`
          );
        } else if (this.checkedItems % 10 === 0) {
          // Show progress every 10 items in non-verbose mode
          process.stdout.write(
            `\r${colors.dim}Progress: ${this.checkedItems} items checked${colors.reset}`
          );
        }

        const usageStatus = this.checkElementUsage(element, filePath);
        if (usageStatus !== "used") {
          this.unusedItems.push({
            file: filePath,
            element: element,
            line: this.getLineNumber(content, element),
            usageType: usageStatus === "docs-only" ? "docs-only" : "unused",
          });
        }
      }
    } catch (error) {
      this.verboseLog(
        `Error processing ${filePath}: ${(error as Error).message}`,
        "red"
      );
    }
  }

  private outputJson(): void {
    const { trulyUnused, docsOnly, categories } = this.categorizeUnusedItems();
    const result = {
      summary: {
        totalChecked: this.checkedItems,
        completelyUnused: trulyUnused.length,
        docsOnly: docsOnly.length,
        healthScore: this.getHealthScore(
          ((trulyUnused.length / this.checkedItems) * 100).toFixed(1)
        ),
        cleanupPercentage: (
          (trulyUnused.length / this.checkedItems) *
          100
        ).toFixed(1),
      },
      categories: {
        functions: categories.functions.length,
        types: categories.types.length,
        constants: categories.constants.length,
      },
      unused: trulyUnused.map((item) => ({
        file: item.file.replace("./src/", ""),
        element: item.element,
        line: item.line,
        type: item.usageType,
      })),
      docsOnly: docsOnly.map((item) => ({
        file: item.file.replace("./src/", ""),
        element: item.element,
        line: item.line,
        type: item.usageType,
      })),
    };

    console.log(JSON.stringify(result, null, 2));
  }

  private reportResults(): void {
    if (this.jsonOutput) {
      this.outputJson();
      return;
    }

    this.log(`\n\n📊 Analysis Complete!`, "green");
    this.log(`Total items checked: ${this.checkedItems}`, "dim");

    const trulyUnused = this.unusedItems.filter(
      (item) => item.usageType === "unused"
    );
    const docsOnly = this.unusedItems.filter(
      (item) => item.usageType === "docs-only"
    );

    this.log(`Completely unused items: ${trulyUnused.length}`, "yellow");
    this.log(`Items only used in docs: ${docsOnly.length}`, "blue");

    if (this.unusedItems.length === 0) {
      this.log(
        "\n🎉 No unused code found! Your codebase looks clean.",
        "green"
      );
      return;
    }

    // Group by usage type and file
    const groupedByType = this.unusedItems.reduce(
      (acc: Record<string, Record<string, UnusedItem[]>>, item) => {
        if (!acc[item.usageType]) {
          acc[item.usageType] = {};
        }
        if (!acc[item.usageType][item.file]) {
          acc[item.usageType][item.file] = [];
        }
        acc[item.usageType][item.file].push(item);
        return acc;
      },
      {}
    );

    // Display completely unused items first
    if (trulyUnused.length > 0) {
      this.log("\n🚨 COMPLETELY UNUSED (safe to remove):", "red");
      this.log(
        "   These items are not used anywhere in code or documentation\n"
      );

      if (groupedByType["unused"]) {
        for (const [file, items] of Object.entries(groupedByType["unused"])) {
          this.log(`📁 ${file}`, "blue");
          for (const item of items) {
            this.log(`   ❌ ${item.element} (line ~${item.line})`, "red");
          }
          this.log("");
        }
      }
    }

    // Display docs-only items
    if (docsOnly.length > 0) {
      this.log("\n📚 ONLY USED IN DOCUMENTATION:", "yellow");
      this.log(
        "   These items are referenced in .md files but not used in code\n"
      );

      if (groupedByType["docs-only"]) {
        for (const [file, items] of Object.entries(
          groupedByType["docs-only"]
        )) {
          this.log(`📁 ${file}`, "blue");
          for (const item of items) {
            this.log(`   📖 ${item.element} (line ~${item.line})`, "yellow");
          }
          this.log("");
        }
      }
    }

    this.log("💡 Next steps:", "yellow");
    this.log("   1. Red items (❌) are likely safe to remove");
    this.log(
      "   2. Yellow items (📖) are in docs - decide if you want to keep them"
    );
    this.log(
      "   3. Some may be used in ways not detected (dynamic imports, etc.)"
    );
    this.log("   4. Run your tests after removal to ensure nothing breaks\n");

    // Add summary
    this.printSummary();
  }

  private categorizeUnusedItems() {
    const trulyUnused = this.unusedItems.filter(
      (item) => item.usageType === "unused"
    );
    const docsOnly = this.unusedItems.filter(
      (item) => item.usageType === "docs-only"
    );

    // Categorize by type for better insights
    const categories = {
      functions: trulyUnused.filter((item) => /^[a-z]/.test(item.element)), // camelCase = functions
      types: trulyUnused.filter(
        (item) =>
          /^[A-Z]/.test(item.element) && /[A-Z]/.test(item.element.slice(1))
      ), // PascalCase = types/classes
      constants: trulyUnused.filter((item) => /^[A-Z_]+$/.test(item.element)), // UPPER_CASE = constants
    };

    return { trulyUnused, docsOnly, categories };
  }

  private printSummary(): void {
    const { trulyUnused, docsOnly, categories } = this.categorizeUnusedItems();

    this.log("📊 CLEANUP SUMMARY", "green");
    this.log("━".repeat(50), "dim");

    // Calculate potential savings
    const totalPotentialCleanup = trulyUnused.length;
    const reviewRequired = docsOnly.length;

    if (totalPotentialCleanup === 0 && reviewRequired === 0) {
      this.log(
        "🎉 Your codebase is already clean! No unused code detected.",
        "green"
      );
      this.log(
        `📈 Code health: EXCELLENT (${this.checkedItems} items analyzed)`,
        "green"
      );
      return;
    }

    // Cleanup priority with categorization
    if (totalPotentialCleanup > 0) {
      this.log(
        `🚨 HIGH PRIORITY: ${totalPotentialCleanup} items safe to remove`,
        "red"
      );
      this.log(
        "   These are definitely unused and can be deleted immediately",
        "dim"
      );

      // Show breakdown by category
      if (categories.functions.length > 0)
        this.log(`   📝 Functions: ${categories.functions.length}`, "dim");
      if (categories.types.length > 0)
        this.log(`   🏗️  Types/Classes: ${categories.types.length}`, "dim");
      if (categories.constants.length > 0)
        this.log(`   🔢 Constants: ${categories.constants.length}`, "dim");
    }

    if (reviewRequired > 0) {
      this.log(
        `📋 REVIEW NEEDED: ${reviewRequired} items only in documentation`,
        "yellow"
      );
      this.log(
        "   Decide if these should remain for docs or be removed",
        "dim"
      );
    }

    // File-based breakdown
    const fileStats = this.getFileStats();
    if (fileStats.length > 0) {
      this.log("\n📁 TOP FILES NEEDING CLEANUP:", "blue");
      fileStats.slice(0, 5).forEach((stat, index) => {
        const icon = index < 3 ? "🏆" : "📄";
        this.log(`   ${icon} ${stat.file} (${stat.count} items)`, "blue");
      });

      if (fileStats.length > 5) {
        this.log(`   ... and ${fileStats.length - 5} more files`, "dim");
      }
    }

    // Impact assessment
    const cleanupPercentage = (
      (totalPotentialCleanup / this.checkedItems) *
      100
    ).toFixed(1);
    this.log("\n📈 IMPACT ASSESSMENT:", "green");
    this.log(
      `   Codebase health: ${this.getHealthScore(cleanupPercentage)}`,
      "green"
    );
    this.log(
      `   Cleanup potential: ${cleanupPercentage}% of analyzed code`,
      "dim"
    );
    this.log(
      `   Confidence: HIGH (excludes Next.js pages, internal usage, common patterns)`,
      "dim"
    );

    // Quick commands
    if (totalPotentialCleanup > 0) {
      this.log("\n⚡ QUICK ACTIONS:", "yellow");
      this.log("   1. Start with files having the most unused items", "dim");
      this.log("   2. Remove unused exports first (safest)", "dim");
      this.log("   3. Run tests after each cleanup batch", "dim");

      const estimatedTime = Math.ceil(totalPotentialCleanup / 10); // ~10 items per minute
      this.log(
        `   ⏱️  Estimated cleanup time: ~${estimatedTime} minutes`,
        "dim"
      );
    }

    this.log("\n" + "━".repeat(50), "dim");
  }

  private getFileStats(): Array<{ file: string; count: number }> {
    const fileMap = new Map<string, number>();

    this.unusedItems
      .filter((item) => item.usageType === "unused") // Only count truly unused items
      .forEach((item) => {
        const count = fileMap.get(item.file) || 0;
        fileMap.set(item.file, count + 1);
      });

    return Array.from(fileMap.entries())
      .map(([file, count]) => ({ file: file.replace("./src/", ""), count }))
      .sort((a, b) => b.count - a.count);
  }

  private getHealthScore(cleanupPercentage: string): string {
    const percentage = parseFloat(cleanupPercentage);

    if (percentage === 0) return "EXCELLENT 🎉";
    if (percentage < 2) return "VERY GOOD 👍";
    if (percentage < 5) return "GOOD ✅";
    if (percentage < 10) return "NEEDS ATTENTION ⚠️";
    return "NEEDS MAJOR CLEANUP 🚨";
  }

  public async run(): Promise<void> {
    this.verboseLog("🔍 Finding unused code in TypeScript files...", "blue");

    const tsFiles = this.getAllTsFiles();
    this.verboseLog(
      `Found ${tsFiles.length} TypeScript files to analyze`,
      "green"
    );

    if (!this.verbose) {
      this.log("🔍 Analyzing codebase for unused code...", "blue");
    }

    const startTime = Date.now();

    // Filter out files with no extractable elements early (performance optimization)
    const filesToProcess = tsFiles.filter((file) => {
      try {
        const content = readFileSync(file, "utf8");
        return (
          content.length > 100 && // Skip tiny files
          /(?:export|function|const|class|interface|type|enum)/.test(content)
        ); // Has extractable elements
      } catch {
        return false; // Skip unreadable files
      }
    });

    const skipped = tsFiles.length - filesToProcess.length;
    this.verboseLog(
      `Processing ${filesToProcess.length}/${tsFiles.length} files with potential unused code`,
      "dim"
    );
    if (skipped > 0) {
      this.verboseLog(
        `Skipped ${skipped} files (too small or no extractable code)`,
        "dim"
      );
    }

    // Process each file
    for (const file of filesToProcess) {
      this.processFile(file);
    }

    // Clear the progress line
    process.stdout.write("\r" + " ".repeat(60) + "\r");

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    this.verboseLog(`\nAnalysis completed in ${duration}s`, "dim");

    // Report results
    this.reportResults();

    // Handle CI mode - exit with error code if unused items found
    if (this.exitOnFound) {
      const trulyUnused = this.unusedItems.filter(
        (item) => item.usageType === "unused"
      );
      if (trulyUnused.length > 0) {
        if (!this.jsonOutput) {
          this.log(
            `\n❌ CI Mode: Found ${trulyUnused.length} unused items. Exiting with code 1.`,
            "red"
          );
        }
        process.exit(1);
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");
const showHelp = args.includes("--help") || args.includes("-h");
const jsonOutput = args.includes("--json");
const exitOnFound = args.includes("--ci");

if (showHelp) {
  console.log(`
🔍 Unused Code Finder

USAGE:
  npx tsx scripts/find-unused-code.ts [OPTIONS]

OPTIONS:
  --verbose, -v     Show detailed progress and file-by-file analysis
  --json            Output results as JSON (for CI/automation)
  --ci              Exit with code 1 if unused code found (for CI)
  --help, -h        Show this help message

EXAMPLES:
  pnpm unused-code                          # Quick analysis
  pnpm unused-code:verbose                  # Detailed analysis  
  pnpm unused-code:json                     # JSON output for automation
  pnpm unused-code:ci                       # CI mode (fails if unused code found)

OUTPUT:
  🚨 RED items (❌)    - Safe to remove (completely unused)
  📖 YELLOW items (📖) - Only in documentation (review needed)
  `);
  process.exit(0);
}

// Run the analyzer
const finder = new UnusedCodeFinder(verbose, jsonOutput, exitOnFound);
finder.run().catch((error) => {
  console.error("Error running unused code finder:", error);
  process.exit(1);
});
