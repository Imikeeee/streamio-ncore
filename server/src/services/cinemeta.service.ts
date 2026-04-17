import { env } from '../config/env.js';

export interface CinemetaResponse {
  meta: {
    id: string;
    type: string;
    name: string;
    // other fields omitted
  };
}

export class CinemetaService {
  private CINEMETA_URL = 'https://v3-cinemeta.strem.io';

  public async getMetadataByImdbId(
    type: string,
    imdbId: string,
  ): Promise<CinemetaResponse> {
    const cinemetaUrl = `${this.CINEMETA_URL}/meta/${type}/${imdbId}.json`;
    const response = await fetch(cinemetaUrl);
    if (!response.ok) {
      console.error(
        `Failed to fetch metadata from Cinemeta at URL: ${cinemetaUrl}`,
        response.statusText
      );
      throw new Error('Failed to fetch stream data from Cinemeta');
    }
    return response.json() as Promise<CinemetaResponse>;
  }
}

export const cinemetaService = new CinemetaService();
