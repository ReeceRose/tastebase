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

const logger = createOperationLogger("auth-actions");

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const updateRecipePreferencesSchema = z.object({
  preferredTemperatureUnit: z.enum(["fahrenheit", "celsius"]),
  preferredWeightUnit: z.enum(["imperial", "metric"]),
  preferredVolumeUnit: z.enum(["imperial", "metric"]),
});

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const preferredTemperatureUnit =
    (formData.get("preferredTemperatureUnit") as string) || "fahrenheit";
  const preferredWeightUnit =
    (formData.get("preferredWeightUnit") as string) || "imperial";
  const preferredVolumeUnit =
    (formData.get("preferredVolumeUnit") as string) || "imperial";

  if (!email || !password || !name) {
    logger.warn({ email }, "Sign up attempt with missing fields");
    return { error: "Missing required fields" };
  }

  try {
    logger.info(
      {
        email,
        name,
        preferredTemperatureUnit,
        preferredWeightUnit,
        preferredVolumeUnit,
      },
      "Creating new recipe app user",
    );

    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        preferredTemperatureUnit,
        preferredWeightUnit,
        preferredVolumeUnit,
      },
      headers: await headers(),
    });

    logger.info({ email }, "Recipe app user created successfully");
    redirect("/");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    logError(logger, "User signup failed", error, { email });

    if (error instanceof Error) {
      if (error.message.includes("User already exists")) {
        return {
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }
      return { error: error.message };
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    logger.warn({ email }, "Sign in attempt with missing fields");
    return { error: "Missing required fields" };
  }

  try {
    logger.info({ email }, "Recipe app user sign in attempt");

    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });

    logger.info({ email }, "User signed in to recipe app successfully");
    redirect("/");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    logError(logger, "User sign in failed", error, { email });

    if (error instanceof Error) {
      if (error.message.includes("Invalid credentials")) {
        return { error: "Invalid email or password. Please try again." };
      }
      return { error: error.message };
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });

    redirect("/");
  } catch (error) {
    // Don't log redirect errors as they're expected behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Sign out error:", error);
    throw error;
  }
}

// Helper function to get current user session with database data
export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Get user from database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .catch(() => [null]);

  // Return merged user with database data taking precedence
  return {
    id: session.user.id,
    name: dbUser?.name || session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
    createdAt: session.user.createdAt,
  };
}

// Helper function to require authentication
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return session.user;
}

export async function getUserProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Get user from database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .catch(() => [null]);

  return {
    session,
    dbUser,
  };
}

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const name = formData.get("name") as string;

  try {
    const validatedData = updateProfileSchema.parse({ name });

    await db
      .update(users)
      .set({
        name: validatedData.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Invalidate cache to refresh data
    revalidatePath("/");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Profile updated successfully",
      updatedName: validatedData.name,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }

    console.error("Profile update error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  try {
    const validatedData = updatePasswordSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    logger.info({ userId: session.user.id }, "Updating user password");

    await auth.api.changePassword({
      body: {
        newPassword: validatedData.newPassword,
        currentPassword: validatedData.currentPassword,
      },
      headers: await headers(),
    });

    logger.info({ userId: session.user.id }, "Password updated successfully");
    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }

    logError(logger, "Password update failed", error, {
      userId: session.user.id,
    });
    return { error: "Failed to update password. Please try again." };
  }
}

// Recipe app specific function to get user with recipe-related data
export async function getUserWithRecipeStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  try {
    // Get user from database with basic info
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .catch(() => [null]);

    if (!dbUser) {
      logger.warn({ userId: session.user.id }, "Database user not found");
      redirect("/auth/sign-in");
    }

    // TODO: Add recipe stats queries when recipe features are implemented
    // const recipeCount = await db.select({ count: count() }).from(recipes).where(eq(recipes.userId, session.user.id));
    // const favoriteCount = await db.select({ count: count() }).from(recipeFavorites).where(eq(recipeFavorites.userId, session.user.id));

    return {
      id: session.user.id,
      name: dbUser.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image,
      createdAt: session.user.createdAt,
      // Recipe-specific stats (to be implemented)
      recipeCount: 0,
      favoriteRecipeCount: 0,
    };
  } catch (error) {
    logError(logger, "Failed to get user with recipe stats", error, {
      userId: session.user.id,
    });
    throw error;
  }
}

export async function updateUserPreferences(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const preferredTemperatureUnit = formData.get(
    "preferredTemperatureUnit",
  ) as string;
  const preferredWeightUnit = formData.get("preferredWeightUnit") as string;
  const preferredVolumeUnit = formData.get("preferredVolumeUnit") as string;

  try {
    const validatedData = updateRecipePreferencesSchema.parse({
      preferredTemperatureUnit,
      preferredWeightUnit,
      preferredVolumeUnit,
    });

    await db
      .update(users)
      .set({
        preferredTemperatureUnit: validatedData.preferredTemperatureUnit,
        preferredWeightUnit: validatedData.preferredWeightUnit,
        preferredVolumeUnit: validatedData.preferredVolumeUnit,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/");
    revalidatePath("/settings");

    logger.info(
      {
        userId: session.user.id,
        preferences: validatedData,
      },
      "User preferences updated successfully",
    );

    return {
      success: true,
      message: "Preferences updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }

    logError(logger, "Preferences update failed", error, {
      userId: session.user.id,
    });
    return { error: "Failed to update preferences. Please try again." };
  }
}

// Helper function to require authentication for recipe operations
export async function requireRecipeAccess() {
  const user = await requireAuth();
  logger.info({ userId: user.id }, "User accessing recipe features");
  return user;
}
