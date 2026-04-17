import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, devices } from '../db/schema.js';
import { CryptoService } from '../services/crypto.service.js';
import { ncoreService } from '../services/ncore.service.js';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';

const auth = new Hono();

auth.get('/check-setup', async (c) => {
  const userCountResult = db.select({ count: sql<number>`count(*)` }).from(users).all();
  const userCount = userCountResult[0]?.count || 0;
  return c.json({ isConfigured: userCount > 0 });
});

const setupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  ncoreUsername: z.string().min(1),
  ncorePassword: z.string().min(1),
  deviceName: z.string().default('Default Device'),
});

auth.post('/setup', zValidator('json', setupSchema, (result, c) => {
  if (!result.success) {
    console.error('❌ Validation error in /setup:', result.error.format());
    return c.json({ 
      error: `Validation Failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
    }, 400);
  }
}), async (c) => {
  const { username, password, ncoreUsername, ncorePassword, deviceName } = c.req.valid('json');

  // Check if any user exists
  const userCountResult = db.select({ count: sql<number>`count(*)` }).from(users).all();
  const userCount = userCountResult[0]?.count || 0;

  if (userCount > 0) {
    return c.json({ error: 'Setup already completed' }, 403);
  }

  // Validate nCore credentials
  const ncoreValid = await ncoreService.login(ncoreUsername, ncorePassword);
  if (!ncoreValid) {
    return c.json({ error: 'Invalid nCore credentials' }, 401);
  }

  // Hash password and encrypt nCore credentials
  const hashedPassword = await CryptoService.hashPassword(password);
  const encryptedNcorePassword = CryptoService.encrypt(ncorePassword);

  // Create admin user
  const [newUser] = db.insert(users).values({
    username,
    encryptedPassword: hashedPassword,
    ncoreUsername,
    ncorePassword: encryptedNcorePassword,
  }).returning().all();

  // Create device and session
  const token = crypto.randomUUID();
  const tokenHash = CryptoService.hashDeviceToken(token);

  db.insert(devices).values({
    userId: newUser.id,
    name: deviceName,
    tokenHash,
  }).run();

  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return c.json({ success: true });
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  deviceName: z.string().default('Generic Device'),
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password, deviceName } = c.req.valid('json');

  const [user] = db.select().from(users).where(sql`username = ${username}`).all();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await CryptoService.verifyPassword(password, user.encryptedPassword);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Create device and session
  const token = crypto.randomUUID();
  const tokenHash = CryptoService.hashDeviceToken(token);

  db.insert(devices).values({
    userId: user.id,
    name: deviceName,
    tokenHash,
  }).run();

  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return c.json({ success: true });
});

export default auth;
