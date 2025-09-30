"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { userSearchHistory } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("search-history-actions");

export interface SearchHistoryEntry {
  query: string;
  resultsCount: number;
  runCount: number;
  lastSearchedAt: Date;
}

export async function getSearchHistory(limit: number = 8): Promise<{
  success: boolean;
  data?: SearchHistoryEntry[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const history = await db
      .select({
        query: userSearchHistory.query,
        resultsCount: userSearchHistory.resultsCount,
        runCount: userSearchHistory.runCount,
        lastSearchedAt: userSearchHistory.lastSearchedAt,
      })
      .from(userSearchHistory)
      .where(eq(userSearchHistory.userId, session.user.id))
      .orderBy(desc(userSearchHistory.lastSearchedAt))
      .limit(limit);

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    logError(logger, "Failed to fetch search history", error, { limit });
    return { success: false, error: "Failed to fetch search history" };
  }
}

export async function clearSearchHistory(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .delete(userSearchHistory)
      .where(eq(userSearchHistory.userId, session.user.id));

    logger.info({ userId: session.user.id }, "Cleared search history");

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to clear search history", error);
    return { success: false, error: "Failed to clear search history" };
  }
}

export async function deleteSearchHistoryEntry(query: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return { success: false, error: "Query is required" };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .delete(userSearchHistory)
      .where(
        and(
          eq(userSearchHistory.userId, session.user.id),
          eq(userSearchHistory.query, normalizedQuery),
        ),
      );

    logger.info(
      { userId: session.user.id, query: normalizedQuery },
      "Deleted search history entry",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete search history entry", error, { query });
    return { success: false, error: "Failed to delete search history entry" };
  }
}
