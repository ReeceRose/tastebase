CREATE TABLE `recipe_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`filename` text NOT NULL,
	`original_name` text,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`duration_seconds` integer,
	`title` text,
	`step_numbers` text DEFAULT '[]' NOT NULL,
	`sort_order` integer NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_videos_recipe_id_idx` ON `recipe_videos` (`recipe_id`);