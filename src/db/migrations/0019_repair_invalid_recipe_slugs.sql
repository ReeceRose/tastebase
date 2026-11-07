-- Older slug generation could save slugs that were empty, ended in a hyphen,
-- contained a double hyphen, or ran past 50 characters. Title edits skipped
-- validation, so those slugs reached the database.
--
-- OR IGNORE matters: slugs are unique, and a conflict must not stop the app from
-- starting. A row that conflicts in the first pass gets a rowid suffix in the
-- second. If that conflicts too, the row keeps its old slug, which still works.
UPDATE OR IGNORE recipes
SET slug = rtrim(ltrim(substr(replace(slug, '--', '-'), 1, 50), '-'), '-')
WHERE (slug = '' OR length(slug) > 50 OR slug LIKE '-%' OR slug LIKE '%-' OR slug LIKE '%--%')
  AND rtrim(ltrim(substr(replace(slug, '--', '-'), 1, 50), '-'), '-') <> '';
--> statement-breakpoint
UPDATE OR IGNORE recipes
SET slug = coalesce(
  nullif(
    rtrim(ltrim(substr(replace(slug, '--', '-'), 1, 49 - length(rowid)), '-'), '-'),
    ''
  ),
  'recipe'
) || '-' || rowid
WHERE slug = '' OR length(slug) > 50 OR slug LIKE '-%' OR slug LIKE '%-' OR slug LIKE '%--%';
