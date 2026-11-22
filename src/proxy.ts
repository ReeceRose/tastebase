import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RETURN_PATH_PARAM } from "@/lib/utils/return-path";

const publicRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/reset-password",
  "/api/auth",
  "/api/health",
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle public routes - only auth routes are public, root requires authentication
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes using Better Auth cookies
  const sessionCookie = getSessionCookie(req);

  if (!sessionCookie) {
    const signIn = new URL("/auth/sign-in", req.url);
    if (
      req.method === "GET" &&
      pathname !== "/" &&
      !pathname.startsWith("/api")
    ) {
      signIn.searchParams.set(
        RETURN_PATH_PARAM,
        `${pathname}${req.nextUrl.search}`,
      );
    }
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  // The video upload route is skipped: the proxy would hold the whole video
  // in memory and cut it off past proxyClientMaxBodySize. It checks the
  // session itself.
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|api/recipes/videos/upload|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for other API routes
    "/((?!api/recipes/videos/upload)(?:api|trpc).*)",
  ],
};
