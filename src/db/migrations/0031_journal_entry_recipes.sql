CREATE TABLE `__journal_links_backup` AS SELECT `id` AS `entry_id`, `recipe_id`, COALESCE(`recipe_title`, (SELECT `title` FROM `recipes` WHERE `recipes`.`id` = `journal_entries`.`recipe_id`), 'A recipe') AS `recipe_title` FROM `journal_entries` WHERE `recipe_id` IS NOT NULL OR `recipe_title` IS NOT NULL;--> statement-breakpoint
CREATE TABLE `__journal_photos_backup` AS SELECT * FROM `journal_photos`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text,
	`content` text,
	`rating` integer,
	`is_private` integer DEFAULT false NOT NULL,
	`happened_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "user_id", "kind", "title", "content", "rating", "is_private", "happened_at", "created_at", "updated_at") SELECT "id", "user_id", "kind", "title", "content", "rating", "is_private", "happened_at", "created_at", "updated_at" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `journal_entries_user_happened_idx` ON `journal_entries` (`user_id`,`happened_at`);--> statement-breakpoint
DELETE FROM `journal_photos`;--> statement-breakpoint
INSERT INTO `journal_photos` SELECT * FROM `__journal_photos_backup`;--> statement-breakpoint
DROP TABLE `__journal_photos_backup`;--> statement-breakpoint
CREATE TABLE `journal_entry_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`recipe_id` text,
	`recipe_title` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `journal_entry_recipes_entry_id_idx` ON `journal_entry_recipes` (`entry_id`);--> statement-breakpoint
CREATE INDEX `journal_entry_recipes_recipe_id_idx` ON `journal_entry_recipes` (`recipe_id`);--> statement-breakpoint
INSERT INTO `journal_entry_recipes`("id", "entry_id", "recipe_id", "recipe_title", "sort_order") SELECT 'jer-' || `entry_id`, `entry_id`, `recipe_id`, `recipe_title`, 0 FROM `__journal_links_backup`;--> statement-breakpoint
DROP TABLE `__journal_links_backup`;
