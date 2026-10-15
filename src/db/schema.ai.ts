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

export type AIProviderConfiguration =
  typeof aiProviderConfigurations.$inferSelect;
