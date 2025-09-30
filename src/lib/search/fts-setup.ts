import { sql } from "drizzle-orm";
import { db } from "@/db";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("fts-setup");

export async function createRecipesFtsTable(): Promise<void> {
  try {
    logger.info("Creating recipes FTS table");

    // Create FTS5 virtual table for recipe search
    await db.run(sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
        id,
        title,
        description,
        cuisine,
        ingredients,
        instructions,
        tags,
        notes,
        content='recipes'
      )
    `);

    // Create triggers to keep FTS table synchronized with main tables
    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_insert AFTER INSERT ON recipes BEGIN
        INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags, notes)
        SELECT 
          NEW.id,
          NEW.title,
          COALESCE(NEW.description, ''),
          COALESCE(NEW.cuisine, ''),
          (SELECT GROUP_CONCAT(name || ' ' || COALESCE(unit, '') || ' ' || COALESCE(notes, ''), ' ') 
           FROM recipe_ingredients WHERE recipe_id = NEW.id),
          (SELECT GROUP_CONCAT(instruction, ' ') 
           FROM recipe_instructions WHERE recipe_id = NEW.id ORDER BY step_number),
          (SELECT GROUP_CONCAT(rt.name, ' ') 
           FROM recipe_tags rt 
           JOIN recipe_tag_relations rtr ON rt.id = rtr.tag_id 
           WHERE rtr.recipe_id = NEW.id),
          (SELECT GROUP_CONCAT(rn.content, ' ') 
           FROM recipe_notes rn WHERE rn.recipe_id = NEW.id)
        WHERE NEW.is_archived = 0;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_delete AFTER DELETE ON recipes BEGIN
        DELETE FROM recipes_fts WHERE id = OLD.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS recipes_fts_update AFTER UPDATE ON recipes BEGIN
        DELETE FROM recipes_fts WHERE id = OLD.id;
        INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags, notes)
        SELECT 
          NEW.id,
          NEW.title,
          COALESCE(NEW.description, ''),
          COALESCE(NEW.cuisine, ''),
          (SELECT GROUP_CONCAT(name || ' ' || COALESCE(unit, '') || ' ' || COALESCE(notes, ''), ' ') 
           FROM recipe_ingredients WHERE recipe_id = NEW.id),
          (SELECT GROUP_CONCAT(instruction, ' ') 
           FROM recipe_instructions WHERE recipe_id = NEW.id ORDER BY step_number),
          (SELECT GROUP_CONCAT(rt.name, ' ') 
           FROM recipe_tags rt 
           JOIN recipe_tag_relations rtr ON rt.id = rtr.tag_id 
           WHERE rtr.recipe_id = NEW.id),
          (SELECT GROUP_CONCAT(rn.content, ' ') 
           FROM recipe_notes rn WHERE rn.recipe_id = NEW.id)
        WHERE NEW.is_archived = 0;
      END
    `);

    logger.info("Successfully created FTS table and triggers");
  } catch (error) {
    logError(logger, "Failed to create FTS table", error);
    throw error;
  }
}

export async function rebuildRecipesFtsIndex(): Promise<void> {
  try {
    logger.info("Rebuilding recipes FTS index");

    // Clear existing FTS data
    await db.run(sql`DELETE FROM recipes_fts`);

    // Repopulate FTS table from existing recipes
    await db.run(sql`
      INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags, notes)
      SELECT 
        r.id,
        r.title,
        COALESCE(r.description, ''),
        COALESCE(r.cuisine, ''),
        COALESCE((SELECT GROUP_CONCAT(ri.name || ' ' || COALESCE(ri.unit, '') || ' ' || COALESCE(ri.notes, ''), ' ') 
         FROM recipe_ingredients ri WHERE ri.recipe_id = r.id), ''),
        COALESCE((SELECT GROUP_CONCAT(inst.instruction, ' ') 
         FROM recipe_instructions inst WHERE inst.recipe_id = r.id ORDER BY inst.step_number), ''),
        COALESCE((SELECT GROUP_CONCAT(rt.name, ' ') 
         FROM recipe_tags rt 
         JOIN recipe_tag_relations rtr ON rt.id = rtr.tag_id 
         WHERE rtr.recipe_id = r.id), ''),
        COALESCE((SELECT GROUP_CONCAT(rn.content, ' ') 
         FROM recipe_notes rn WHERE rn.recipe_id = r.id), '')
      FROM recipes r
      WHERE r.is_archived = 0
    `);

    logger.info("Successfully rebuilt FTS index");
  } catch (error) {
    logError(logger, "Failed to rebuild FTS index", error);
    throw error;
  }
}

export async function dropRecipesFtsTable(): Promise<void> {
  try {
    logger.info("Dropping recipes FTS table");

    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_update`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_delete`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_insert`);
    await db.run(sql`DROP TABLE IF EXISTS recipes_fts`);

    logger.info("Successfully dropped FTS table and triggers");
  } catch (error) {
    logError(logger, "Failed to drop FTS table", error);
    throw error;
  }
}
