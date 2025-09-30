ALTER TABLE `recipes` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);--> statement-breakpoint
CREATE INDEX `recipes_slug_idx` ON `recipes` (`slug`);