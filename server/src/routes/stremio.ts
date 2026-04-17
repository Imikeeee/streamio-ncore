import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { devices, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { CryptoService } from '../services/crypto.service.js';
import { ncoreService } from '../services/ncore.service.js';
import { torrentService } from '../services/torrent.service.js';
import { cinemetaService } from '../services/cinemeta.service.js';
import { env } from '../config/env.js';

const stremio = new Hono();

// Helper to verify device and get user
async function getDeviceUser(deviceToken: string) {
  const tokenHash = CryptoService.hashDeviceToken(deviceToken);
  const result = await db.select({
    user: users,
    device: devices
  })
  .from(devices)
  .innerJoin(users, eq(devices.userId, users.id))
  .where(eq(devices.tokenHash, tokenHash))
  .limit(1);

  return result[0];
}

const manifestSchema = z.object({
  deviceToken: z.string().min(1)
});

stremio.get('/:deviceToken/manifest.json', zValidator('param', manifestSchema), async (c) => {
  const { deviceToken } = c.req.valid('param');
  const deviceUser = await getDeviceUser(deviceToken);

  if (!deviceUser) {
    return c.json({ error: 'Unauthorized device' }, 401);
  }

  const manifest = {
    id: 'org.ncore.streamio.v3',
    version: '1.0.0',
    name: 'nCore Streamio V3',
    description: `nCore.pro streams for Stremio. Logged in as: ${deviceUser.user.username}`,
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: []
  };

  return c.json(manifest);
});

const streamSchema = z.object({
  type: z.string(),
  id: z.string().transform(s => s.replace('.json', ''))
});

stremio.get('/:deviceToken/stream/:type/:id', 
  zValidator('param', streamSchema.extend({ deviceToken: z.string() })),
  async (c) => {
    const { deviceToken, type, id } = c.req.valid('param');

    const deviceUser = await getDeviceUser(deviceToken);
    if (!deviceUser) {
      console.log(`[Stremio] Unauthorized stream request with token: ${deviceToken}`);
      return c.json({ error: 'Unauthorized device' }, 401);
    }

    // id can be "tt1234567" for movies or "tt1234567:1:1" for series
    const idParts = id.split(':');
    const imdbId = idParts[0];
    const season = idParts[1] ? parseInt(idParts[1]) : undefined;
    const episode = idParts[2] ? parseInt(idParts[2]) : undefined;

    console.log(`[Stremio] Stream request for ${type} ${imdbId} (S${season}E${episode})`);

    // Pass the type and user to ncoreService to filter categories and use session
    let results = await ncoreService.searchWithUser(deviceUser.user, imdbId, type as 'movie' | 'series');
    console.log(`[Stremio] nCore IMDB search returned ${results.length} results for ${imdbId}`);
    
    if (results.length === 0) {
      console.log(`[Stremio] No results for IMDB ID ${imdbId}, trying title search...`);
      try {
        const metadata = await cinemetaService.getMetadataByImdbId(type, imdbId);
        const title = metadata.meta.name;
        if (title) {
          console.log(`[Stremio] Searching by title: "${title}"`);
          results = await ncoreService.searchWithUser(deviceUser.user, title, type as 'movie' | 'series');
          console.log(`[Stremio] nCore title search returned ${results.length} results for "${title}"`);
        }
      } catch (err) {
        console.error('[Stremio] Cinemeta metadata fetch failed:', err);
      }
    }

    const streams = results.map(torrent => {
      // Create a signed token for the play URL
      const playData = JSON.stringify({
        userId: deviceUser.user.id,
        torrentId: torrent.id,
        downloadUrl: torrent.downloadUrl,
        season,
        episode,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
      
      const signature = CryptoService.sign(playData);
      const signedToken = `${Buffer.from(playData).toString('base64')}.${signature}`;
      
      return {
        name: 'nCore',
        title: `${torrent.title}\n👤 ${torrent.seeders} 💾 ${Math.round(torrent.size / 1024 / 1024 / 1024 * 100) / 100} GB`,
        url: `${env.APP_URL}/stremio/play/${signedToken}`,
        behaviorHints: {
          notWebReady: true,
        }
      };
    });

    return c.json({ streams });
  }
);

stremio.get('/play/:signedToken', async (c) => {
  const { signedToken } = c.req.param();
  const [dataB64, signature] = signedToken.split('.');
  
  if (!dataB64 || !signature) {
    return c.text('Invalid token', 400);
  }

  const dataStr = Buffer.from(dataB64, 'base64').toString('utf8');
  if (!CryptoService.verify(dataStr, signature)) {
    return c.text('Invalid signature', 401);
  }

  const data = JSON.parse(dataStr);
  if (data.expires < Date.now()) {
    return c.text('Token expired', 401);
  }

  const { userId, downloadUrl, season, episode } = data;
  
  try {
    // Get user from DB
    const [user] = db.select().from(users).where(eq(users.id, userId)).all();
    if (!user) {
      return c.text('User not found', 404);
    }

    const torrentBuffer = await ncoreService.downloadTorrent(user, downloadUrl);
    const torrent = await torrentService.addTorrent(userId, torrentBuffer);
    
    const mainFile = torrentService.findMainFile(torrent, season, episode);
    if (!mainFile) {
      return c.text('No playable file found', 404);
    }

    const range = c.req.header('range');
    const { stream, status, headers } = await torrentService.streamFile(mainFile, range);
    
    return c.body(stream as any, status as any, {
      ...headers,
      'Content-Disposition': `inline; filename="${mainFile.name}"`,
    });
  } catch (error) {
    console.error('[Stremio] Play error:', error);
    return c.text('Failed to stream torrent', 500);
  }
});

export default stremio;
