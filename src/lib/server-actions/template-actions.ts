"use server";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import { userNoteTemplates } from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type {
  TemplateWithMeta,
  UserNoteTemplate,
} from "@/lib/types/template-types";
import {
  type BulkTemplateActionInput,
  bulkTemplateActionSchema,
  type CreateTemplateInput,
  createTemplateSchema,
  type TemplateFiltersInput,
  type TemplateUsageInput,
  templateFiltersSchema,
  templateUsageSchema,
  type UpdateTemplateInput,
  updateTemplateSchema,
} from "@/lib/validations/template-schemas";

// Server action result types
interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create a new user template
export async function createTemplate(
  input: CreateTemplateInput,
): Promise<ActionResult<UserNoteTemplate>> {
  const logger = createOperationLogger("create-template");

  try {
    // Validate input
    const validatedInput = createTemplateSchema.parse(input);

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      { userId: session.user.id, templateName: validatedInput.name },
      "Creating new template",
    );

    // Check for duplicate template names for this user
    const existingTemplate = await db
      .select()
      .from(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.userId, session.user.id),
          eq(userNoteTemplates.name, validatedInput.name),
        ),
      )
      .limit(1);

    if (existingTemplate.length > 0) {
      return {
        success: false,
        error: "A template with this name already exists",
      };
    }

    // Create the template
    const templateId = nanoid();
    const now = new Date();

    const [newTemplate] = await db
      .insert(userNoteTemplates)
      .values({
        id: templateId,
        userId: session.user.id,
        name: validatedInput.name,
        description: validatedInput.description,
        category: validatedInput.category,
        content: validatedInput.content,
        tags: validatedInput.tags || [],
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info(
      { templateId, userId: session.user.id },
      "Template created successfully",
    );

    return {
      success: true,
      data: newTemplate,
    };
  } catch (error) {
    logError(logger, "Failed to create template", error, { input });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

// Get all templates for the current user
export async function getUserTemplates(
  filters?: TemplateFiltersInput,
): Promise<ActionResult<TemplateWithMeta[]>> {
  const logger = createOperationLogger("get-user-templates");

  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate filters if provided, use defaults if not
    const validatedFilters = templateFiltersSchema.parse(filters || {});

    logger.info(
      { userId: session.user.id, filters: validatedFilters },
      "Fetching user templates",
    );

    // Build query conditions
    const whereConditions = [eq(userNoteTemplates.userId, session.user.id)];

    if (validatedFilters.category) {
      whereConditions.push(
        eq(userNoteTemplates.category, validatedFilters.category),
      );
    }

    if (validatedFilters.searchTerm) {
      const searchTerm = `%${validatedFilters.searchTerm}%`;
      whereConditions.push(
        sql`(${userNoteTemplates.name} LIKE ${searchTerm} OR ${userNoteTemplates.description} LIKE ${searchTerm})`,
      );
    }

    // Build order by clause
    let orderBy: ReturnType<typeof asc | typeof desc>;
    const isDesc = validatedFilters.sortOrder === "desc";

    switch (validatedFilters.sortBy) {
      case "usage":
        orderBy = isDesc
          ? desc(userNoteTemplates.usageCount)
          : asc(userNoteTemplates.usageCount);
        break;
      case "created":
        orderBy = isDesc
          ? desc(userNoteTemplates.createdAt)
          : asc(userNoteTemplates.createdAt);
        break;
      case "updated":
        orderBy = isDesc
          ? desc(userNoteTemplates.updatedAt)
          : asc(userNoteTemplates.updatedAt);
        break;
      default: // name
        orderBy = isDesc
          ? desc(userNoteTemplates.name)
          : asc(userNoteTemplates.name);
    }

    // Execute query
    const templates = await db
      .select()
      .from(userNoteTemplates)
      .where(and(...whereConditions))
      .orderBy(orderBy);

    // Enhance templates with metadata
    const templatesWithMeta: TemplateWithMeta[] = templates.map((template) => ({
      ...template,
      isSystem: false, // User templates are never system templates
      isRecent:
        template.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Updated in last 7 days
    }));

    logger.info(
      { userId: session.user.id, count: templates.length },
      "Templates fetched successfully",
    );

    return {
      success: true,
      data: templatesWithMeta,
    };
  } catch (error) {
    logError(logger, "Failed to fetch user templates", error, { filters });
    return {
      success: false,
      error: "Failed to fetch templates",
    };
  }
}

// Update an existing template
export async function updateTemplate(
  input: UpdateTemplateInput,
): Promise<ActionResult<UserNoteTemplate>> {
  const logger = createOperationLogger("update-template");

  try {
    // Validate input
    const validatedInput = updateTemplateSchema.parse(input);

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      { userId: session.user.id, templateId: validatedInput.id },
      "Updating template",
    );

    // Check if template exists and belongs to user
    const existingTemplate = await db
      .select()
      .from(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.id, validatedInput.id),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return { success: false, error: "Template not found" };
    }

    // Check for duplicate name (excluding current template)
    if (validatedInput.name !== existingTemplate[0].name) {
      const duplicateTemplate = await db
        .select()
        .from(userNoteTemplates)
        .where(
          and(
            eq(userNoteTemplates.userId, session.user.id),
            eq(userNoteTemplates.name, validatedInput.name),
            sql`${userNoteTemplates.id} != ${validatedInput.id}`,
          ),
        )
        .limit(1);

      if (duplicateTemplate.length > 0) {
        return {
          success: false,
          error: "A template with this name already exists",
        };
      }
    }

    // Update the template
    const [updatedTemplate] = await db
      .update(userNoteTemplates)
      .set({
        name: validatedInput.name,
        description: validatedInput.description,
        category: validatedInput.category,
        content: validatedInput.content,
        tags: validatedInput.tags || [],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userNoteTemplates.id, validatedInput.id),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      )
      .returning();

    logger.info(
      { templateId: validatedInput.id, userId: session.user.id },
      "Template updated successfully",
    );

    return {
      success: true,
      data: updatedTemplate,
    };
  } catch (error) {
    logError(logger, "Failed to update template", error, { input });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

// Delete a template
export async function deleteTemplate(
  templateId: string,
): Promise<ActionResult> {
  const logger = createOperationLogger("delete-template");

  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info({ userId: session.user.id, templateId }, "Deleting template");

    // Check if template exists and belongs to user
    const existingTemplate = await db
      .select()
      .from(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.id, templateId),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return { success: false, error: "Template not found" };
    }

    // Delete the template
    await db
      .delete(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.id, templateId),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      );

    logger.info(
      { templateId, userId: session.user.id },
      "Template deleted successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete template", error, { templateId });
    return {
      success: false,
      error: "Failed to delete template",
    };
  }
}

// Record template usage
export async function recordTemplateUsage(
  input: TemplateUsageInput,
): Promise<ActionResult> {
  const logger = createOperationLogger("record-template-usage");

  try {
    // Validate input
    const validatedInput = templateUsageSchema.parse(input);

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      { userId: session.user.id, templateId: validatedInput.templateId },
      "Recording template usage",
    );

    // Update usage count
    await db
      .update(userNoteTemplates)
      .set({
        usageCount: sql`${userNoteTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userNoteTemplates.id, validatedInput.templateId),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      );

    logger.info(
      { templateId: validatedInput.templateId, userId: session.user.id },
      "Template usage recorded",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to record template usage", error, { input });
    return {
      success: false,
      error: "Failed to record template usage",
    };
  }
}

// Duplicate a template
export async function duplicateTemplate(
  templateId: string,
): Promise<ActionResult<UserNoteTemplate>> {
  const logger = createOperationLogger("duplicate-template");

  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      { userId: session.user.id, templateId },
      "Duplicating template",
    );

    // Get the original template
    const [originalTemplate] = await db
      .select()
      .from(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.id, templateId),
          eq(userNoteTemplates.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!originalTemplate) {
      return { success: false, error: "Template not found" };
    }

    // Create a new template with "Copy" prefix
    const newTemplateId = nanoid();
    const copyName = `${originalTemplate.name} (Copy)`;
    const now = new Date();

    const [duplicatedTemplate] = await db
      .insert(userNoteTemplates)
      .values({
        id: newTemplateId,
        userId: session.user.id,
        name: copyName,
        description: originalTemplate.description,
        category: originalTemplate.category,
        content: originalTemplate.content,
        tags: originalTemplate.tags,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info(
      {
        templateId: newTemplateId,
        originalTemplateId: templateId,
        userId: session.user.id,
      },
      "Template duplicated successfully",
    );

    return {
      success: true,
      data: duplicatedTemplate,
    };
  } catch (error) {
    logError(logger, "Failed to duplicate template", error, { templateId });
    return {
      success: false,
      error: "Failed to duplicate template",
    };
  }
}

// Bulk template operations
export async function bulkTemplateAction(
  input: BulkTemplateActionInput,
): Promise<ActionResult<{ processed: number }>> {
  const logger = createOperationLogger("bulk-template-action");

  try {
    // Validate input
    const validatedInput = bulkTemplateActionSchema.parse(input);

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    logger.info(
      {
        userId: session.user.id,
        action: validatedInput.action,
        templateIds: validatedInput.templateIds,
      },
      "Performing bulk template action",
    );

    // Verify all templates belong to the user
    const userTemplates = await db
      .select()
      .from(userNoteTemplates)
      .where(
        and(
          eq(userNoteTemplates.userId, session.user.id),
          sql`${userNoteTemplates.id} IN ${validatedInput.templateIds}`,
        ),
      );

    if (userTemplates.length !== validatedInput.templateIds.length) {
      return {
        success: false,
        error: "Some templates not found or access denied",
      };
    }

    let processed = 0;

    switch (validatedInput.action) {
      case "delete":
        await db
          .delete(userNoteTemplates)
          .where(
            and(
              eq(userNoteTemplates.userId, session.user.id),
              sql`${userNoteTemplates.id} IN ${validatedInput.templateIds}`,
            ),
          );
        processed = validatedInput.templateIds.length;
        break;

      case "updateCategory":
        if (!validatedInput.newCategory) {
          return {
            success: false,
            error: "New category is required for category update",
          };
        }
        await db
          .update(userNoteTemplates)
          .set({
            category: validatedInput.newCategory,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userNoteTemplates.userId, session.user.id),
              sql`${userNoteTemplates.id} IN ${validatedInput.templateIds}`,
            ),
          );
        processed = validatedInput.templateIds.length;
        break;

      default:
        return { success: false, error: "Unsupported bulk action" };
    }

    logger.info(
      {
        userId: session.user.id,
        action: validatedInput.action,
        processed,
      },
      "Bulk template action completed",
    );

    return {
      success: true,
      data: { processed },
    };
  } catch (error) {
    logError(logger, "Failed to perform bulk template action", error, {
      input,
    });
    return {
      success: false,
      error: "Failed to perform bulk operation",
    };
  }
}
