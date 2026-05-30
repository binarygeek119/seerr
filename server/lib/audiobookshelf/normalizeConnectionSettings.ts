import type { AudiobookshelfSettings } from '@server/lib/settings';
import axios from 'axios';

export type AudiobookshelfConnectionSettings = Pick<
  AudiobookshelfSettings,
  'hostname' | 'port' | 'useSsl' | 'urlBase' | 'apiKey'
>;

export const normalizeAudiobookshelfConnection = (
  settings: Partial<AudiobookshelfConnectionSettings>
): AudiobookshelfConnectionSettings => {
  let hostname = settings.hostname?.trim() ?? '';
  let port = Number(settings.port) || 13378;
  let useSsl = settings.useSsl ?? false;
  let urlBase = settings.urlBase?.trim() ?? '';

  const protocolMatch = hostname.match(/^(https?):\/\//i);
  if (protocolMatch) {
    useSsl = protocolMatch[1].toLowerCase() === 'https';
    hostname = hostname.replace(/^(https?):\/\//i, '');
  }

  const pathInHostname = hostname.match(/^([^/]+)(\/.*)$/);
  if (pathInHostname) {
    hostname = pathInHostname[1];
    if (!urlBase) {
      urlBase = pathInHostname[2].replace(/\/$/, '');
    }
  }

  const hostPortMatch = hostname.match(/^([^:]+):(\d+)$/);
  if (hostPortMatch) {
    hostname = hostPortMatch[1];
    port = Number(hostPortMatch[2]);
  }

  if (urlBase && !urlBase.startsWith('/')) {
    urlBase = `/${urlBase}`;
  }

  if (urlBase.endsWith('/')) {
    urlBase = urlBase.replace(/\/+$/, '');
  }

  return {
    hostname,
    port,
    useSsl,
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

    if (error.response?.status === 404) {
      return 'Failed to connect to Audiobookshelf. The server returned not found. Check hostname, port, URL base, and Use SSL. Leave URL base blank unless Audiobookshelf is served from a subpath.';
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
