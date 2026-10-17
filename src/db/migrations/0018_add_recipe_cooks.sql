CREATE TABLE `recipe_cooks` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`cooked_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_cooks_recipe_id_idx` ON `recipe_cooks` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_cooks_user_id_idx` ON `recipe_cooks` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_cooks_cooked_at_idx` ON `recipe_cooks` (`cooked_at`);