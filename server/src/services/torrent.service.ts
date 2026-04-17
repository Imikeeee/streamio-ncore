import WebTorrent from 'webtorrent';
import { env } from '../config/env.js';
import path from 'node:path';
import fs from 'node:fs';

export class TorrentService {
  private clients: Map<number, WebTorrent.Instance> = new Map();
  private idleTimeouts: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    if (!fs.existsSync(env.DOWNLOADS_DIR)) {
      fs.mkdirSync(env.DOWNLOADS_DIR, { recursive: true });
    }
    
    // Start periodic cleanup (every 1 hour)
    setInterval(() => this.cleanupDownloads(), 60 * 60 * 1000);
  }

  getClient(userId: number): WebTorrent.Instance {
    this.resetIdleTimeout(userId);
    
    let client = this.clients.get(userId);
    if (!client) {
      client = new WebTorrent({
        maxConns: 50,
      });
      this.clients.set(userId, client);
      
      client.on('error', (err: string | Error) => {
        console.error(`[Torrent] Client error for user ${userId}:`, err);
      });
    }
    return client;
  }

  async addTorrent(userId: number, torrentId: string | Buffer): Promise<WebTorrent.Torrent> {
    const client = this.getClient(userId);
    
    // Check if already added
    const existing = client.get(torrentId) as any;
    if (existing) {
      if (existing.ready) return existing as WebTorrent.Torrent;
      return new Promise((resolve) => {
        existing.once('ready', () => resolve(existing as WebTorrent.Torrent));
      });
    }

    return new Promise((resolve) => {
      client.add(torrentId, { path: env.DOWNLOADS_DIR }, (torrent: WebTorrent.Torrent) => {
        // Initially deselect all files to prevent automatic download
        torrent.files.forEach(file => file.deselect());
        resolve(torrent);
      });
    });
  }

  private resetIdleTimeout(userId: number) {
    if (this.idleTimeouts.has(userId)) {
      clearTimeout(this.idleTimeouts.get(userId)!);
    }

    const timeout = setTimeout(() => {
      this.destroyClient(userId);
    }, env.TORRENT_IDLE_TIMEOUT_MS);

    this.idleTimeouts.set(userId, timeout);
  }

  getActiveTorrentCount(): number {
    let count = 0;
    for (const client of this.clients.values()) {
      count += client.torrents.length;
    }
    return count;
  }

  private destroyClient(userId: number) {
    const client = this.clients.get(userId);
    if (client) {
      console.log(`[Torrent] Destroying idle client for user ${userId}`);
      client.destroy((err: string | Error) => {
        if (err) console.error(`[Torrent] Error destroying client for user ${userId}:`, err);
      });
      this.clients.delete(userId);
      this.idleTimeouts.delete(userId);
    }
  }

  /**
   * Finds the correct file in a torrent and SELECTS it for download.
   */
  findMainFile(torrent: WebTorrent.Torrent, season?: number, episode?: number): WebTorrent.TorrentFile | undefined {
    if (!torrent.files || torrent.files.length === 0) return undefined;

    // Filter out non-video files
    const videoFiles = torrent.files.filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      return ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.m4v'].includes(ext);
    });

    const targetFiles = videoFiles.length > 0 ? videoFiles : torrent.files;
    let match: WebTorrent.TorrentFile | undefined;

    if (season !== undefined && episode !== undefined) {
      const s = season.toString().padStart(2, '0');
      const e = episode.toString().padStart(2, '0');
      const pattern = new RegExp(`s${s}e${e}`, 'i');
      const patternShort = new RegExp(`${season}x${episode}`, 'i');

      match = targetFiles.find(file => 
        pattern.test(file.name) || patternShort.test(file.name)
      );

      if (!match) {
        match = targetFiles.find(file => {
          const numPattern = new RegExp(`[ ._-]${episode}[ ._-]`, 'i');
          return numPattern.test(file.name);
        });
      }
    }

    if (!match) {
      match = targetFiles.reduce((prev, current) => {
        return (prev.length > current.length) ? prev : current;
      });
    }

    if (match) {
      console.log(`[Torrent] Selected file for download: ${match.name}`);
      // Only download the matched file
      torrent.files.forEach(f => f.deselect());
      match.select();
    }

    return match;
  }

  /**
   * Handles a range request for a torrent file.
   */
  async streamFile(file: WebTorrent.TorrentFile, range?: string): Promise<{
    stream: NodeJS.ReadableStream;
    status: number;
    headers: Record<string, string>;
  }> {
    const fileSize = file.length;
    
    // Explicitly select this file again to ensure it's downloading
    file.select();

    if (!range) {
      return {
        stream: file.createReadStream() as any,
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': this.getContentType(file.name),
          'Accept-Ranges': 'bytes',
        },
      };
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;

    return {
      stream: file.createReadStream({ start, end }) as any,
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': this.getContentType(file.name),
      },
    };
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.mp4': return 'video/mp4';
      case '.mkv': return 'video/x-matroska';
      case '.avi': return 'video/x-msvideo';
      default: return 'video/mp4';
    }
  }

  /**
   * Cleanup downloads folder of old files.
   */
  private cleanupDownloads() {
    console.log('[Torrent] Running cleanup of downloads folder...');
    try {
      if (!fs.existsSync(env.DOWNLOADS_DIR)) return;
      
      const files = fs.readdirSync(env.DOWNLOADS_DIR);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      files.forEach(file => {
        const filePath = path.join(env.DOWNLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          console.log(`[Torrent] Deleting old file/folder: ${file}`);
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      });
    } catch (err) {
      console.error('[Torrent] Cleanup error:', err);
    }
  }
}

export const torrentService = new TorrentService();
