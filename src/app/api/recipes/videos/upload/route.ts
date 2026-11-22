import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  MAX_VIDEO_BYTES,
  VIDEO_DURATION_HEADER,
  VIDEO_NAME_HEADER,
} from "@/lib/config/video-limits";
import { saveRecipeVideo, VideoTooLargeError } from "@/lib/file-storage/videos";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { PendingVideo } from "@/lib/types/recipe-types";

const logger = createOperationLogger("video-upload-api");

const MAX_NAME_LENGTH = 120;

function readDuration(value: string | null): number | null {
  const seconds = Math.round(Number(value));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function readName(value: string | null): string {
  try {
    return decodeURIComponent(value ?? "").slice(0, MAX_NAME_LENGTH);
  } catch {
    return "";
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// The body is the video itself, streamed to disk as it arrives. This path is
// left out of the proxy's matcher, since the proxy holds whole request
// bodies in memory and cuts off anything past its limit, so the session is
// checked here instead.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return error("Authentication required", 401);
  }

  const tooLarge = new VideoTooLargeError();
  if (Number(request.headers.get("content-length") ?? 0) > MAX_VIDEO_BYTES) {
    return error(tooLarge.message, 413);
  }
  if (!request.body) {
    return error("Choose a video to upload", 400);
  }

  try {
    const saved = await saveRecipeVideo(request.body);
    if (!saved) {
      return error("Use an MP4 or WebM video", 415);
    }

    const video: PendingVideo = {
      filename: saved.filename,
      originalName: readName(request.headers.get(VIDEO_NAME_HEADER)) || "video",
      fileSize: saved.fileSize,
      durationSeconds: readDuration(request.headers.get(VIDEO_DURATION_HEADER)),
      title: null,
      url: `/api/recipes/videos/${saved.filename}`,
    };
    logger.info(
      { userId: session.user.id, filename: saved.filename },
      "Video uploaded",
    );
    return NextResponse.json(video);
  } catch (caught) {
    if (caught instanceof VideoTooLargeError) {
      return error(caught.message, 413);
    }
    logError(logger, "Video upload failed", caught, {
      userId: session.user.id,
    });
    return error("That video didn't upload. Try again.", 500);
  }
}
