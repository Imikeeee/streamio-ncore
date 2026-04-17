import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

// Ensure data directory exists
if (!fs.existsSync(env.ADDON_DIR)) {
  fs.mkdirSync(env.ADDON_DIR, { recursive: true });
}

const sqlite = new Database(path.join(env.ADDON_DIR, 'addon.db'));
export const db = drizzle(sqlite);
