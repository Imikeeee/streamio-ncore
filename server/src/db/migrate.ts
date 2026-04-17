import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.js';
import { sql } from 'drizzle-orm';
import path from 'path';

console.log('⏳ Running migrations...');

try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('✅ Migrations completed');

  // Manual column addition for existing databases
  try {
    db.run(sql`ALTER TABLE devices ADD COLUMN token TEXT`);
    console.log('✅ Added token column to devices table');
  } catch (e) {
    // Column might already exist
  }
} catch (error) {
  console.error('❌ Migrations failed:', error);
  process.exit(1);
}
