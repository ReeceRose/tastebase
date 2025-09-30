CREATE TABLE `user_search_history` (
	`user_id` text NOT NULL,
	`query` text NOT NULL,
	`results_count` integer DEFAULT 0 NOT NULL,
	`run_count` integer DEFAULT 1 NOT NULL,
	`last_searched_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `query`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_search_history_last_searched_idx` ON `user_search_history` (`last_searched_at`);