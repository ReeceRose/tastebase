import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { saveRecipeVideo } from "@/lib/file-storage/videos";
import { MAX_VIDEO_BYTES } from "@/lib/import/fetch-page";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { PendingVideo } from "@/lib/types/recipe-types";

const logger = createOperationLogger("video-upload-api");

const MAX_NAME_LENGTH = 120;

function readDuration(value: FormDataEntryValue | null): number | null {
  const seconds = Math.round(Number(value));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// A route rather than a server action, since server action bodies stop at
// 10 MB and videos are larger.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return error("Authentication required", 401);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return error("Choose a video to upload", 400);
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return error("Videos must be 50 MB or smaller", 413);
    }

    const saved = await saveRecipeVideo(Buffer.from(await file.arrayBuffer()));
    if (!saved) {
      return error("Use an MP4 or WebM video", 415);
    }

    const video: PendingVideo = {
      filename: saved.filename,
      originalName: file.name.slice(0, MAX_NAME_LENGTH) || "video",
      fileSize: saved.fileSize,
      durationSeconds: readDuration(form.get("durationSeconds")),
      title: null,
      url: `/api/recipes/videos/${saved.filename}`,
    };
    logger.info(
      { userId: session.user.id, filename: saved.filename },
      "Video uploaded",
    );
    return NextResponse.json(video);
  } catch (caught) {
    logError(logger, "Video upload failed", caught, {
      userId: session.user.id,
    });
    return error("That video didn't upload. Try again.", 500);
  }
}
