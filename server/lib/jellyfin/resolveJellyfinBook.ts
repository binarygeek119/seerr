import type { JellyfinLibraryItemExtended } from '@server/api/jellyfin';
import ReadarrAPI from '@server/api/servarr/readarr';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import { extractForeignBookIdFromJellyfin } from '@server/lib/jellyfin/extractForeignBookId';
import { lookupBookInReadarr } from '@server/lib/readarr/lookupBook';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import { getSettings } from '@server/lib/settings';

export type ResolvedJellyfinBook = {
  foreignBookId: string;
  title: string;
  serviceId?: number;
  externalServiceId?: number;
  externalServiceSlug?: string;
};

/**
 * Resolve a Jellyfin book item to a Readarr foreignBookId, optionally enriching
 * with the matching Readarr instance when sync is enabled.
 */
export const resolveJellyfinBook = async (
  metadata: JellyfinLibraryItemExtended,
  isAudiobook: boolean
): Promise<ResolvedJellyfinBook | null> => {
  let foreignBookId = extractForeignBookIdFromJellyfin(metadata.ProviderIds);

  const readarrServer = getReadarrServer(
    getSettings().readarr,
    isAudiobook
  );

  let matchedBook: ReadarrBook | null = null;

  if (readarrServer) {
    const readarr = new ReadarrAPI({
      apiKey: readarrServer.apiKey,
      url: ReadarrAPI.buildUrl(readarrServer, '/api/v1'),
    });

    if (foreignBookId) {
      try {
        matchedBook = await lookupBookInReadarr(readarr, foreignBookId);
      } catch {
        matchedBook = null;
      }
    }

    if (!matchedBook?.foreignBookId && metadata.Name) {
      const searchTerm = metadata.Name;
      try {
        matchedBook = await lookupBookInReadarr(readarr, searchTerm);
      } catch {
        matchedBook = null;
      }
    }

    if (matchedBook?.foreignBookId) {
      foreignBookId = matchedBook.foreignBookId;
    }
  }

  if (!foreignBookId) {
    return null;
  }

  return {
    foreignBookId,
    title: metadata.Name ?? 'Unknown Title',
    serviceId: readarrServer?.id,
    externalServiceId: matchedBook?.id,
    externalServiceSlug: matchedBook?.titleSlug,
  };
};
