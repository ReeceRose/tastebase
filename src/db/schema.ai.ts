import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "@/db/schema.base";
import { AIProvider, ImageProcessingMethod } from "@/lib/types/ai-types";

export const aiProviderConfigurations = sqliteTable(
  "ai_provider_configurations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", {
      enum: [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.GOOGLE,
        AIProvider.OLLAMA,
        AIProvider.NONE,
      ],
    }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    encryptedApiKey: text("encrypted_api_key"),
    modelName: text("model_name"),
    maxTokens: integer("max_tokens").default(4000),
    taskSpecificTokenLimits: text("task_specific_token_limits"),
    temperature: integer("temperature", { mode: "number" }).default(0.7),
    enabledTasks: text("enabled_tasks").default("recipe-parsing").notNull(),
    ollamaHost: text("ollama_host").default("http://localhost:11434"),
    imageProcessingMethod: text("image_processing_method", {
      enum: [
        ImageProcessingMethod.AUTO,
        ImageProcessingMethod.AI_VISION,
        ImageProcessingMethod.OCR,
      ],
    }).default(ImageProcessingMethod.AUTO),
    createdAt: integer("created_at", { mode: "timestamp" })
      .defaultNow()
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);

export const conversationSessions = sqliteTable("conversation_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  context: text("context"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const conversationHistory = sqliteTable("conversation_history", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => conversationSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  taskType: text("task_type", {
    enum: [
      "recipe-parsing",
      "chat-conversation",
      "recipe-discovery",
      "cooking-assistance",
    ],
  }),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const aiTaskHistory = sqliteTable("ai_task_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskType: text("task_type", {
    enum: [
      "recipe-parsing",
      "chat-conversation",
      "recipe-discovery",
      "cooking-assistance",
    ],
  }).notNull(),
  provider: text("provider", {
    enum: [
      AIProvider.OPENAI,
      AIProvider.ANTHROPIC,
      AIProvider.GOOGLE,
      AIProvider.OLLAMA,
    ],
  }).notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  success: integer("success", { mode: "boolean" }).notNull(),
  errorMessage: text("error_message"),
  responseTime: integer("response_time"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const aiModelPresets = sqliteTable("ai_model_presets", {
  id: text("id").primaryKey(),
  provider: text("provider", {
    enum: [
      AIProvider.OPENAI,
      AIProvider.ANTHROPIC,
      AIProvider.GOOGLE,
      AIProvider.OLLAMA,
    ],
  }).notNull(),
  modelName: text("model_name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  maxTokens: integer("max_tokens").notNull(),
  costPer1kTokens: integer("cost_per_1k_tokens", { mode: "number" }),
  isRecommended: integer("is_recommended", { mode: "boolean" }).default(false),
  taskCompatibility: text("task_compatibility").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export type AIProviderConfiguration =
  typeof aiProviderConfigurations.$inferSelect;
export type AIProviderConfigurationInsert =
  typeof aiProviderConfigurations.$inferInsert;
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type ConversationSessionInsert =
  typeof conversationSessions.$inferInsert;
export type ConversationMessage = typeof conversationHistory.$inferSelect;
export type ConversationMessageInsert = typeof conversationHistory.$inferInsert;
export type AITaskHistoryEntry = typeof aiTaskHistory.$inferSelect;
export type AITaskHistoryInsert = typeof aiTaskHistory.$inferInsert;
export type AIModelPreset = typeof aiModelPresets.$inferSelect;
export type AIModelPresetInsert = typeof aiModelPresets.$inferInsert;
