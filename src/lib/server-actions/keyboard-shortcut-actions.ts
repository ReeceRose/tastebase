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
import type {
  KeyboardShortcutOverrides,
  KeyboardShortcutSettings,
} from "@/lib/types";
import {
  DEFAULT_KEYBOARD_SHORTCUT_SETTINGS,
  normalizeKeyboardShortcutSettings,
} from "@/lib/utils/keyboard-shortcuts";

const logger = createOperationLogger("keyboard-shortcuts");

const settingsSchema = z.object({
  enabled: z.boolean(),
  bindings: z.record(z.string(), z.string().max(16).nullable()),
});

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  return session.user.id;
}

export async function getKeyboardShortcutSettings(): Promise<KeyboardShortcutSettings> {
  const userId = await requireUserId();
  const [user] = await db
    .select({ keyboardShortcuts: users.keyboardShortcuts })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.keyboardShortcuts ?? DEFAULT_KEYBOARD_SHORTCUT_SETTINGS;
}

export async function updateKeyboardShortcutSettings(
  input: KeyboardShortcutSettings,
): Promise<ServerActionResult<KeyboardShortcutSettings>> {
  const userId = await requireUserId();
  const parsed = settingsSchema.safeParse(input);
  const settings = parsed.success
    ? normalizeKeyboardShortcutSettings({
        enabled: parsed.data.enabled,
        bindings: parsed.data.bindings as KeyboardShortcutOverrides,
      })
    : null;

  if (!settings) {
    return { success: false, error: "Those shortcuts can't be used together." };
  }

  try {
    await db
      .update(users)
      .set({ keyboardShortcuts: settings, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/", "layout");

    logger.info(
      { userId, enabled: settings.enabled },
      "Keyboard shortcuts updated",
    );
    return { success: true, data: settings };
  } catch (error) {
    logError(logger, "Failed to update keyboard shortcuts", error, { userId });
    return { success: false, error: "That didn't save. Please try again." };
  }
}
