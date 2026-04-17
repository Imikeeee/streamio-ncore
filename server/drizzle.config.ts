import { defineConfig } from 'drizzle-kit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const addonDir = process.env.ADDON_DIR || './data';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: path.join(addonDir, 'addon.db'),
  },
});
