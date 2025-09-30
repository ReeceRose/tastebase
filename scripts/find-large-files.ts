#!/usr/bin/env tsx

import { statSync } from "node:fs";
import { execSync } from "child_process";

type LargeFile = {
  path: string;
  lines: number;
  sizeBytes: number;
  sizeFormatted: string;
  category:
    | "component"
    | "page"
    | "api"
    | "layout"
    | "server-action"
    | "hook"
    | "util"
    | "other";
  type: "ts" | "tsx";
};

type Colors = {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  reset: string;
  dim: string;
  magenta: string;
  cyan: string;
};

const colors: Colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

class LargeFileFinder {
  private srcPath = "./src";
  private largeFiles: LargeFile[] = [];
  private checkedFiles = 0;
  private verbose = false;
  private minLines = 50; // Default minimum lines
  private useSize = false; // Use line count by default

  constructor(
    verbose = false,
    minThreshold = 50,
    private reverseOrder = false,
    useSize = false,
  ) {
    this.verbose = verbose;
    this.useSize = useSize;
    if (useSize) {
      this.minSizeKB = minThreshold;
    } else {
      this.minLines = minThreshold;
    }
  }

  private minSizeKB = 5;

  private log(message: string, color: keyof Colors = "reset"): void {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private verboseLog(message: string, color: keyof Colors = "reset"): void {
    if (this.verbose) {
      this.log(message, color);
    }
  }

  private getAllNextJsFiles(): string[] {
    try {
      // Use find with basic filtering for maximum speed
      const result = execSync(
        `find ${this.srcPath} -type f \\( -name "*.ts" -o -name "*.tsx" \\) -size +0c`,
        { encoding: "utf8" },
      );
      return result
        .trim()
        .split("\n")
        .filter((file) => file.length > 0);
    } catch (error) {
      this.log(
        `Error finding Next.js files: ${(error as Error).message}`,
        "red",
      );
      return [];
    }
  }

  private getLineCount(filePath: string): number {
    try {
      // Super fast line counting using wc -l
      const result = execSync(`wc -l < "${filePath}"`, { encoding: "utf8" });
      return parseInt(result.trim(), 10) || 0;
    } catch (error) {
      return 0;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private categorizeFile(filePath: string): LargeFile["category"] {
    const path = filePath.toLowerCase();

    // Next.js specific patterns
    if (path.includes("/page.tsx") || path.includes("/page.ts")) return "page";
    if (path.includes("/layout.tsx") || path.includes("/layout.ts"))
      return "layout";
    if (path.includes("/route.ts") || path.includes("/route.tsx")) return "api";
    if (path.includes("/api/")) return "api";

    // Feature patterns
    if (path.includes("/components/") && path.endsWith(".tsx"))
      return "component";
    if (path.includes("/server/") && path.includes("actions"))
      return "server-action";
    if (path.includes("/hooks/") || path.match(/\/use[A-Z]/)) return "hook";
    if (path.includes("/lib/") || path.includes("/utils/")) return "util";

    return "other";
  }

  private getCategoryIcon(category: LargeFile["category"]): string {
    const icons = {
      component: "🧩",
      page: "📄",
      api: "🔌",
      layout: "🏗️",
      "server-action": "⚡",
      hook: "🪝",
      util: "🛠️",
      other: "📁",
    };
    return icons[category];
  }

  private getCategoryColor(category: LargeFile["category"]): keyof Colors {
    const colors: Record<LargeFile["category"], keyof Colors> = {
      component: "blue",
      page: "green",
      api: "magenta",
      layout: "cyan",
      "server-action": "yellow",
      hook: "blue",
      util: "dim",
      other: "reset",
    };
    return colors[category];
  }

  private processFile(filePath: string): void {
    try {
      const lines = this.getLineCount(filePath);
      const stats = statSync(filePath);
      const sizeBytes = stats.size;

      this.checkedFiles++;

      if (this.verbose) {
        process.stdout.write(
          `\r${colors.dim}Checked: ${this.checkedFiles} files${colors.reset}`,
        );
      } else if (this.checkedFiles % 50 === 0) {
        // Less frequent updates for speed
        process.stdout.write(
          `\r${colors.dim}Progress: ${this.checkedFiles} files scanned${colors.reset}`,
        );
      }

      // Include files based on mode and threshold (line count or size)
      const metric = this.useSize ? sizeBytes / 1024 : lines;
      const threshold = this.useSize ? this.minSizeKB : this.minLines;

      const shouldInclude = this.reverseOrder
        ? metric <= threshold
        : metric >= threshold;

      if (shouldInclude) {
        const category = this.categorizeFile(filePath);
        const type = filePath.endsWith(".tsx")
          ? ("tsx" as const)
          : ("ts" as const);

        this.largeFiles.push({
          path: filePath.replace("./src/", ""),
          lines,
          sizeBytes,
          sizeFormatted: this.formatFileSize(sizeBytes),
          category,
          type,
        });
      }
    } catch (error) {
      this.verboseLog(
        `Error processing ${filePath}: ${(error as Error).message}`,
        "red",
      );
    }
  }

  private categorizeFiles() {
    const categories = {
      component: this.largeFiles.filter((f) => f.category === "component"),
      page: this.largeFiles.filter((f) => f.category === "page"),
      api: this.largeFiles.filter((f) => f.category === "api"),
      layout: this.largeFiles.filter((f) => f.category === "layout"),
      "server-action": this.largeFiles.filter(
        (f) => f.category === "server-action",
      ),
      hook: this.largeFiles.filter((f) => f.category === "hook"),
      util: this.largeFiles.filter((f) => f.category === "util"),
      other: this.largeFiles.filter((f) => f.category === "other"),
    };

    return categories;
  }

  private getHealthScore(avgSize: number): string {
    if (avgSize < 10) return "EXCELLENT 🎉";
    if (avgSize < 20) return "VERY GOOD 👍";
    if (avgSize < 50) return "GOOD ✅";
    if (avgSize < 100) return "NEEDS ATTENTION ⚠️";
    return "NEEDS REVIEW 🚨";
  }

  private reportResults(): void {
    this.log(`\n\n📊 Analysis Complete!`, "green");
    this.log(`Total files scanned: ${this.checkedFiles}`, "dim");

    const metric = this.useSize ? "KB" : "lines";
    const threshold = this.useSize ? this.minSizeKB : this.minLines;
    const operation = this.reverseOrder ? "≤" : "≥";
    this.log(
      `Files found (${operation}${threshold} ${metric}): ${this.largeFiles.length}`,
      "yellow",
    );

    if (this.largeFiles.length === 0) {
      const message = this.useSize
        ? "No large files found! Your codebase is well-optimized."
        : this.reverseOrder
          ? "No small files found! All files have substantial content."
          : "No large files found! Your files are reasonably sized.";
      this.log(`\n🎉 ${message}`, "green");
      return;
    }

    // Sort files by primary metric (lines or size)
    const sortedFiles = [...this.largeFiles].sort((a, b) => {
      const metricA = this.useSize ? a.sizeBytes : a.lines;
      const metricB = this.useSize ? b.sizeBytes : b.lines;
      return this.reverseOrder ? metricA - metricB : metricB - metricA;
    });
    const categories = this.categorizeFiles();

    if (this.reverseOrder) {
      const title = this.useSize ? "SMALLEST FILES:" : "SHORTEST FILES:";
      this.log(`\n📦 ${title}`, "yellow");
      this.log(
        "   These might be empty, incomplete, or candidates for removal\n",
      );
    } else {
      const title = this.useSize ? "LARGEST FILES:" : "LONGEST FILES:";
      this.log(`\n🚨 ${title}`, "red");
      this.log("   Consider reviewing these for potential optimization\n");
    }

    // Show top 10 files (longest/shortest or largest/smallest depending on mode)
    sortedFiles.slice(0, 10).forEach((file, index) => {
      const icon = this.getCategoryIcon(file.category);
      const color = this.getCategoryColor(file.category);
      let rank = "📄";

      if (this.reverseOrder) {
        // For small files, highlight the tiniest ones
        rank = index < 3 ? "🔍" : "📄";
        if (file.lines === 0) rank = "❗"; // Empty files
      } else {
        // For large files, highlight the biggest ones
        rank = index < 3 ? "🏆" : "📄";
      }

      // Show both line count and size for complete picture
      const primaryMetric = this.useSize
        ? file.sizeFormatted.padEnd(8)
        : `${file.lines}L`.padEnd(6);
      const secondaryMetric = this.useSize
        ? ` (${file.lines}L)`
        : ` (${file.sizeFormatted})`;

      this.log(
        `   ${rank} ${icon} ${primaryMetric}${secondaryMetric} ${file.path}`,
        color,
      );
    });

    if (sortedFiles.length > 10) {
      this.log(`   ... and ${sortedFiles.length - 10} more files`, "dim");
    }

    // Category breakdown
    this.log("\n📁 BREAKDOWN BY CATEGORY:", "blue");
    Object.entries(categories).forEach(([category, files]) => {
      if (files.length > 0) {
        const icon = this.getCategoryIcon(category as LargeFile["category"]);
        const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
        const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);
        const avgLines = Math.round(totalLines / files.length);
        const avgSize = (totalSize / files.length / 1024).toFixed(1);

        const primary = this.useSize
          ? `avg: ${avgSize}KB`
          : `avg: ${avgLines}L`;
        const secondary = this.useSize ? ` (${avgLines}L)` : ` (${avgSize}KB)`;

        this.log(
          `   ${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${files.length} files (${primary}${secondary})`,
          "blue",
        );
      }
    });

    this.printSummary();
  }

  private printSummary(): void {
    const totalLines = this.largeFiles.reduce((sum, f) => sum + f.lines, 0);
    const totalSize = this.largeFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    const avgLines = Math.round(totalLines / this.largeFiles.length);
    const avgSize = totalSize / this.largeFiles.length / 1024;

    // Find extreme file based on primary metric
    const extremeFile = this.reverseOrder
      ? this.largeFiles.reduce((smallest, file) => {
          const metricSmallest = this.useSize
            ? smallest.sizeBytes
            : smallest.lines;
          const metricFile = this.useSize ? file.sizeBytes : file.lines;
          return metricFile < metricSmallest ? file : smallest;
        })
      : this.largeFiles.reduce((largest, file) => {
          const metricLargest = this.useSize
            ? largest.sizeBytes
            : largest.lines;
          const metricFile = this.useSize ? file.sizeBytes : file.lines;
          return metricFile > metricLargest ? file : largest;
        });

    this.log("\n📊 CODEBASE ANALYSIS SUMMARY", "green");
    this.log("━".repeat(50), "dim");

    // Impact assessment
    this.log(`📈 CODEBASE HEALTH:`, "green");
    if (!this.reverseOrder && !this.useSize) {
      this.log(`   File complexity: ${this.getHealthScore(avgLines)}`, "green");
    } else if (!this.reverseOrder && this.useSize) {
      this.log(`   File size health: ${this.getHealthScore(avgSize)}`, "green");
    }

    this.log(`   Average lines per file: ${avgLines}L`, "dim");
    this.log(`   Average file size: ${avgSize.toFixed(1)}KB`, "dim");
    this.log(
      `   Total size analyzed: ${this.formatFileSize(totalSize)}`,
      "dim",
    );

    // Extreme file highlight
    if (this.reverseOrder) {
      const title = this.useSize ? "🔍 SMALLEST FILE:" : "🔍 SHORTEST FILE:";
      this.log(`\n${title}`, "yellow");
      const icon = this.getCategoryIcon(extremeFile.category);
      const primaryMetric = this.useSize
        ? extremeFile.sizeFormatted
        : `${extremeFile.lines}L`;
      const secondaryMetric = this.useSize
        ? ` (${extremeFile.lines}L)`
        : ` (${extremeFile.sizeFormatted})`;
      this.log(
        `   ${icon} ${extremeFile.path} (${primaryMetric}${secondaryMetric})`,
        "yellow",
      );

      // Count empty files
      const emptyFiles = this.largeFiles.filter((f) => f.lines === 0);
      if (emptyFiles.length > 0) {
        this.log(`\n❗ EMPTY FILES FOUND: ${emptyFiles.length}`, "red");
        this.log(
          "   These files contain no content and may be safe to remove",
          "dim",
        );
      }
    } else {
      const title = this.useSize ? "🏆 LARGEST FILE:" : "🏆 LONGEST FILE:";
      this.log(`\n${title}`, "yellow");
      const icon = this.getCategoryIcon(extremeFile.category);
      const primaryMetric = this.useSize
        ? extremeFile.sizeFormatted
        : `${extremeFile.lines}L`;
      const secondaryMetric = this.useSize
        ? ` (${extremeFile.lines}L)`
        : ` (${extremeFile.sizeFormatted})`;
      this.log(
        `   ${icon} ${extremeFile.path} (${primaryMetric}${secondaryMetric})`,
        "yellow",
      );
    }

    // Recommendations
    if (this.reverseOrder) {
      const verySmallFiles = this.largeFiles.filter((f) => f.sizeBytes < 100); // < 100 bytes
      const emptyFiles = this.largeFiles.filter((f) => f.sizeBytes === 0);

      if (emptyFiles.length > 0 || verySmallFiles.length > 5) {
        this.log("\n🔍 CLEANUP SUGGESTIONS:", "yellow");
        if (emptyFiles.length > 0) {
          this.log(
            "   1. Review empty files - they might be safe to remove",
            "dim",
          );
        }
        if (verySmallFiles.length > emptyFiles.length) {
          this.log(
            "   2. Very small files might be incomplete implementations",
            "dim",
          );
        }
        this.log(
          "   3. Consider if these files serve a purpose or are leftovers",
          "dim",
        );
      } else {
        this.log("\n✅ CLEANUP STATUS:", "green");
        this.log("   No empty or suspicious small files detected!", "dim");
      }
    } else {
      if (avgSize > 50) {
        this.log("\n💡 OPTIMIZATION SUGGESTIONS:", "yellow");
        this.log("   1. Look for code duplication in large files", "dim");
        this.log(
          "   2. Consider splitting large components into smaller ones",
          "dim",
        );
        this.log("   3. Move utility functions to separate files", "dim");
        this.log("   4. Extract reusable hooks and components", "dim");
      } else if (avgSize > 20) {
        this.log("\n💡 MAINTENANCE TIPS:", "yellow");
        this.log("   1. Monitor file growth over time", "dim");
        this.log(
          "   2. Keep components focused on single responsibilities",
          "dim",
        );
        this.log("   3. Extract complex logic to custom hooks", "dim");
      } else {
        this.log("\n🎉 GREAT JOB:", "green");
        this.log("   Your files are well-sized and maintainable!", "dim");
      }
    }

    this.log("\n" + "━".repeat(50), "dim");
  }

  public async run(): Promise<void> {
    this.verboseLog("📏 Finding large Next.js files...", "blue");

    const nextJsFiles = this.getAllNextJsFiles();
    this.verboseLog(
      `Found ${nextJsFiles.length} TypeScript files to analyze`,
      "green",
    );

    if (!this.verbose) {
      const operation = this.reverseOrder ? "≤" : "≥";
      const unit = this.useSize ? "KB" : "lines";
      const threshold = this.useSize ? this.minSizeKB : this.minLines;
      this.log(
        `📏 Analyzing files (${operation}${threshold} ${unit} threshold)...`,
        "blue",
      );
    }

    // Filter out very small files early (performance optimization)
    const filesToProcess = nextJsFiles.filter((file) => {
      try {
        const stats = statSync(file);
        return stats.size >= this.minSizeKB * 1024; // Convert KB to bytes
      } catch {
        return false;
      }
    });

    const skipped = nextJsFiles.length - filesToProcess.length;
    this.verboseLog(
      `Processing ${filesToProcess.length}/${nextJsFiles.length} files above size threshold`,
      "dim",
    );
    if (skipped > 0) {
      this.verboseLog(
        `Skipped ${skipped} files (below ${this.minSizeKB}KB threshold)`,
        "dim",
      );
    }

    const startTime = Date.now();

    // Process each file
    for (const file of nextJsFiles) {
      this.processFile(file);
    }

    // Clear the progress line
    process.stdout.write("\r" + " ".repeat(60) + "\r");

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    this.verboseLog(`\nAnalysis completed in ${duration}s`, "dim");

    // Report results
    this.reportResults();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");
const showHelp = args.includes("--help") || args.includes("-h");
const reverseOrder = args.includes("--reverse") || args.includes("--small");
const useSize = args.includes("--size");

// Parse threshold - different defaults for small vs large, lines vs size
let minThreshold: number;
if (useSize) {
  minThreshold = reverseOrder ? 1 : 5; // Size mode: ≤1KB or ≥5KB
} else {
  minThreshold = reverseOrder ? 10 : 50; // Line mode: ≤10L or ≥50L
}

const thresholdArg = args.find(
  (arg) => arg.startsWith("--min-size=") || arg.startsWith("--min-lines="),
);
if (thresholdArg) {
  const value = parseInt(thresholdArg.split("=")[1], 10);
  if (!Number.isNaN(value) && value >= 0) {
    minThreshold = value;
  }
}

if (showHelp) {
  console.log(`
📏 Large File Finder (Line-Count Focused)

USAGE:
  npx tsx scripts/find-large-files.ts [OPTIONS]

OPTIONS:
  --verbose, -v          Show detailed progress and file-by-file analysis
  --small, --reverse     Find shortest files instead (default ≤10L threshold)
  --size                 Use file size instead of line count for analysis
  --min-lines=<N>        Line count threshold (default: 50 for long, 10 for short)
  --min-size=<KB>        Size threshold when using --size mode
  --help, -h             Show this help message

EXAMPLES:
  pnpm large-files                    # Find files ≥50 lines
  pnpm large-files:verbose            # Detailed analysis  
  pnpm large-files --min-lines=100    # Find files ≥100 lines
  pnpm small-files                    # Find files ≤10 lines (empty/tiny files)
  pnpm small-files --min-lines=0      # Find only empty files (0 lines)
  pnpm large-files --size             # Use file size instead of line count

OUTPUT:
  🏆 Files ranked by line count (primary) with size info (secondary)
  📁 Breakdown by category (components, pages, etc.)
  📊 Health score and optimization suggestions  
  🔍 Special detection for empty files (0 lines)
  ⚡ Super fast using wc -l for line counting
  `);
  process.exit(0);
}

// Run the analyzer
const finder = new LargeFileFinder(
  verbose,
  minThreshold,
  reverseOrder,
  useSize,
);
finder.run().catch((error) => {
  console.error("Error running large file finder:", error);
  process.exit(1);
});
