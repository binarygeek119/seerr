import type { AudiobookshelfLibraryItem } from '@server/api/audiobookshelf';
import ReadarrAPI from '@server/api/servarr/readarr';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import {
  buildAudiobookshelfSearchTerms,
  extractForeignBookIdFromAudiobookshelf,
} from '@server/lib/audiobookshelf/extractForeignBookId';
import { lookupBookInReadarr } from '@server/lib/readarr/lookupBook';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import { getSettings } from '@server/lib/settings';

export type ResolvedAudiobookshelfBook = {
  foreignBookId: string;
  title: string;
  serviceId?: number;
  externalServiceId?: number;
  externalServiceSlug?: string;
};

export const resolveAudiobookshelfBook = async (
  item: AudiobookshelfLibraryItem
): Promise<ResolvedAudiobookshelfBook | null> => {
  const metadata = item.media?.metadata;
  let foreignBookId = extractForeignBookIdFromAudiobookshelf(metadata);
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

    for (const searchTerm of buildAudiobookshelfSearchTerms(
      metadata,
      metadata?.title
    )) {
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
    title: matchedBook?.title ?? metadata?.title ?? 'Unknown Title',
    serviceId: readarrServer?.id,
    externalServiceId: matchedBook?.id,
    externalServiceSlug: matchedBook?.titleSlug,
  };
};
