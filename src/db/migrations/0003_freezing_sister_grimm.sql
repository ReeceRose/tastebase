CREATE TABLE `recipe_collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `recipe_collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_collection_items_collection_id_idx` ON `recipe_collection_items` (`collection_id`);--> statement-breakpoint
CREATE INDEX `recipe_collection_items_recipe_id_idx` ON `recipe_collection_items` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_collection_items_sort_order_idx` ON `recipe_collection_items` (`sort_order`);--> statement-breakpoint
CREATE TABLE `recipe_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_collections_user_id_idx` ON `recipe_collections` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_collections_name_idx` ON `recipe_collections` (`name`);--> statement-breakpoint
CREATE INDEX `recipe_collections_sort_order_idx` ON `recipe_collections` (`sort_order`);--> statement-breakpoint
CREATE TABLE `recipe_favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`favorited_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_favorites_recipe_id_idx` ON `recipe_favorites` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_favorites_user_id_idx` ON `recipe_favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_favorites_unique_idx` ON `recipe_favorites` (`recipe_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `recipe_modifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`change_type` text NOT NULL,
	`change_description` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`version_number` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_modifications_recipe_id_idx` ON `recipe_modifications` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_modifications_user_id_idx` ON `recipe_modifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_modifications_change_type_idx` ON `recipe_modifications` (`change_type`);--> statement-breakpoint
CREATE INDEX `recipe_modifications_created_at_idx` ON `recipe_modifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `recipe_views` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`viewed_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_views_recipe_id_idx` ON `recipe_views` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_views_user_id_idx` ON `recipe_views` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_views_viewed_at_idx` ON `recipe_views` (`viewed_at`);