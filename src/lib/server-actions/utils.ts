import { ZodError, type ZodSchema } from "zod";
import { createOperationLogger, logError } from "@/lib/logging/logger";

export type ServerActionResult<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      details?: string[];
    };

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export class ServerActionError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_ERROR",
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "ServerActionError";
  }
}

export function createServerAction<TInput, TOutput>(
  actionName: string,
  inputSchema: ZodSchema<TInput>,
  handler: (input: TInput, user: AuthenticatedUser) => Promise<TOutput>,
) {
  const logger = createOperationLogger(`server-action-${actionName}`);

  return async (input: unknown): Promise<ServerActionResult<TOutput>> => {
    try {
      logger.info({ actionName }, "Server action started");

      // Import getAuthenticatedUser dynamically to avoid circular dependency
      const { getAuthenticatedUser } = await import("./base");
      const user = await getAuthenticatedUser();

      logger.info({ userId: user.id, actionName }, "User authenticated");

      const validatedInput = inputSchema.parse(input);
      logger.info({ actionName }, "Input validated successfully");

      const result = await handler(validatedInput, user);

      logger.info(
        { actionName, userId: user.id },
        "Server action completed successfully",
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ actionName, errors: error.issues }, "Validation failed");
        return {
          success: false,
          error: "Invalid input data",
          details: error.issues.map(
            (err) => `${err.path.join(".")}: ${err.message}`,
          ),
        };
      }

      if (error instanceof ServerActionError) {
        logError(logger, `Server action error: ${error.message}`, error, {
          actionName,
          code: error.code,
          statusCode: error.statusCode,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      logError(logger, `Unexpected server action error`, error, { actionName });

      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };
}

export function createPublicServerAction<TInput, TOutput>(
  actionName: string,
  inputSchema: ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>,
) {
  const logger = createOperationLogger(`public-server-action-${actionName}`);

  return async (input: unknown): Promise<ServerActionResult<TOutput>> => {
    try {
      logger.info({ actionName }, "Public server action started");

      const validatedInput = inputSchema.parse(input);
      logger.info({ actionName }, "Input validated successfully");

      const result = await handler(validatedInput);

      logger.info(
        { actionName },
        "Public server action completed successfully",
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ actionName, errors: error.issues }, "Validation failed");
        return {
          success: false,
          error: "Invalid input data",
          details: error.issues.map(
            (err) => `${err.path.join(".")}: ${err.message}`,
          ),
        };
      }

      if (error instanceof ServerActionError) {
        logError(
          logger,
          `Public server action error: ${error.message}`,
          error,
          {
            actionName,
            code: error.code,
            statusCode: error.statusCode,
          },
        );
        return {
          success: false,
          error: error.message,
        };
      }

      logError(logger, `Unexpected public server action error`, error, {
        actionName,
      });

      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };
}

export function validateRequired<T>(
  value: T | undefined | null,
  fieldName: string,
): T {
  if (value === undefined || value === null) {
    throw new ServerActionError(
      `${fieldName} is required`,
      "VALIDATION_ERROR",
      400,
    );
  }
  return value;
}

export function validateOwnership(
  resourceUserId: string,
  currentUserId: string,
  resourceType: string = "resource",
) {
  if (resourceUserId !== currentUserId) {
    throw new ServerActionError(
      `You don't have permission to access this ${resourceType}`,
      "FORBIDDEN",
      403,
    );
  }
}
