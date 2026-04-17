import { Hono } from 'hono';
import { torrentService } from '../services/torrent.service.js';
import { env } from '../config/env.js';

const status = new Hono();

status.get('/', (c) => {
  return c.json({
    ncoreConnected: true, // Simplified for now
    activeTorrents: torrentService.getActiveTorrentCount(),
    uptime: process.uptime(),
    version: '1.0.0',
    nodeVersion: process.version,
  });
});

export default status;
