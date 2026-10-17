import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { findSavedRecipe } from "@/lib/search/saved-recipe-lookup";

const logger = createOperationLogger("saved-recipe-lookup");

// Used by the browser extension to say "already in Tastebase" before saving.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const match = await findSavedRecipe(session.user.id, url);
    return NextResponse.json({
      recipe: match
        ? {
            ...match,
            savedAt: match.savedAt.toISOString(),
            path: `/recipes/${match.slug}`,
          }
        : null,
    });
  } catch (error) {
    logError(logger, "Saved recipe lookup failed", error, {
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
