"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("session-actions");

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress?: string;
}

interface SecurityMetrics {
  lastLogin: string;
  passwordLastChanged: string;
  accountCreated: string;
  activeSessions: number;
  loginAttempts: number;
}

function parseUserAgent(userAgent: string): {
  device: string;
  browser: string;
} {
  // Simple user agent parsing - in production, you might want to use a library like ua-parser-js
  let device = "Unknown Device";
  let browser = "Unknown Browser";

  if (!userAgent) {
    return { device, browser };
  }

  // Device detection
  if (userAgent.includes("iPhone")) device = "iPhone";
  else if (userAgent.includes("iPad")) device = "iPad";
  else if (userAgent.includes("Android")) device = "Android Device";
  else if (userAgent.includes("Mac")) device = "Mac";
  else if (userAgent.includes("Windows")) device = "Windows PC";
  else if (userAgent.includes("Linux")) device = "Linux PC";

  // Browser detection
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // Add version numbers if available
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
  const safariMatch = userAgent.match(/Version\/(\d+)/);

  if (chromeMatch && browser === "Chrome") browser = `Chrome ${chromeMatch[1]}`;
  if (firefoxMatch && browser === "Firefox")
    browser = `Firefox ${firefoxMatch[1]}`;
  if (safariMatch && browser === "Safari") browser = `Safari ${safariMatch[1]}`;

  return { device, browser };
}

// Simple IP geolocation (in production, you'd use a proper service)
function getLocationFromIP(ip: string): string {
  // This is a placeholder - in production you'd integrate with a real IP geolocation service
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip?.includes("192.168") ||
    ip?.includes("10.0")
  ) {
    return "Local Network";
  }
  return "Unknown Location";
}

export async function getUserSessions(): Promise<
  { success: true; data: SessionInfo[] } | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;
    const currentSessionId = session.session?.id;

    logger.info({ userId }, "Retrieving user sessions");

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.updatedAt));

    const sessionInfos: SessionInfo[] = userSessions.map((sess) => {
      const { device, browser } = parseUserAgent(sess.userAgent || "");
      const location = getLocationFromIP(sess.ipAddress || "");

      return {
        id: sess.id,
        device,
        browser,
        location,
        lastActive: sess.updatedAt.toISOString(),
        isCurrent: sess.id === currentSessionId,
        ipAddress: sess.ipAddress || undefined,
      };
    });

    logger.info(
      { userId, sessionCount: sessionInfos.length },
      "User sessions retrieved successfully",
    );

    return { success: true, data: sessionInfos };
  } catch (error) {
    logError(logger, "Failed to get user sessions", error);
    return { success: false, error: "Failed to retrieve user sessions" };
  }
}

export async function getSecurityMetrics(): Promise<
  { success: true; data: SecurityMetrics } | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;

    logger.info({ userId }, "Retrieving security metrics");

    // Get user info and session data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    // Find the most recent session (last login)
    const latestSession = userSessions.reduce((latest, current) => {
      return new Date(current.updatedAt) > new Date(latest.updatedAt)
        ? current
        : latest;
    }, userSessions[0]);

    const securityMetrics: SecurityMetrics = {
      lastLogin:
        latestSession?.updatedAt?.toISOString() || user.createdAt.toISOString(),
      passwordLastChanged: user.updatedAt.toISOString(), // Approximate - password changes update user record
      accountCreated: user.createdAt.toISOString(),
      activeSessions: userSessions.length,
      loginAttempts: 0, // TODO: Implement failed login tracking if needed
    };

    logger.info(
      {
        userId,
        activeSessions: securityMetrics.activeSessions,
        lastLogin: securityMetrics.lastLogin,
      },
      "Security metrics retrieved successfully",
    );

    return { success: true, data: securityMetrics };
  } catch (error) {
    logError(logger, "Failed to get security metrics", error);
    return { success: false, error: "Failed to retrieve security metrics" };
  }
}

const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export async function revokeSession(
  formData: FormData,
): Promise<
  { success: true; message: string } | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;
    const currentSessionId = session.session?.id;

    const validatedData = revokeSessionSchema.parse({
      sessionId: formData.get("sessionId") as string,
    });

    // Prevent revoking current session
    if (validatedData.sessionId === currentSessionId) {
      return { success: false, error: "Cannot revoke current session" };
    }

    logger.info(
      { userId, sessionId: validatedData.sessionId },
      "Revoking user session",
    );

    // Verify session belongs to user and delete it
    const result = await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.id, validatedData.sessionId),
          eq(sessions.userId, userId),
        ),
      );

    if (result.changes === 0) {
      return { success: false, error: "Session not found or already revoked" };
    }

    logger.info(
      { userId, sessionId: validatedData.sessionId },
      "Session revoked successfully",
    );

    return { success: true, message: "Session revoked successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    logError(logger, "Failed to revoke session", error);
    return { success: false, error: "Failed to revoke session" };
  }
}

export async function revokeAllOtherSessions(): Promise<
  | { success: true; message: string; revokedCount: number }
  | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = session.user.id;
    const currentSessionId = session.session?.id;

    logger.info({ userId }, "Revoking all other user sessions");

    // Delete all sessions except current one
    const result = await db.delete(sessions).where(
      and(
        eq(sessions.userId, userId),
        // Only delete if it's NOT the current session
        currentSessionId ? eq(sessions.id, currentSessionId) : undefined,
      ),
    );

    const revokedCount = result.changes || 0;

    logger.info(
      { userId, revokedCount },
      "All other sessions revoked successfully",
    );

    return {
      success: true,
      message: `${revokedCount} other sessions revoked successfully`,
      revokedCount,
    };
  } catch (error) {
    logError(logger, "Failed to revoke all other sessions", error);
    return { success: false, error: "Failed to revoke sessions" };
  }
}
