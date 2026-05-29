import type { AudiobookshelfSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import axios, { type AxiosInstance } from 'axios';

export interface AudiobookshelfLibrary {
  id: string;
  name: string;
  mediaType: string;
  icon?: string;
}

export interface AudiobookshelfLibraryItem {
  id: string;
  libraryId: string;
  mediaType: string;
  addedAt?: number;
  media?: {
    metadata?: {
      title?: string;
      authorName?: string;
      isbn?: string | null;
      asin?: string | null;
    };
  };
}

export interface AudiobookshelfLibraryItemsResponse {
  results: AudiobookshelfLibraryItem[];
  total: number;
}

type AudiobookshelfConnection = Pick<
  AudiobookshelfSettings,
  'hostname' | 'port' | 'useSsl' | 'urlBase' | 'apiKey'
>;

class AudiobookshelfAPI {
  private axios: AxiosInstance;

  public static buildUrl(
    settings: Pick<AudiobookshelfSettings, 'hostname' | 'port' | 'useSsl' | 'urlBase'>,
    path = ''
  ): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    const base = settings.urlBase ?? '';
    return `${protocol}://${settings.hostname}:${settings.port}${base}${path}`;
  }

  constructor(settings: AudiobookshelfConnection) {
    const configuredTimeout = getSettings().network.apiRequestTimeout;
    this.axios = axios.create({
      baseURL: AudiobookshelfAPI.buildUrl(settings),
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
      },
      timeout: configuredTimeout > 0 ? configuredTimeout : 30000,
    });
  }

  public async getLibraries(): Promise<AudiobookshelfLibrary[]> {
    const { data } = await this.axios.get<
      AudiobookshelfLibrary[] | { libraries: AudiobookshelfLibrary[] }
    >('/api/libraries');

    if (Array.isArray(data)) {
      return data;
    }

    return data.libraries ?? [];
  }

  public async getLibraryItems(
    libraryId: string,
    page = 0,
    limit = 100
  ): Promise<AudiobookshelfLibraryItemsResponse> {
    const { data } = await this.axios.get<AudiobookshelfLibraryItemsResponse>(
      `/api/libraries/${libraryId}/items`,
      {
        params: {
          limit,
          page,
          minified: 0,
        },
      }
    );

    return data;
  }

  public async testConnection(): Promise<void> {
    await this.getLibraries();
  }

  public async getItem(itemId: string): Promise<AudiobookshelfLibraryItem | null> {
    try {
      const { data } = await this.axios.get<AudiobookshelfLibraryItem>(
        `/api/items/${itemId}`
      );
      return data;
    } catch {
      return null;
    }
  }
}

export default AudiobookshelfAPI;
