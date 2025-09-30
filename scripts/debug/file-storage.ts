#!/usr/bin/env tsx

/**
 * File Storage Inspector
 * Debug file storage, check orphaned files, and analyze storage usage
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { recipeImages } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("file-storage-inspector");

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  fileTypes: Record<string, number>;
  largestFile: { name: string; size: number } | null;
  oldestFile: { name: string; mtime: Date } | null;
  newestFile: { name: string; mtime: Date } | null;
}

interface OrphanedFile {
  filename: string;
  path: string;
  size: number;
  mtime: Date;
  type: "orphaned" | "missing-db-record";
}

class FileStorageInspector {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || "./uploads";
    
    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      logger.info({ uploadDir: this.uploadDir }, "Created upload directory");
    }
  }

  async scanFileSystem(): Promise<StorageStats> {
    logger.info({ uploadDir: this.uploadDir }, "Scanning file system");

    if (!existsSync(this.uploadDir)) {
      throw new Error(`Upload directory does not exist: ${this.uploadDir}`);
    }

    const files = readdirSync(this.uploadDir);
    const stats: StorageStats = {
      totalFiles: files.length,
      totalSize: 0,
      averageFileSize: 0,
      fileTypes: {},
      largestFile: null,
      oldestFile: null,
      newestFile: null,
    };

    for (const filename of files) {
      const filePath = join(this.uploadDir, filename);
      
      try {
        const fileStat = statSync(filePath);
        
        if (fileStat.isFile()) {
          const ext = extname(filename).toLowerCase() || 'no-extension';
          
          stats.totalSize += fileStat.size;
          stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
          
          // Track largest file
          if (!stats.largestFile || fileStat.size > stats.largestFile.size) {
            stats.largestFile = { name: filename, size: fileStat.size };
          }
          
          // Track oldest file
          if (!stats.oldestFile || fileStat.mtime < stats.oldestFile.mtime) {
            stats.oldestFile = { name: filename, mtime: fileStat.mtime };
          }
          
          // Track newest file
          if (!stats.newestFile || fileStat.mtime > stats.newestFile.mtime) {
            stats.newestFile = { name: filename, mtime: fileStat.mtime };
          }
        }
      } catch (error) {
        logger.warn({ filename, error: error instanceof Error ? error.message : 'Unknown error' }, "Failed to stat file");
      }
    }

    stats.averageFileSize = stats.totalFiles > 0 ? stats.totalSize / stats.totalFiles : 0;
    
    logger.info(stats, "File system scan completed");
    return stats;
  }

  async findOrphanedFiles(): Promise<OrphanedFile[]> {
    logger.info("Finding orphaned files");

    const orphanedFiles: OrphanedFile[] = [];

    if (!existsSync(this.uploadDir)) {
      logger.warn("Upload directory does not exist");
      return orphanedFiles;
    }

    // Get all files in upload directory
    const filesOnDisk = readdirSync(this.uploadDir);
    
    // Get all image records from database
    const dbImages = await db.select({
      filename: recipeImages.filename
    }).from(recipeImages);
    
    const dbFilenames = new Set(dbImages.map(img => img.filename));

    // Find files on disk that aren't in database
    for (const filename of filesOnDisk) {
      const filePath = join(this.uploadDir, filename);
      
      try {
        const fileStat = statSync(filePath);
        
        if (fileStat.isFile() && !dbFilenames.has(filename)) {
          orphanedFiles.push({
            filename,
            path: filePath,
            size: fileStat.size,
            mtime: fileStat.mtime,
            type: "orphaned"
          });
        }
      } catch (error) {
        logger.warn({ filename, error: error instanceof Error ? error.message : 'Unknown error' }, "Failed to check file");
      }
    }

    logger.info({ count: orphanedFiles.length }, "Found orphaned files");
    return orphanedFiles;
  }

  async findMissingFiles() {
    logger.info("Finding missing files (in database but not on disk)");

    const missingFiles: Array<{ id: string; filename: string; recipeId: string; originalName: string; }> = [];

    // Get all image records from database
    const dbImages = await db.select({
      id: recipeImages.id,
      filename: recipeImages.filename,
      recipeId: recipeImages.recipeId,
      originalName: recipeImages.originalName
    }).from(recipeImages);

    // Check if each file exists on disk
    for (const image of dbImages) {
      const filePath = join(this.uploadDir, image.filename);
      
      if (!existsSync(filePath)) {
        missingFiles.push({
          id: image.id,
          filename: image.filename,
          recipeId: image.recipeId,
          originalName: image.originalName || "Unknown"
        });
      }
    }

    logger.info({ count: missingFiles.length }, "Found missing files");
    return missingFiles;
  }

  async validateImageIntegrity() {
    logger.info("Validating image file integrity");

    const validationResults = {
      totalImages: 0,
      validImages: 0,
      corruptImages: 0,
      inaccessibleImages: 0,
      sizeDiscrepancies: 0,
      issues: [] as Array<{ filename: string; issue: string; dbSize?: number; diskSize?: number }>
    };

    // Get all image records with metadata
    const dbImages = await db.select({
      id: recipeImages.id,
      filename: recipeImages.filename,
      fileSize: recipeImages.fileSize,
      mimeType: recipeImages.mimeType,
      width: recipeImages.width,
      height: recipeImages.height
    }).from(recipeImages);

    validationResults.totalImages = dbImages.length;

    for (const image of dbImages) {
      const filePath = join(this.uploadDir, image.filename);
      
      try {
        if (!existsSync(filePath)) {
          validationResults.issues.push({
            filename: image.filename,
            issue: "File missing from disk"
          });
          validationResults.inaccessibleImages++;
          continue;
        }

        const fileStat = statSync(filePath);
        
        // Check file size discrepancy
        if (image.fileSize && Math.abs(fileStat.size - image.fileSize) > 100) {
          validationResults.issues.push({
            filename: image.filename,
            issue: "File size mismatch",
            dbSize: image.fileSize,
            diskSize: fileStat.size
          });
          validationResults.sizeDiscrepancies++;
        }

        // Check if file is readable (basic corruption check)
        try {
          // Try to read first few bytes
          const fs = require('fs');
          const buffer = Buffer.alloc(512);
          const fd = fs.openSync(filePath, 'r');
          fs.readSync(fd, buffer, 0, 512, 0);
          fs.closeSync(fd);
          
          validationResults.validImages++;
        } catch (readError) {
          validationResults.issues.push({
            filename: image.filename,
            issue: "File appears to be corrupt or unreadable"
          });
          validationResults.corruptImages++;
        }

      } catch (error) {
        validationResults.issues.push({
          filename: image.filename,
          issue: `File system error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        validationResults.inaccessibleImages++;
      }
    }

    logger.info(validationResults, "Image integrity validation completed");
    return validationResults;
  }

  async cleanupOrphanedFiles(dryRun: boolean = true): Promise<{ deleted: string[]; errors: string[] }> {
    logger.info({ dryRun }, "Cleaning up orphaned files");

    const orphanedFiles = await this.findOrphanedFiles();
    const deleted: string[] = [];
    const errors: string[] = [];

    if (orphanedFiles.length === 0) {
      logger.info("No orphaned files found");
      return { deleted, errors };
    }

    for (const file of orphanedFiles) {
      try {
        if (dryRun) {
          logger.info({ filename: file.filename, size: file.size }, "Would delete orphaned file");
          deleted.push(file.filename);
        } else {
          unlinkSync(file.path);
          logger.info({ filename: file.filename, size: file.size }, "Deleted orphaned file");
          deleted.push(file.filename);
        }
      } catch (error) {
        const errorMsg = `Failed to delete ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error({ filename: file.filename, error: errorMsg }, "Failed to delete orphaned file");
        errors.push(errorMsg);
      }
    }

    return { deleted, errors };
  }

  async generateStorageReport() {
    logger.info("Generating comprehensive storage report");

    const [
      fsStats,
      orphanedFiles,
      missingFiles,
      validationResults
    ] = await Promise.all([
      this.scanFileSystem(),
      this.findOrphanedFiles(),
      this.findMissingFiles(),
      this.validateImageIntegrity()
    ]);

    // Database statistics
    const dbStats = {
      totalRecords: await db.select().from(recipeImages).then(r => r.length),
      recordsWithDimensions: await db.select().from(recipeImages)
        .where(sql`${recipeImages.width} IS NOT NULL AND ${recipeImages.height} IS NOT NULL`)
        .then(r => r.length),
      heroImages: await db.select().from(recipeImages)
        .where(eq(recipeImages.isHero, true))
        .then(r => r.length),
      averageFileSize: await db.select({
        avg: sql<number>`AVG(${recipeImages.fileSize})`
      }).from(recipeImages).then(r => r[0]?.avg || 0)
    };

    const report = {
      uploadDirectory: this.uploadDir,
      fileSystem: fsStats,
      database: dbStats,
      orphanedFiles: {
        count: orphanedFiles.length,
        totalSize: orphanedFiles.reduce((sum, f) => sum + f.size, 0),
        files: orphanedFiles.slice(0, 10) // Limit for readability
      },
      missingFiles: {
        count: missingFiles.length,
        files: missingFiles.slice(0, 10)
      },
      validation: validationResults,
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (orphanedFiles.length > 0) {
      report.recommendations.push(`Clean up ${orphanedFiles.length} orphaned files to free space`);
    }
    
    if (missingFiles.length > 0) {
      report.recommendations.push(`Fix ${missingFiles.length} missing file references in database`);
    }
    
    if (validationResults.corruptImages > 0) {
      report.recommendations.push(`Investigate ${validationResults.corruptImages} potentially corrupt images`);
    }
    
    if (validationResults.sizeDiscrepancies > 0) {
      report.recommendations.push(`Review ${validationResults.sizeDiscrepancies} file size discrepancies`);
    }

    if (fsStats.totalSize > 1024 * 1024 * 1024) { // > 1GB
      report.recommendations.push("Consider implementing image compression or storage optimization");
    }

    return report;
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🗄️  File Storage Inspector\n");

  const inspector = new FileStorageInspector();

  try {
    switch (command) {
      case "scan":
        console.log("📊 Scanning file system...");
        const stats = await inspector.scanFileSystem();
        console.log(`\n📁 File System Statistics:`);
        console.log(`   • Total files: ${stats.totalFiles}`);
        console.log(`   • Total size: ${inspector.formatFileSize(stats.totalSize)}`);
        console.log(`   • Average file size: ${inspector.formatFileSize(stats.averageFileSize)}`);
        console.log(`\n📂 File types:`);
        Object.entries(stats.fileTypes).forEach(([ext, count]) => {
          console.log(`   • ${ext}: ${count} files`);
        });
        if (stats.largestFile) {
          console.log(`\n📈 Largest file: ${stats.largestFile.name} (${inspector.formatFileSize(stats.largestFile.size)})`);
        }
        break;

      case "orphaned":
        console.log("🔍 Finding orphaned files...");
        const orphaned = await inspector.findOrphanedFiles();
        console.log(`\n🗑️  Found ${orphaned.length} orphaned files:`);
        orphaned.forEach(file => {
          console.log(`   • ${file.filename} (${inspector.formatFileSize(file.size)}) - ${file.mtime.toDateString()}`);
        });
        
        if (orphaned.length > 0) {
          const totalSize = orphaned.reduce((sum, f) => sum + f.size, 0);
          console.log(`\n💾 Total wasted space: ${inspector.formatFileSize(totalSize)}`);
        }
        break;

      case "missing":
        console.log("🔍 Finding missing files...");
        const missing = await inspector.findMissingFiles();
        console.log(`\n❌ Found ${missing.length} missing files:`);
        missing.forEach(file => {
          console.log(`   • ${file.filename} (${file.originalName}) - Recipe: ${file.recipeId}`);
        });
        break;

      case "validate":
        console.log("✅ Validating image integrity...");
        const validation = await inspector.validateImageIntegrity();
        console.log(`\n🔍 Image Validation Results:`);
        console.log(`   • Total images: ${validation.totalImages}`);
        console.log(`   • Valid images: ${validation.validImages}`);
        console.log(`   • Corrupt images: ${validation.corruptImages}`);
        console.log(`   • Inaccessible images: ${validation.inaccessibleImages}`);
        console.log(`   • Size discrepancies: ${validation.sizeDiscrepancies}`);
        
        if (validation.issues.length > 0) {
          console.log(`\n⚠️  Issues found:`);
          validation.issues.slice(0, 10).forEach(issue => {
            console.log(`   • ${issue.filename}: ${issue.issue}`);
            if (issue.dbSize && issue.diskSize) {
              console.log(`     DB: ${inspector.formatFileSize(issue.dbSize)} | Disk: ${inspector.formatFileSize(issue.diskSize)}`);
            }
          });
          
          if (validation.issues.length > 10) {
            console.log(`   ... and ${validation.issues.length - 10} more issues`);
          }
        }
        break;

      case "cleanup":
        const dryRun = !args.includes("--confirm");
        console.log(`🧹 ${dryRun ? 'Dry run - ' : ''}Cleaning up orphaned files...`);
        
        if (dryRun) {
          console.log("⚠️  This is a dry run. Use --confirm to actually delete files.");
        }
        
        const cleanup = await inspector.cleanupOrphanedFiles(dryRun);
        console.log(`\n${dryRun ? '🔍 Would delete' : '🗑️  Deleted'} ${cleanup.deleted.length} files:`);
        cleanup.deleted.forEach(filename => {
          console.log(`   • ${filename}`);
        });
        
        if (cleanup.errors.length > 0) {
          console.log(`\n❌ Errors encountered:`);
          cleanup.errors.forEach(error => {
            console.log(`   • ${error}`);
          });
        }
        break;

      case "report":
        console.log("📋 Generating comprehensive storage report...");
        const report = await inspector.generateStorageReport();
        
        console.log(`\n📊 Storage Report:`);
        console.log(`   Upload Directory: ${report.uploadDirectory}`);
        
        console.log(`\n📁 File System:`);
        console.log(`   • Files: ${report.fileSystem.totalFiles}`);
        console.log(`   • Total Size: ${inspector.formatFileSize(report.fileSystem.totalSize)}`);
        console.log(`   • Average Size: ${inspector.formatFileSize(report.fileSystem.averageFileSize)}`);
        
        console.log(`\n🗄️  Database:`);
        console.log(`   • Records: ${report.database.totalRecords}`);
        console.log(`   • With Dimensions: ${report.database.recordsWithDimensions}`);
        console.log(`   • Hero Images: ${report.database.heroImages}`);
        console.log(`   • Avg File Size: ${inspector.formatFileSize(report.database.averageFileSize)}`);
        
        console.log(`\n🗑️  Orphaned Files: ${report.orphanedFiles.count} (${inspector.formatFileSize(report.orphanedFiles.totalSize)})`);
        console.log(`❌ Missing Files: ${report.missingFiles.count}`);
        console.log(`✅ Valid Images: ${report.validation.validImages}/${report.validation.totalImages}`);
        
        if (report.recommendations.length > 0) {
          console.log(`\n💡 Recommendations:`);
          report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
          });
        }
        break;

      default:
        console.log("Available commands:");
        console.log("  scan       - Scan file system and show statistics");
        console.log("  orphaned   - Find files not referenced in database");
        console.log("  missing    - Find database records without files");
        console.log("  validate   - Validate image file integrity");
        console.log("  cleanup    - Clean up orphaned files (add --confirm to execute)");
        console.log("  report     - Generate comprehensive storage report");
        break;
    }

  } catch (error) {
    logError(logger, "File storage inspection failed", error);
    console.error("❌ File storage inspection failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}