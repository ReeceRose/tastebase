ALTER TABLE `users` ADD `preferred_temperature_unit` text DEFAULT 'fahrenheit' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_weight_unit` text DEFAULT 'imperial' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_volume_unit` text DEFAULT 'imperial' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `recipe_view_preference` text DEFAULT 'card' NOT NULL;