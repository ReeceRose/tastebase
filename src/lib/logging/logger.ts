import pino from "pino";
import { env } from "@/lib/config/env";

const isDevelopment = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),
  ...(!isDevelopment && {
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  redact: {
    paths: [
      "password",
      "token",
      "key",
      "secret",
      "authorization",
      "cookie",
      "email",
      "stripe.*",
      "*.password",
      "*.token",
      "*.key",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});

export function createUserLogger(userId: string) {
  return logger.child({ userId });
}

export function createOrganizationLogger(organizationId: string) {
  return logger.child({ organizationId });
}

export function createOperationLogger(
  operation: string,
  context?: Record<string, unknown>,
) {
  return logger.child({ operation, ...context });
}

/**
 * Utility to serialize errors for logging
 */
export function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Enhanced logger with error serialization
 */
export function logError(
  logger: pino.Logger,
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  logger.error(
    {
      error: serializeError(error),
      ...context,
    },
    message,
  );
}

export default logger;
