CREATE INDEX `recipe_images_recipe_id_idx` ON `recipe_images` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_images_is_hero_idx` ON `recipe_images` (`is_hero`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_recipe_id_idx` ON `recipe_ingredients` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_ingredients_name_idx` ON `recipe_ingredients` (`name`);--> statement-breakpoint
CREATE INDEX `recipe_instructions_recipe_id_idx` ON `recipe_instructions` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_instructions_step_number_idx` ON `recipe_instructions` (`step_number`);--> statement-breakpoint
CREATE INDEX `recipe_notes_recipe_id_idx` ON `recipe_notes` (`recipe_id`);--> statement-breakpoint
CREATE INDEX `recipe_notes_user_id_idx` ON `recipe_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipe_notes_rating_idx` ON `recipe_notes` (`rating`);--> statement-breakpoint
CREATE INDEX `recipe_tags_name_idx` ON `recipe_tags` (`name`);--> statement-breakpoint
CREATE INDEX `recipe_tags_category_idx` ON `recipe_tags` (`category`);--> statement-breakpoint
CREATE INDEX `recipes_user_id_idx` ON `recipes` (`user_id`);--> statement-breakpoint
CREATE INDEX `recipes_title_idx` ON `recipes` (`title`);--> statement-breakpoint
CREATE INDEX `recipes_created_at_idx` ON `recipes` (`created_at`);--> statement-breakpoint
CREATE INDEX `recipes_cuisine_idx` ON `recipes` (`cuisine`);--> statement-breakpoint
CREATE INDEX `recipes_difficulty_idx` ON `recipes` (`difficulty`);--> statement-breakpoint
CREATE INDEX `recipes_is_archived_idx` ON `recipes` (`is_archived`);