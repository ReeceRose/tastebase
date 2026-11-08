ALTER TABLE `recipe_images` ADD `step_numbers` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
UPDATE `recipe_images` SET `step_numbers` = '[' || `step_number` || ']' WHERE `step_number` IS NOT NULL;
