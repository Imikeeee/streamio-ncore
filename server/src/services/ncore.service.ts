import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import cookieParser from 'set-cookie-parser';
import { env } from '../config/env.js';
import { CryptoService } from './crypto.service.js';

export interface NCoreSearchResult {
  id: string;
  title: string;
  size: number;
  seeders: number;
  leechers: number;
  category: string;
  downloadUrl: string;
  imdbId?: string;
}

export class NCoreService {
  private client: AxiosInstance;
  private jar: CookieJar;
  
  // Cache cookies per user ID to avoid logging in on every request
  private userCookies: Map<number, { cookie: string, expires: number }> = new Map();

  constructor() {
    this.jar = new CookieJar();
    this.client = wrapper(axios.create({
      baseURL: env.NCORE_URL,
      jar: this.jar,
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }));
  }

  /**
   * Gets cookies for a specific user, logging in if necessary.
   */
  async getUserCookies(user: any): Promise<string> {
    const cached = this.userCookies.get(user.id);
    if (cached && cached.expires > Date.now()) {
      return cached.cookie;
    }

    const ncorePassword = CryptoService.decrypt(user.ncorePassword);
    
    console.log(`[nCore] Session expired or missing for ${user.ncoreUsername}. Logging in...`);
    
    const form = new FormData();
    form.append('set_lang', 'hu');
    form.append('submitted', '1');
    form.append('nev', user.ncoreUsername);
    form.append('pass', ncorePassword);
    form.append('ne_leptessen_ki', '1');

    const resp = await fetch(`${env.NCORE_URL}/login.php`, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    });

    const allCookies = cookieParser.parse(resp.headers.getSetCookie());
    const passCookie = allCookies.find(({ name }) => name === 'pass');

    if (!passCookie || passCookie.value === 'deleted') {
      throw new Error(`Failed to log in to nCore for user ${user.ncoreUsername}`);
    }

    const cookieStr = allCookies
      .map(({ name, value }) => `${name}=${value}`)
      .join('; ');

    const expires = passCookie.expires ? passCookie.expires.getTime() : Date.now() + (24 * 60 * 60 * 1000);
    
    this.userCookies.set(user.id, { cookie: cookieStr, expires });
    return cookieStr;
  }

  /**
   * Searches for torrents on nCore using a specific user's session.
   */
  async searchWithUser(user: any, query: string, type: 'movie' | 'series' = 'movie'): Promise<NCoreSearchResult[]> {
    try {
      const isImdb = query.startsWith('tt');
      const cookies = await this.getUserCookies(user);
      
      const MOVIE_CATEGORIES = 'xvid_hun,xvid,dvd_hun,dvd,dvd9_hun,dvd9,hd_hun,hd';
      const SERIES_CATEGORIES = 'xvidser_hun,xvidser,dvdser_hun,dvdser,hdser_hun,hdser';

      const params = new URLSearchParams({
        mire: query,
        miben: isImdb ? 'imdb' : 'targy',
        miszerint: 'seeders',
        hogyan: 'DESC',
        tipus: 'kivalasztottak_kozott',
        kivalasztott_tipus: type === 'movie' ? MOVIE_CATEGORIES : SERIES_CATEGORIES,
        jsons: 'true'
      });

      console.log(`[nCore] Searching for ${query} (type: ${type}) for user ${user.ncoreUsername}...`);
      
      const response = await axios.get(`${env.NCORE_URL}/torrents.php?${params.toString()}`, {
        headers: {
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      
      if (response.headers['content-type']?.includes('application/json')) {
        const data = response.data;
        if (!data.results || data.results.length === 0) {
          return [];
        }

        return data.results.map((torrent: any) => ({
          id: torrent.torrent_id,
          title: torrent.release_name,
          size: parseInt(torrent.size),
          seeders: parseInt(torrent.seeders),
          leechers: parseInt(torrent.leechers),
          category: torrent.category,
          downloadUrl: torrent.download_url,
          imdbId: isImdb ? query : torrent.imdb_id,
        }));
      }

      console.log(`[nCore] JSON API not available (Content-Type: ${response.headers['content-type']}).`);
      return [];
    } catch (error) {
      console.error('[nCore] Search error:', error);
      return [];
    }
  }

  /**
   * Validates credentials by attempting to login to nCore.
   * Returns true if login is successful.
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log(`[nCore] Validating credentials for ${username}...`);
      
      const form = new FormData();
      form.append('set_lang', 'hu');
      form.append('submitted', '1');
      form.append('nev', username);
      form.append('pass', password);
      form.append('ne_leptessen_ki', '1');

      const resp = await fetch(`${env.NCORE_URL}/login.php`, {
        method: 'POST',
        body: form,
        redirect: 'manual',
      });

      const allCookies = cookieParser.parse(resp.headers.getSetCookie());
      const passCookie = allCookies.find(({ name }) => name === 'pass');

      return !!(passCookie && passCookie.value !== 'deleted');
    } catch (error) {
      console.error('[nCore] Validation error:', error);
      return false;
    }
  }

  /**
   * Downloads a .torrent file from nCore.
   */
  async downloadTorrent(user: any, downloadUrl: string): Promise<Buffer> {
    try {
      const cookies = await this.getUserCookies(user);
      const response = await axios.get(downloadUrl, {
        headers: { 'Cookie': cookies },
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('[nCore] Download error:', error);
      throw new Error('Failed to download torrent file');
    }
  }

  private parseSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B)$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return value * (units[unit] || 1);
  }
}

export const ncoreService = new NCoreService();
