import { existsSync, readFileSync } from "node:fs";
import { execSync } from "child_process";


export type Colors = {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  reset: string;
  dim: string;
};

export const colors: Colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

export class SharedCodeAnalyzer {
  protected srcPath = "./src";
  protected verbose = false;
  protected jsonOutput = false;
  
  protected excludePatterns = [
    // Common patterns that might be false positives
    "default", "index", "props", "children", "className",
    "onClick", "onChange", "onSubmit",
    // React/Next.js specific
    "Page", "Layout", "loading", "error", "not-found",
    // JavaScript/TypeScript keywords
    "if", "else", "for", "while", "do", "try", "catch", "finally",
    "throw", "return", "break", "continue", "switch", "case",
    "new", "delete", "typeof", "instanceof", "in", "of",
    "var", "let", "const", "function", "class", "extends",
    "implements", "import", "export", "from", "as", "type",
    "interface", "enum", "namespace", "module",
    // Common single letters and short words
    "a", "i", "e", "x", "y", "z", "id", "key", "ref", "src",
    "alt", "href", "name", "value", "data", "item", "items",
    "result", "results", "error", "success", "status", "state",
    "props", "context", "config", "options",
  ];

  constructor(verbose = false, jsonOutput = false) {
    this.verbose = verbose;
    this.jsonOutput = jsonOutput;
  }

  protected log(message: string, color: keyof Colors = "reset"): void {
    if (!this.jsonOutput) {
      console.log(`${colors[color]}${message}${colors.reset}`);
    }
  }

  protected verboseLog(message: string, color: keyof Colors = "reset"): void {
    if (this.verbose) {
      this.log(message, color);
    }
  }

  protected isNextJsSpecialFile(filePath: string): boolean {
    const nextJsPatterns = [
      /\/page\.(ts|tsx)$/, /\/layout\.(ts|tsx)$/, /\/loading\.(ts|tsx)$/,
      /\/error\.(ts|tsx)$/, /\/not-found\.(ts|tsx)$/, /\/global-error\.(ts|tsx)$/,
      /\/template\.(ts|tsx)$/, /\/route\.(ts|tsx)$/, /\/middleware\.(ts|tsx)$/,
    ];
    return nextJsPatterns.some((pattern) => pattern.test(filePath));
  }

  protected shouldSkipElement(elementName: string, filePath: string): boolean {
    if (this.excludePatterns.includes(elementName)) {
      return true;
    }

    if (this.isNextJsSpecialFile(filePath)) {
      const nextJsPatterns = [
        /Page$/, /Layout$/, /Loading$/, /Error$/, /NotFound$/,
        /Template$/, /Route$/, /Handler$/, /Middleware$/,
      ];
      if (nextJsPatterns.some((pattern) => pattern.test(elementName))) {
        return true;
      }
    }

    const reactPatterns = [
      /^[A-Z][A-Za-z]*Provider$/, /^[A-Z][A-Za-z]*Context$/,
      /^use[A-Z][A-Za-z]*$/,
    ];
    return reactPatterns.some((pattern) => pattern.test(elementName));
  }

  protected extractCodeElements(filePath: string, content: string): string[] {
    const elements = new Set<string>();

    const functionPatterns = [
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]{2,})\s*[:=]\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]*=>)/g,
      /(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]{2,})\s*\([^)]*\)\s*(?:\{|:)/g,
    ];

    const typePatterns = [
      /(?:export\s+)?(?:type|interface)\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      /(?:export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
      /(?:export\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]{2,})/g,
    ];

    const varPatterns = [
      /export\s+const\s+([A-Z_][A-Z0-9_]{2,})/g,
      /export\s+(?:let|const|var)\s+([A-Za-z_$][A-Za-z0-9_$]{2,})(?!\s*[:=]\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^=]*=>))/g,
    ];

    const allPatterns = [...functionPatterns, ...typePatterns, ...varPatterns];

    for (const pattern of allPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (name && name.length > 2 && !this.shouldSkipElement(name, filePath)) {
          elements.add(name);
        }
      }
    }

    return Array.from(elements);
  }

  protected checkReactComponentUsage(elementName: string, originFile: string): boolean {
    try {
      const jsxPattern = `<${elementName}(?:\\\\s|>|/)`;
      const result = execSync(
        `rg "${jsxPattern}" ${this.srcPath} --glob "*.tsx" --glob "*.ts" -l`,
        { encoding: "utf8", stdio: "pipe" }
      );
      const matchingFiles = result.trim().split("\n").filter(file => file !== originFile && file.length > 0);
      return matchingFiles.length > 0;
    } catch {
      return false;
    }
  }

  protected isUsedInternally(elementName: string, filePath: string): boolean {
    try {
      const content = readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      const definitionLines: number[] = [];
      const usageLines: number[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const exactPattern = new RegExp(`(?<!\\w)${elementName}(?!\\w)`);
        
        if (exactPattern.test(line)) {
          if (new RegExp(
            `(?:export\\s+)?(?:async\\s+)?(?:function|const|class|interface|type|enum)\\s+${elementName}(?!\\w)`,
          ).test(line)) {
            definitionLines.push(i);
          } else {
            usageLines.push(i);
          }
        }
      }

      return (
        definitionLines.length > 0 &&
        usageLines.length > 0 &&
        usageLines.some((usage) => !definitionLines.includes(usage))
      );
    } catch (error) {
      return false;
    }
  }

  protected checkElementUsage(elementName: string, originFile: string): "used" | "unused" | "docs-only" {
    try {
      const isComponent = /^[A-Z][A-Za-z0-9]*$/.test(elementName);
      
      if (isComponent && this.checkReactComponentUsage(elementName, originFile)) {
        return "used";
      }

      let foundInCode = false;
      let foundInDocs = false;

      try {
        const wordBoundaryPattern = `\\b${elementName}\\b`;
        const result = execSync(
          `rg "${wordBoundaryPattern}" ${this.srcPath} --glob "*.ts" --glob "*.tsx" -l`,
          { encoding: "utf8", stdio: "pipe" },
        );

        const allMatchingFiles = result.trim().split("\n").filter(file => file.length > 0);
        const externalFiles = allMatchingFiles.filter(file => file !== originFile);
        const hasOriginFile = allMatchingFiles.includes(originFile);

        foundInCode = externalFiles.length > 0;

        if (!foundInCode && hasOriginFile) {
          foundInCode = this.isUsedInternally(elementName, originFile);
        }
      } catch (error) {
        // rg returns non-zero exit code when no matches found
      }

      if (!foundInCode) {
        try {
          execSync(
            `rg "\\b${elementName}\\b" . --glob "*.md" --glob "!docs/refactoring-reports/**" --glob "!docs/context/**" -q`,
            { stdio: "pipe" }
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
      return "used";
    }
  }

  protected getLineNumber(content: string, elementName: string): number {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(elementName)) {
        return i + 1;
      }
    }
    return 1;
  }

  protected validateEnvironment(): boolean {
    if (!existsSync('./src')) {
      this.log('Error: ./src directory not found. Run from project root.', 'red');
      return false;
    }
    
    try {
      execSync('which rg', { stdio: 'pipe' });
    } catch {
      this.log('Warning: ripgrep not found. Install with: brew install ripgrep', 'yellow');
      this.log('Falling back to slower search methods', 'dim');
    }
    
    return true;
  }
}