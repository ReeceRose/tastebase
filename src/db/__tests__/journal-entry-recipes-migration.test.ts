import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";

const MIGRATIONS = "./src/db/migrations";
const BEFORE = "0030_add_cooking_journal";

interface JournalMeta {
  entries: { tag: string }[];
}

// A copy of the migrations folder that stops at the journal's first version
function migrationsUpTo(tag: string): string {
  const folder = mkdtempSync(join(tmpdir(), "tastebase-migrations-"));
  cpSync(MIGRATIONS, folder, { recursive: true });
  const metaPath = join(folder, "meta", "_journal.json");
  const meta: JournalMeta = JSON.parse(readFileSync(metaPath, "utf8"));
  const last = meta.entries.findIndex((entry) => entry.tag === tag);
  meta.entries = meta.entries.slice(0, last + 1);
  writeFileSync(metaPath, JSON.stringify(meta));
  return folder;
}

describe("journal entry recipes migration", () => {
  let folder: string | null = null;

  afterEach(() => {
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = null;
  });

  it("moves each entry's recipe into the link table and keeps photos", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    folder = migrationsUpTo(BEFORE);
    migrate(db, { migrationsFolder: folder });

    sqlite.exec(`
      INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
        VALUES ('u1', 'Ree', 'ree@example.com', 0, 0, 0);
      INSERT INTO recipes (id, slug, user_id, title, created_at, updated_at)
        VALUES ('pizza', 'pizza', 'u1', 'Pizza', 0, 0);
      INSERT INTO journal_entries (id, user_id, kind, recipe_id, recipe_title, happened_at, created_at, updated_at)
        VALUES ('linked', 'u1', 'cooked', 'pizza', 'Pizza', 1, 0, 0),
               ('deleted', 'u1', 'cooked', NULL, 'Old stew', 2, 0, 0),
               ('note', 'u1', 'note', NULL, NULL, 3, 0, 0);
      INSERT INTO journal_photos (id, entry_id, filename, mime_type, file_size, sort_order, uploaded_at)
        VALUES ('p1', 'linked', 'pizza.jpg', 'image/jpeg', 1, 0, 0),
               ('p2', 'note', 'note.jpg', 'image/jpeg', 1, 0, 0);
    `);

    migrate(db, { migrationsFolder: MIGRATIONS });

    expect(
      sqlite
        .prepare(
          "SELECT entry_id, recipe_id, recipe_title FROM journal_entry_recipes ORDER BY entry_id",
        )
        .all(),
    ).toEqual([
      { entry_id: "deleted", recipe_id: null, recipe_title: "Old stew" },
      { entry_id: "linked", recipe_id: "pizza", recipe_title: "Pizza" },
    ]);
    expect(
      sqlite.prepare("SELECT id FROM journal_photos ORDER BY id").all(),
    ).toEqual([{ id: "p1" }, { id: "p2" }]);
    expect(
      sqlite.prepare("SELECT count(*) AS n FROM journal_entries").get(),
    ).toEqual({ n: 3 });
    expect(sqlite.pragma("foreign_key_check")).toEqual([]);
  });
});
