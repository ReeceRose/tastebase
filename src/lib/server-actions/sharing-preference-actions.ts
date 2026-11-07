"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { ServerActionResult } from "@/lib/server-actions/utils";

const logger = createOperationLogger("sharing-preference");

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  return session.user.id;
}

export async function getDefaultRecipeIsPublic(): Promise<boolean> {
  const userId = await requireUserId();
  const [user] = await db
    .select({ defaultRecipeIsPublic: users.defaultRecipeIsPublic })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.defaultRecipeIsPublic ?? true;
}

export async function updateDefaultRecipeIsPublic(
  isPublic: boolean,
): Promise<ServerActionResult<boolean>> {
  const userId = await requireUserId();
  const parsed = z.boolean().safeParse(isPublic);
  if (!parsed.success) {
    return { success: false, error: "Choose who can see new recipes." };
  }

  try {
    await db
      .update(users)
      .set({ defaultRecipeIsPublic: parsed.data, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/settings");
    revalidatePath("/recipes/new");

    logger.info(
      { userId, defaultRecipeIsPublic: parsed.data },
      "Default recipe sharing updated",
    );
    return { success: true, data: parsed.data };
  } catch (error) {
    logError(logger, "Failed to update default recipe sharing", error, {
      userId,
    });
    return {
      success: false,
      error: "That didn't save. Please try again.",
    };
  }
}
