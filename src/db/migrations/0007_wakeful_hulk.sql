CREATE UNIQUE INDEX `storage_stats_user_id_unique` ON `storage_stats` (`user_id`);--> statement-breakpoint
ALTER TABLE `storage_stats` DROP COLUMN `storage_limit_mb`;