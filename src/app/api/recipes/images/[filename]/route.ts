import { createReadStream, existsSync, statSync } from "node:fs";
import { type NextRequest, NextResponse } from "next/server";
import {
  getRecipeImagePath,
  type ImageSize,
  STORAGE_CONFIG,
} from "@/lib/file-storage";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("image-api");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") as ImageSize | null;
  const validSize = size || undefined;

  try {
    // Validate filename format (basic security)
    if (!filename || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      logger.warn({ filename }, "Invalid filename format requested");
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Validate size parameter
    if (size && !Object.keys(STORAGE_CONFIG.imageSizes).includes(size)) {
      logger.warn({ filename, size }, "Invalid size parameter requested");
      return NextResponse.json(
        { error: "Invalid size parameter" },
        { status: 400 },
      );
    }

    // Get file path
    const filePath = getRecipeImagePath(filename, validSize);

    // Check if file exists
    if (!existsSync(filePath)) {
      logger.warn({ filename, size, filePath }, "Recipe image not found");
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Get file stats
    const stats = statSync(filePath);

    // Validate file is not empty
    if (stats.size === 0) {
      logger.warn({ filename, filePath }, "Recipe image file is empty");
      return NextResponse.json(
        { error: "Invalid image file" },
        { status: 400 },
      );
    }

    // Set up response headers
    const headers = new Headers();

    // Determine content type based on file extension
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        headers.set("Content-Type", "image/jpeg");
        break;
      case "png":
        headers.set("Content-Type", "image/png");
        break;
      case "webp":
        headers.set("Content-Type", "image/webp");
        break;
      default:
        headers.set("Content-Type", "application/octet-stream");
    }

    // Set caching headers for recipe images (cache for 1 year since filenames are unique)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Length", stats.size.toString());

    // Add security headers
    headers.set("X-Content-Type-Options", "nosniff");

    // Log successful access
    logger.info(
      { filename, size, fileSize: stats.size },
      "Recipe image served successfully",
    );

    // Read and return file
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(filePath);

      stream.on("data", (chunk: string | Buffer) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      );
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });

    return new NextResponse(fileBuffer as BodyInit, { headers });
  } catch (error) {
    logError(logger, "Error serving recipe image", error, { filename, size });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
