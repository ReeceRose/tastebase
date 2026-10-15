"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import type { AuthenticatedUser } from "@/lib/server-actions/utils";

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return session.user as AuthenticatedUser;
}
