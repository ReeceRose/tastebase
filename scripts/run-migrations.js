// Simple JavaScript migration runner for Docker (no TypeScript/tsx needed)
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');

const DATABASE_URL = process.env.DATABASE_URL || 'file:/app/data/tastebase.db';
const databasePath = DATABASE_URL.replace('file:', '');

console.log('📦 Running database migrations...');
console.log(`Database: ${databasePath}`);

try {
  const sqlite = new Database(databasePath);
  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: './src/db/migrations' });

  console.log('✅ Migrations completed successfully');
  sqlite.close();
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
