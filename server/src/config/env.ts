import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  ENCRYPTION_KEY: z.string().length(64).describe('64-character hex key'),
  SESSION_SECRET: z.string().min(32),
  ADDON_DIR: z.string().default('./data'),
  DOWNLOADS_DIR: z.string().default('./downloads'),
  TORRENT_IDLE_TIMEOUT_MS: z.coerce.number().default(600000),
  NCORE_URL: z.string().url().default('https://ncore.pro'),
  APP_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
