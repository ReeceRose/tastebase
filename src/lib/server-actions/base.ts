"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { AuthenticatedUser } from "./utils";

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return session.user as AuthenticatedUser;
}

export async function withDatabaseTransaction<T>(
  callback: () => Promise<T>,
): Promise<T> {
  const logger = createOperationLogger("database-transaction");

  try {
    logger.info("Starting database transaction");

    const result = await callback();

    logger.info("Database transaction completed successfully");
    return result;
  } catch (error) {
    logger.error("Database transaction failed, rolling back");
    logError(logger, "Transaction error", error);
    throw error;
  }
}
