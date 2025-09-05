"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { auth } from "@/lib/auth/auth";

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

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Missing required fields" };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    });

    // Redirect to home after successful signup
    redirect("/");
  } catch (error) {
    // Don't log redirect errors as they're expected behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Sign up error:", error);

    // Handle specific BetterAuth errors
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
    return { error: "Missing required fields" };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });

    // Redirect to home after successful signin
    redirect("/");
  } catch (error) {
    // Don't log redirect errors as they're expected behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Sign in error:", error);

    // Handle specific BetterAuth errors
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
    revalidatePath("/profile");

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

    // Use Better Auth's update password API
    await auth.api.changePassword({
      body: {
        newPassword: validatedData.newPassword,
        currentPassword: validatedData.currentPassword,
      },
      headers: await headers(),
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }

    console.error("Password update error:", error);
    return { error: "Failed to update password. Please try again." };
  }
}
