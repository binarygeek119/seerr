import ReadarrAPI from '@server/api/servarr/readarr';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import { extractForeignBookIdFromPlex } from '@server/lib/plex/extractForeignBookId';
import { lookupBookInReadarr } from '@server/lib/readarr/lookupBook';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import { getSettings } from '@server/lib/settings';

export type ResolvedPlexAudiobook = {
  foreignBookId: string;
  title: string;
  serviceId?: number;
  externalServiceId?: number;
  externalServiceSlug?: string;
};

/**
 * Resolve a Plex audiobook album to a Readarr foreignBookId.
 */
export const resolvePlexAudiobook = async ({
  title,
  artist,
  guids,
}: {
  title: string;
  artist?: string;
  guids?: { id: string }[];
}): Promise<ResolvedPlexAudiobook | null> => {
  let foreignBookId = extractForeignBookIdFromPlex(guids);

  const readarrServer = getReadarrServer(getSettings().readarr, true);

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

    const searchTerms = [
      artist ? `${title} ${artist}` : title,
      title,
    ].filter((term, index, arr) => term.trim() && arr.indexOf(term) === index);

    for (const searchTerm of searchTerms) {
      if (matchedBook?.foreignBookId) {
        break;
      }

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
    title: matchedBook?.title ?? title,
    serviceId: readarrServer?.id,
    externalServiceId: matchedBook?.id,
    externalServiceSlug: matchedBook?.titleSlug,
  };
};
