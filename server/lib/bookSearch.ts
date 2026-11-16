import OpenLibrary from '@server/api/openlibrary';
import ReadarrAPI from '@server/api/servarr/readarr';
import {
  dedupeBookSearchResults,
  mapOpenLibraryDocToSearchResult,
  mapReadarrBookToSearchResult,
} from '@server/lib/bookResults';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import type { ReadarrBookSearchResult } from '@server/models/Search';

const scoreBookMatch = (
  queryLower: string,
  title: string,
  author?: string
): number => {
  const titleLower = title.toLowerCase();
  const authorLower = (author ?? '').toLowerCase();

  if (titleLower === queryLower || authorLower === queryLower) {
    return 100;
  }
  if (titleLower.startsWith(queryLower) || authorLower.startsWith(queryLower)) {
    return 80;
  }
  if (titleLower.includes(queryLower) || authorLower.includes(queryLower)) {
    return 60;
  }

  return 30;
};

const mapReadarrBooks = (
  books: Awaited<ReturnType<ReadarrAPI['lookupBooks']>>,
  query: string
): ReadarrBookSearchResult[] => {
  const queryLower = query.trim().toLowerCase();

  return dedupeBookSearchResults(
    books
      .map((b) =>
        mapReadarrBookToSearchResult(
          b,
          scoreBookMatch(queryLower, b.title, b.author?.authorName)
        )
      )
      .filter((book): book is ReadarrBookSearchResult => book !== null)
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
};

const mapOpenLibraryBooks = (
  docs: Awaited<ReturnType<OpenLibrary['searchBooks']>>['docs'],
  query: string
): ReadarrBookSearchResult[] => {
  const queryLower = query.trim().toLowerCase();

  return dedupeBookSearchResults(
    docs
      .map((doc) =>
        mapOpenLibraryDocToSearchResult(
          doc,
          scoreBookMatch(queryLower, doc.title, doc.author_name?.[0])
        )
      )
      .filter((book): book is ReadarrBookSearchResult => book !== null)
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
};

export const searchBooks = async (
  query: string
): Promise<ReadarrBookSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const settings = getSettings();
  const readarrServer = getReadarrServer(settings.readarr, false);

  if (readarrServer) {
    try {
      const readarr = new ReadarrAPI({
        apiKey: readarrServer.apiKey,
        url: ReadarrAPI.buildUrl(readarrServer, '/api/v1'),
      });
      const books = await readarr.lookupBooks(trimmed);
      return mapReadarrBooks(books, trimmed);
    } catch (err) {
      logger.warn('Readarr book search failed, falling back to Open Library', {
        label: 'API',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    const openLibrary = new OpenLibrary();
    const { docs } = await openLibrary.searchBooks({
      query: trimmed,
      limit: 20,
    });
    return mapOpenLibraryBooks(docs, trimmed);
  } catch (err) {
    logger.debug('Open Library book search failed', {
      label: 'API',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
};
