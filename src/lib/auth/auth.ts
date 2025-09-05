import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/lib/config/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false, // Simplified for single-user app
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days - convenient for recipe browsing
    updateAge: 60 * 60 * 24, // 24 hours - update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  advanced: {
    database: {
      generateId: () => {
        // Use a simple ID generator for single-user scenario
        return crypto.randomUUID();
      },
    },
  },
});
