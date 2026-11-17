import { type FileHandle, open, stat } from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import {
  getRecipeVideoPath,
  isVideoFilename,
  videoMimeTypeFor,
} from "@/lib/file-storage/videos";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("video-api");

interface ByteRange {
  start: number;
  end: number;
}

// Browsers ask for videos in pieces (Safari won't play one otherwise), so
// a single "bytes=start-end" range is honoured.
function parseRange(header: string | null, size: number): ByteRange | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number.parseInt(match[2], 10);
    return { start: Math.max(size - suffix, 0), end: size - 1 };
  }
  const start = Number.parseInt(match[1], 10);
  const end = match[2]
    ? Math.min(Number.parseInt(match[2], 10), size - 1)
    : size - 1;
  return start <= end ? { start, end } : null;
}

const CHUNK_BYTES = 256 * 1024;

// Reads the range in chunks on demand. Players often cancel a request part
// way through, so the file is closed on cancel and nothing is sent after.
function streamFile(filePath: string, range: ByteRange): BodyInit {
  let file: FileHandle | null = null;
  let position = range.start;
  const close = async () => {
    const handle = file;
    file = null;
    await handle?.close().catch(() => undefined);
  };
  return new ReadableStream<Uint8Array>({
    async start() {
      file = await open(filePath, "r");
    },
    async pull(controller) {
      if (!file) return;
      const length = Math.min(CHUNK_BYTES, range.end - position + 1);
      if (length <= 0) {
        await close();
        controller.close();
        return;
      }
      const buffer = new Uint8Array(length);
      const { bytesRead } = await file.read(buffer, 0, length, position);
      if (!file) return;
      if (bytesRead === 0) {
        await close();
        controller.close();
        return;
      }
      position += bytesRead;
      controller.enqueue(buffer.subarray(0, bytesRead));
    },
    cancel: close,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!isVideoFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const filePath = getRecipeVideoPath(filename);
    const info = await stat(filePath).catch(() => null);
    if (!info?.isFile() || info.size === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const headers = new Headers({
      "Content-Type": videoMimeTypeFor(filename),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });

    const rangeHeader = request.headers.get("range");
    if (!rangeHeader) {
      headers.set("Content-Length", info.size.toString());
      return new NextResponse(
        streamFile(filePath, { start: 0, end: info.size - 1 }),
        { headers },
      );
    }

    const range = parseRange(rangeHeader, info.size);
    if (!range || range.start >= info.size) {
      headers.set("Content-Range", `bytes */${info.size}`);
      return new NextResponse(null, { status: 416, headers });
    }
    headers.set(
      "Content-Range",
      `bytes ${range.start}-${range.end}/${info.size}`,
    );
    headers.set("Content-Length", (range.end - range.start + 1).toString());
    return new NextResponse(streamFile(filePath, range), {
      status: 206,
      headers,
    });
  } catch (error) {
    logError(logger, "Error serving recipe video", error, { filename });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
