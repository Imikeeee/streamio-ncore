import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { users, devices } from '../db/schema.js';
import { eq, ne } from 'drizzle-orm';
import { CryptoService } from '../services/crypto.service.js';

type Variables = {
  user: typeof users.$inferSelect;
};

const usersRoute = new Hono<{ Variables: Variables }>();

// Middleware to protect user routes (Admin only)
usersRoute.use('*', async (c, next) => {
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
  await next();
});

// GET /users
usersRoute.get('/', async (c) => {
  const allUsers = db.select({
    id: users.id,
    username: users.username,
    ncoreUsername: users.ncoreUsername,
    createdAt: users.createdAt
  }).from(users).all();
  
  return c.json(allUsers);
});

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  ncoreUsername: z.string().min(1),
  ncorePassword: z.string().min(1)
});

// POST /users
usersRoute.post('/', zValidator('json', createUserSchema), async (c) => {
  const { username, password, ncoreUsername, ncorePassword } = c.req.valid('json');

  const hashedPassword = await CryptoService.hashPassword(password);
  const encryptedNcorePassword = CryptoService.encrypt(ncorePassword);

  try {
    const [newUser] = db.insert(users).values({
      username,
      encryptedPassword: hashedPassword,
      ncoreUsername,
      ncorePassword: encryptedNcorePassword,
    }).returning().all();

    return c.json({
      id: newUser.id,
      username: newUser.username,
      ncoreUsername: newUser.ncoreUsername,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    return c.json({ error: 'User already exists or database error' }, 400);
  }
});

// DELETE /users/:id
usersRoute.delete('/:id', async (c) => {
  const currentUser = c.get('user');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400);
  }

  if (id === currentUser.id) {
    return c.json({ error: 'Cannot delete yourself' }, 400);
  }

  // Also delete associated devices/sessions
  db.delete(devices).where(eq(devices.userId, id)).run();
  
  const result = db.delete(users)
    .where(eq(users.id, id))
    .run();

  if (result.changes === 0) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ success: true });
});

export default usersRoute;
