DROP TABLE `ai_model_presets`;--> statement-breakpoint
DROP TABLE `ai_task_history`;--> statement-breakpoint
DROP TABLE `conversation_history`;--> statement-breakpoint
DROP TABLE `conversation_sessions`;--> statement-breakpoint
ALTER TABLE `ai_provider_configurations` DROP COLUMN `max_tokens`;--> statement-breakpoint
ALTER TABLE `ai_provider_configurations` DROP COLUMN `task_specific_token_limits`;--> statement-breakpoint
ALTER TABLE `ai_provider_configurations` DROP COLUMN `temperature`;--> statement-breakpoint
ALTER TABLE `ai_provider_configurations` DROP COLUMN `enabled_tasks`;--> statement-breakpoint
UPDATE `ai_provider_configurations` SET `model_name` = NULL WHERE `model_name` IN ('gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-5-chat-latest', 'claude-opus-4-latest', 'claude-sonnet-4-latest', 'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash');
