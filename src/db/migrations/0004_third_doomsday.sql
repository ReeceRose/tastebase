CREATE TABLE `user_note_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'general' NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`is_public` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_templates_user_id_idx` ON `user_note_templates` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_templates_category_idx` ON `user_note_templates` (`category`);--> statement-breakpoint
CREATE INDEX `user_templates_usage_count_idx` ON `user_note_templates` (`usage_count`);--> statement-breakpoint
CREATE INDEX `user_templates_created_at_idx` ON `user_note_templates` (`created_at`);