import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import path from 'node:path';
import fs from 'node:fs';
import status from './routes/status.js';
import auth from './routes/auth.js';
import devices from './routes/devices.js';
import users from './routes/users.js';
import stremio from './routes/stremio.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/stremio', stremio);
app.route('/api/status', status);
app.route('/api/auth', auth);
app.route('/api/devices', devices);
app.route('/api/users', users);

// Global Error Handler
app.onError((err, c) => {
  console.error('❌ Server error:', err);
  return c.json({ error: err.message || 'An internal server error occurred' }, 500);
});

// Serve frontend in production
if (env.NODE_ENV === 'production') {
  const distPath = path.resolve('../frontend/dist');
  
  // Static files
  app.use('/*', serveStatic({ root: '../frontend/dist' }));
  
  // Fallback for SPA (React router) - must be last
  app.get('*', async (c) => {
    // If it looks like an API call but wasn't caught, return 404
    if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/stremio/')) {
      return c.json({ error: 'Not Found' }, 404);
    }
    
    try {
      const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      return c.html(html);
    } catch (e) {
      return c.text('Frontend not found', 404);
    }
  });
} else {
  app.get('/', (c) => {
    return c.text('nCore Stremio Addon V3 API');
  });
}

console.log(`🚀 Server is running on port ${env.PORT}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});
