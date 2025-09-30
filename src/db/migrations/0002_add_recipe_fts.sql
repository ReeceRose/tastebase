-- Create FTS5 virtual table for recipe search
CREATE VIRTUAL TABLE recipes_fts USING fts5(
  id,
  title,
  description,
  cuisine,
  ingredients,
  instructions,
  tags,
  content='recipes'
);

-- Create triggers to keep FTS table synchronized with main tables
CREATE TRIGGER recipes_fts_insert AFTER INSERT ON recipes BEGIN
  INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags)
  SELECT 
    NEW.id,
    NEW.title,
    COALESCE(NEW.description, ''),
    COALESCE(NEW.cuisine, ''),
    COALESCE((SELECT GROUP_CONCAT(name || ' ' || COALESCE(unit, '') || ' ' || COALESCE(notes, ''), ' ') 
     FROM recipe_ingredients WHERE recipe_id = NEW.id), ''),
    COALESCE((SELECT GROUP_CONCAT(instruction, ' ') 
     FROM recipe_instructions WHERE recipe_id = NEW.id ORDER BY step_number), ''),
    COALESCE((SELECT GROUP_CONCAT(rt.name, ' ') 
     FROM recipe_tags rt 
     JOIN recipe_tag_relations rtr ON rt.id = rtr.tag_id 
     WHERE rtr.recipe_id = NEW.id), '')
  WHERE NEW.is_archived = 0;
END;

CREATE TRIGGER recipes_fts_delete AFTER DELETE ON recipes BEGIN
  DELETE FROM recipes_fts WHERE id = OLD.id;
END;

CREATE TRIGGER recipes_fts_update AFTER UPDATE ON recipes BEGIN
  DELETE FROM recipes_fts WHERE id = OLD.id;
  INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags)
  SELECT 
    NEW.id,
    NEW.title,
    COALESCE(NEW.description, ''),
    COALESCE(NEW.cuisine, ''),
    COALESCE((SELECT GROUP_CONCAT(name || ' ' || COALESCE(unit, '') || ' ' || COALESCE(notes, ''), ' ') 
     FROM recipe_ingredients WHERE recipe_id = NEW.id), ''),
    COALESCE((SELECT GROUP_CONCAT(instruction, ' ') 
     FROM recipe_instructions WHERE recipe_id = NEW.id ORDER BY step_number), ''),
    COALESCE((SELECT GROUP_CONCAT(rt.name, ' ') 
     FROM recipe_tags rt 
     JOIN recipe_tag_relations rtr ON rt.id = rtr.tag_id 
     WHERE rtr.recipe_id = NEW.id), '')
  WHERE NEW.is_archived = 0;
END;

-- Populate FTS table from existing recipes
INSERT INTO recipes_fts(id, title, description, cuisine, ingredients, instructions, tags)
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
   WHERE rtr.recipe_id = r.id), '')
FROM recipes r
WHERE r.is_archived = 0;