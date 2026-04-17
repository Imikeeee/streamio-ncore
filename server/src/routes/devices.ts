import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { devices, users } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { CryptoService } from '../services/crypto.service.js';
import { env } from '../config/env.js';
import crypto from 'node:crypto';

type Variables = {
  user: typeof users.$inferSelect;
  sessionToken: string;
};

const devicesRoute = new Hono<{ Variables: Variables }>();

// Middleware to protect device routes
devicesRoute.use('*', async (c, next) => {
  const sessionToken = getCookie(c, 'session');
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const tokenHash = CryptoService.hashDeviceToken(sessionToken);
  const result = await db.select({
    user: users,
  })
  .from(devices)
  .innerJoin(users, eq(devices.userId, users.id))
  .where(eq(devices.tokenHash, tokenHash))
  .limit(1);

  if (result.length === 0) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', result[0].user);
  c.set('sessionToken', sessionToken);
  await next();
});

// GET /devices
devicesRoute.get('/', async (c) => {
  const user = c.get('user');
  // Only return devices that have a stored token (these are the Stremio instances)
  const userDevices = db.select().from(devices)
    .where(and(
      eq(devices.userId, user.id),
      sql`${devices.token} IS NOT NULL`
    ))
    .all();
  
  // Add manifestUrl to devices
  const devicesWithUrls = userDevices.map(d => ({
    ...d,
    manifestUrl: `${env.APP_URL}/stremio/${d.token}/manifest.json`
  }));
  
  return c.json(devicesWithUrls);
});

const createDeviceSchema = z.object({
  name: z.string().min(1)
});

// POST /devices
devicesRoute.post('/', zValidator('json', createDeviceSchema), async (c) => {
  const user = c.get('user');
  const { name } = c.req.valid('json');

  const token = crypto.randomUUID();
  const tokenHash = CryptoService.hashDeviceToken(token);

  const [newDevice] = db.insert(devices).values({
    userId: user.id,
    name,
    token, // Store the plain token for display
    tokenHash,
  }).returning().all();

  return c.json({
    ...newDevice,
    manifestUrl: `${env.APP_URL}/stremio/${token}/manifest.json`
  });
});

// DELETE /devices/:id
devicesRoute.delete('/:id', async (c) => {
  const user = c.get('user');
  const sessionToken = c.get('sessionToken');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400);
  }

  // Find the device to be deleted
  const [deviceToDelete] = db.select().from(devices).where(eq(devices.id, id)).all();
  
  if (!deviceToDelete) {
    return c.json({ error: 'Device not found' }, 404);
  }

  // Security check: only allow deleting own devices
  if (deviceToDelete.userId !== user.id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Prevent deleting the device that is currently being used for the management session
  const currentSessionHash = CryptoService.hashDeviceToken(sessionToken);
  if (deviceToDelete.tokenHash === currentSessionHash) {
    return c.json({ error: 'Cannot delete the device you are currently using' }, 400);
  }

  const result = db.delete(devices)
    .where(eq(devices.id, id))
    .run();

  if (result.changes === 0) {
    return c.json({ error: 'Failed to delete device' }, 500);
  }

  return c.json({ success: true });
});

export default devicesRoute;
