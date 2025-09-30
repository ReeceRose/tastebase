import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/lib/config/env";
import { createOperationLogger } from "@/lib/logging/logger";

// BetterAuth hook context types
interface AuthContext {
  path: string;
  body?: Record<string, unknown>;
  returned?: {
    user?: {
      id: string;
      email?: string;
    };
  };
}

const logger = createOperationLogger("auth");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false, // Simplified for single-user recipe app
    sendResetPassword: async ({ user, url }) => {
      // For single-user local deployment, log the reset link instead of sending email
      logger.info(
        {
          userId: user.id,
          resetLink: url,
          email: user.email,
        },
        "Password reset requested - reset link generated",
      );

      // In a production multi-user setup, you would send email here
      // For local single-user deployment, the link is logged for manual access
      return;
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days - convenient for recipe browsing
    updateAge: 60 * 60 * 24, // 24 hours - update session daily for fresh recipe access
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days - persistent recipe browsing
    },
  },
  user: {
    additionalFields: {
      // Recipe app specific user preferences
      preferredTemperatureUnit: {
        type: "string",
        defaultValue: "fahrenheit", // fahrenheit or celsius
      },
      preferredWeightUnit: {
        type: "string",
        defaultValue: "imperial", // imperial (oz, lb) or metric (g, kg)
      },
      preferredVolumeUnit: {
        type: "string",
        defaultValue: "imperial", // imperial (tsp, tbsp, cup, fl oz) or metric (ml, l)
      },
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL, "http://localhost:3000"],
  advanced: {
    database: {
      generateId: () => {
        // Use crypto.randomUUID for secure ID generation
        return crypto.randomUUID();
      },
    },
    hooks: {
      after: [
        {
          matcher: (context: AuthContext) => {
            return (
              context.path === "/sign-up/email" ||
              context.path === "/sign-in/email"
            );
          },
          handler: async (ctx: AuthContext) => {
            if (ctx.returned?.user) {
              logger.info(
                { userId: ctx.returned.user.id, method: ctx.path },
                "User authentication successful",
              );
            }
          },
        },
        {
          matcher: (context: AuthContext) => context.path === "/sign-out",
          handler: async (_ctx: AuthContext) => {
            logger.info("User signed out");
          },
        },
      ],
      before: [
        {
          matcher: (context: AuthContext) => context.path === "/sign-up/email",
          handler: async (ctx: AuthContext) => {
            logger.info({ email: ctx.body?.email }, "User signup attempt");
          },
        },
      ],
    },
  },
  rateLimit: {
    window: 60, // 1 minute window
    max: 30, // 30 requests per minute - generous for recipe browsing
  },
});
