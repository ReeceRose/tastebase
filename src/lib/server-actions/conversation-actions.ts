"use server";

import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversationHistory, conversationSessions } from "@/db/schema.ai";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { AITask } from "@/lib/types/ai-types";

const logger = createOperationLogger("conversation-actions");

export interface ConversationMessageData {
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  taskType?: AITask;
  metadata?: Record<string, unknown>;
}

export interface ConversationSessionData {
  userId: string;
  title?: string;
  context?: Record<string, unknown>;
}

export async function createConversationSession(data: ConversationSessionData) {
  try {
    const sessionId = crypto.randomUUID();

    await db.insert(conversationSessions).values({
      id: sessionId,
      userId: data.userId,
      title: data.title || "New Conversation",
      context: data.context ? JSON.stringify(data.context) : null,
      isActive: true,
    });

    logger.info(
      {
        sessionId,
        userId: data.userId,
      },
      "Conversation session created",
    );

    return {
      success: true,
      data: { sessionId },
    };
  } catch (error) {
    logError(logger, "Failed to create conversation session", error as Error, {
      userId: data.userId,
    });

    return {
      success: false,
      error: "Failed to create conversation session",
    };
  }
}

export async function saveConversationMessage(data: ConversationMessageData) {
  try {
    const messageId = crypto.randomUUID();

    // Ensure conversation session exists (upsert)
    await db
      .insert(conversationSessions)
      .values({
        id: data.sessionId,
        userId: data.userId,
        title: `${data.taskType || "Chat"} Session`,
        context: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: conversationSessions.id,
        set: {
          updatedAt: new Date(),
        },
      });

    await db.insert(conversationHistory).values({
      id: messageId,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      taskType: data.taskType || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });

    logger.info(
      {
        messageId,
        sessionId: data.sessionId,
        userId: data.userId,
        role: data.role,
        taskType: data.taskType,
      },
      "Conversation message saved",
    );

    return {
      success: true,
      data: { messageId },
    };
  } catch (error) {
    logError(logger, "Failed to save conversation message", error as Error, {
      sessionId: data.sessionId,
      userId: data.userId,
      role: data.role,
    });

    return {
      success: false,
      error: "Failed to save conversation message",
    };
  }
}

export async function getConversationHistory(
  sessionId: string,
  userId: string,
) {
  try {
    const messages = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId))
      .orderBy(conversationHistory.createdAt);

    // Verify session belongs to user
    const session = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.id, sessionId))
      .limit(1);

    if (session.length === 0 || session[0].userId !== userId) {
      return {
        success: false,
        error: "Session not found or access denied",
      };
    }

    logger.info(
      {
        sessionId,
        userId,
        messageCount: messages.length,
      },
      "Conversation history retrieved",
    );

    return {
      success: true,
      data: messages,
    };
  } catch (error) {
    logError(logger, "Failed to get conversation history", error as Error, {
      sessionId,
      userId,
    });

    return {
      success: false,
      error: "Failed to get conversation history",
    };
  }
}

export async function getUserConversationSessions(
  userId: string,
  options: { limit?: number; offset?: number; search?: string } = {},
) {
  try {
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const searchTerm = options.search?.toLowerCase().trim();

    let sessions: InferSelectModel<typeof conversationSessions>[] = [];
    let totalResult: { count: number }[] = [];

    if (searchTerm) {
      // First get session IDs that have matching content in conversation history
      const sessionsWithMatchingContent = await db
        .selectDistinct({ sessionId: conversationHistory.sessionId })
        .from(conversationHistory)
        .where(
          sql`LOWER(${conversationHistory.content}) LIKE ${`%${searchTerm}%`}`,
        );

      const matchingSessionIds = sessionsWithMatchingContent.map(
        (row) => row.sessionId,
      );

      // Build the where condition
      let whereCondition = eq(conversationSessions.userId, userId);

      if (matchingSessionIds.length > 0) {
        whereCondition = sql`${conversationSessions.userId} = ${userId} AND (
          LOWER(${conversationSessions.title}) LIKE ${`%${searchTerm}%`} OR
          ${conversationSessions.id} IN (${sql.join(
            matchingSessionIds.map((id) => sql`${id}`),
            sql`, `,
          )})
        )`;
      } else {
        // Only search in titles if no content matches found
        whereCondition = sql`${conversationSessions.userId} = ${userId} AND LOWER(${conversationSessions.title}) LIKE ${`%${searchTerm}%`}`;
      }

      sessions = await db
        .select()
        .from(conversationSessions)
        .where(whereCondition)
        .orderBy(sql`${conversationSessions.updatedAt} DESC`)
        .limit(limit)
        .offset(offset);

      // Get total count for search results
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(conversationSessions)
        .where(whereCondition);

      totalResult = totalCount as { count: number }[];
    } else {
      // No search - get all sessions
      sessions = await db
        .select()
        .from(conversationSessions)
        .where(eq(conversationSessions.userId, userId))
        .orderBy(sql`${conversationSessions.updatedAt} DESC`)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination info
      totalResult = (await db
        .select({ count: sql<number>`count(*)` })
        .from(conversationSessions)
        .where(eq(conversationSessions.userId, userId))) as { count: number }[];
    }

    const total = totalResult[0]?.count || 0;
    const hasMore = offset + sessions.length < total;

    logger.info(
      {
        userId,
        sessionCount: sessions.length,
        total,
        hasMore,
        offset,
        limit,
        search: searchTerm,
      },
      searchTerm
        ? "User conversation sessions searched"
        : "User conversation sessions retrieved",
    );

    return {
      success: true,
      data: sessions,
      pagination: {
        total,
        hasMore,
        offset,
        limit,
      },
    };
  } catch (error) {
    logError(
      logger,
      "Failed to get user conversation sessions",
      error as Error,
      {
        userId,
      },
    );

    return {
      success: false,
      error: "Failed to get conversation sessions",
    };
  }
}

export async function updateConversationSession(
  sessionId: string,
  userId: string,
  updates: {
    title?: string;
    context?: Record<string, unknown>;
    isActive?: boolean;
  },
) {
  try {
    // Verify session belongs to user
    const session = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.id, sessionId))
      .limit(1);

    if (session.length === 0 || session[0].userId !== userId) {
      return {
        success: false,
        error: "Session not found or access denied",
      };
    }

    await db
      .update(conversationSessions)
      .set({
        title: updates.title,
        context: updates.context ? JSON.stringify(updates.context) : undefined,
        isActive: updates.isActive,
        updatedAt: new Date(),
      })
      .where(eq(conversationSessions.id, sessionId));

    logger.info(
      {
        sessionId,
        userId,
        updates: Object.keys(updates),
      },
      "Conversation session updated",
    );

    return {
      success: true,
      data: { sessionId },
    };
  } catch (error) {
    logError(logger, "Failed to update conversation session", error as Error, {
      sessionId,
      userId,
    });

    return {
      success: false,
      error: "Failed to update conversation session",
    };
  }
}

export async function deleteConversationSession(
  sessionId: string,
  userId: string,
) {
  try {
    // Verify session belongs to user
    const session = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.id, sessionId))
      .limit(1);

    if (session.length === 0 || session[0].userId !== userId) {
      return {
        success: false,
        error: "Session not found or access denied",
      };
    }

    // Delete conversation history first (foreign key constraint)
    await db
      .delete(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId));

    // Delete conversation session
    await db
      .delete(conversationSessions)
      .where(eq(conversationSessions.id, sessionId));

    logger.info(
      {
        sessionId,
        userId,
      },
      "Conversation session deleted",
    );

    return {
      success: true,
      data: { sessionId },
    };
  } catch (error) {
    logError(logger, "Failed to delete conversation session", error as Error, {
      sessionId,
      userId,
    });

    return {
      success: false,
      error: "Failed to delete conversation session",
    };
  }
}
