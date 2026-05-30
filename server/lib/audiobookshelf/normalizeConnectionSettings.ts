import type { AudiobookshelfSettings } from '@server/lib/settings';
import axios from 'axios';

export type AudiobookshelfConnectionSettings = Pick<
  AudiobookshelfSettings,
  'hostname' | 'port' | 'useSsl' | 'urlBase' | 'apiKey'
>;

export const normalizeAudiobookshelfConnection = (
  settings: Partial<AudiobookshelfConnectionSettings>
): AudiobookshelfConnectionSettings => {
  let urlBase = settings.urlBase?.trim() ?? '';

  if (urlBase && !urlBase.startsWith('/')) {
    urlBase = `/${urlBase}`;
  }

  if (urlBase.endsWith('/')) {
    urlBase = urlBase.replace(/\/+$/, '');
  }

  return {
    hostname: settings.hostname?.trim() ?? '',
    port: Number(settings.port) || 13378,
    useSsl: settings.useSsl ?? false,
    urlBase,
    apiKey: settings.apiKey ?? '',
  };
};

export const getAudiobookshelfConnectionErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'Failed to connect to Audiobookshelf. Check your API key.';
    }

    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ETIMEDOUT'
    ) {
      return 'Failed to connect to Audiobookshelf. Check the hostname and port.';
    }

    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      return 'Failed to connect to Audiobookshelf. SSL certificate verification failed.';
    }

    if (error.response?.status) {
      return `Failed to connect to Audiobookshelf (HTTP ${error.response.status}).`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to connect to Audiobookshelf.';
};
