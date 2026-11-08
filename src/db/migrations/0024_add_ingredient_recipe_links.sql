ALTER TABLE `recipe_ingredients` ADD `linked_recipe_id` text REFERENCES recipes(id) ON DELETE SET NULL;
