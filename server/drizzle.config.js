import { defineConfig } from 'drizzle-kit';
import { env } from './src/config/env.js';
import path from 'path';
export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: path.join(env.ADDON_DIR, 'addon.db'),
    },
});
//# sourceMappingURL=drizzle.config.js.map