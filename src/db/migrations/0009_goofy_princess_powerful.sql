CREATE TABLE `storage_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total_recipes` integer DEFAULT 0 NOT NULL,
	`total_images` integer DEFAULT 0 NOT NULL,
	`database_size_mb` real DEFAULT 0 NOT NULL,
	`images_size_mb` real DEFAULT 0 NOT NULL,
	`total_size_mb` real DEFAULT 0 NOT NULL,
	`last_calculated` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `storage_stats_user_id_unique` ON `storage_stats` (`user_id`);