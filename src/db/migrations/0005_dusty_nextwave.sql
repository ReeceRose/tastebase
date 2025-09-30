CREATE TABLE `storage_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total_recipes` integer DEFAULT 0 NOT NULL,
	`total_images` integer DEFAULT 0 NOT NULL,
	`database_size_mb` real DEFAULT 0 NOT NULL,
	`images_size_mb` real DEFAULT 0 NOT NULL,
	`total_size_mb` real DEFAULT 0 NOT NULL,
	`storage_limit_mb` real DEFAULT 10240 NOT NULL,
	`last_calculated` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`show_cooking_times` integer DEFAULT true NOT NULL,
	`show_difficulty` integer DEFAULT true NOT NULL,
	`show_servings` integer DEFAULT true NOT NULL,
	`show_recipe_images` integer DEFAULT true NOT NULL,
	`compact_mode` integer DEFAULT false NOT NULL,
	`default_view_mode` text DEFAULT 'cards' NOT NULL,
	`default_cuisine` text DEFAULT 'none',
	`default_difficulty` text DEFAULT 'medium' NOT NULL,
	`default_servings` integer DEFAULT 4 NOT NULL,
	`default_prep_time` integer DEFAULT 30 NOT NULL,
	`default_cook_time` integer DEFAULT 45 NOT NULL,
	`default_unit` text DEFAULT 'cups' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`timezone` text DEFAULT 'America/New_York' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
