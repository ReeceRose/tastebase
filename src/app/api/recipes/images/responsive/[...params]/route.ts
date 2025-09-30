import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getRecipeImagePath, type ImageSize } from "@/lib/file-storage";
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("responsive-image-serving");

// Cache headers for different image types
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable", // 1 year
  Vary: "Accept",
} as const;

// WebP support detection
function supportsWebP(request: NextRequest): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("image/webp");
}

// Get optimal image size based on width parameter
function getOptimalSize(requestedWidth?: string): ImageSize {
  const width = requestedWidth ? parseInt(requestedWidth, 10) : 800;

  if (width <= 150) return "thumbnail";
  if (width <= 400) return "small";
  if (width <= 800) return "medium";
  return "large";
}

// Convert image filename to WebP if supported
function getWebPFilename(filename: string): string {
  const parts = filename.split(".");
  parts[parts.length - 1] = "webp";
  return parts.join(".");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } },
) {
  try {
    const [filename] = params.params;

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 },
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const width = url.searchParams.get("w");
    const format = url.searchParams.get("f");

    // Get optimal image size
    const size = getOptimalSize(width ?? undefined);
    const supportsWebPFormat = supportsWebP(request);

    // Determine target filename
    let targetFilename = filename;
    let contentType = "image/jpeg"; // default

    // Handle format preferences
    if (format === "webp" || (supportsWebPFormat && !format)) {
      const webpFilename = getWebPFilename(filename);
      const webpPath = getRecipeImagePath(webpFilename, size);

      if (existsSync(webpPath)) {
        targetFilename = webpFilename;
        contentType = "image/webp";
      }
    } else if (format === "png" && filename.toLowerCase().includes("png")) {
      contentType = "image/png";
    }

    // Get file path
    const imagePath = getRecipeImagePath(targetFilename, size);

    // Check if file exists
    if (!existsSync(imagePath)) {
      // Fallback to original size
      const originalPath = getRecipeImagePath(targetFilename);

      if (!existsSync(originalPath)) {
        logger.warn({ filename, size }, "Image file not found");
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      // Serve original if variant doesn't exist
      const originalStats = await stat(originalPath);
      const originalFile = await import("node:fs/promises").then((fs) =>
        fs.readFile(originalPath),
      );

      logger.info(
        {
          filename: targetFilename,
          size: "original",
          fileSize: originalStats.size,
          contentType,
        },
        "Serving original image (variant not available)",
      );

      return new NextResponse(new Uint8Array(originalFile), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": originalStats.size.toString(),
          ...CACHE_HEADERS,
        },
      });
    }

    // Get file stats and read file
    const stats = await stat(imagePath);
    const file = await import("node:fs/promises").then((fs) =>
      fs.readFile(imagePath),
    );

    logger.info(
      {
        filename: targetFilename,
        size,
        requestedWidth: width,
        fileSize: stats.size,
        contentType,
        webpSupported: supportsWebPFormat,
      },
      "Serving responsive image",
    );

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        ...CACHE_HEADERS,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error serving responsive image");

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Generate image metadata for client-side optimization
export async function HEAD(
  request: NextRequest,
  { params }: { params: { params: string[] } },
) {
  try {
    const [filename] = params.params;

    if (!filename) {
      return new NextResponse(null, { status: 400 });
    }

    const url = new URL(request.url);
    const width = url.searchParams.get("w");
    const size = getOptimalSize(width ?? undefined);

    const imagePath = getRecipeImagePath(filename, size);

    if (!existsSync(imagePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const stats = await stat(imagePath);
    const contentType = supportsWebP(request) ? "image/webp" : "image/jpeg";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        ...CACHE_HEADERS,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error getting image metadata");
    return new NextResponse(null, { status: 500 });
  }
}
