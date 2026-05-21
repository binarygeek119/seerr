import OpenLibrary from '@server/api/openlibrary';
import type ReadarrAPI from '@server/api/servarr/readarr';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import logger from '@server/logger';

export const isOpenLibraryWorkId = (id: string): boolean =>
  /^OL\d+W$/i.test(id.trim());

const buildLookupTerms = (mediaId: string): string[] => {
  const trimmed = mediaId.trim();
  const terms = [trimmed];

  if (isOpenLibraryWorkId(trimmed)) {
    terms.push(
      `openlibrary:/works/${trimmed}`,
      `https://openlibrary.org/works/${trimmed}`,
      `/works/${trimmed}`
    );
  }

  return [...new Set(terms)];
};

const pickBookMatch = (
  books: ReadarrBook[],
  mediaId: string
): ReadarrBook | undefined => {
  if (!books.length) {
    return undefined;
  }

  return (
    books.find((b) => b.foreignBookId === mediaId) ??
    books.find((b) =>
      isOpenLibraryWorkId(mediaId)
        ? b.foreignBookId?.toUpperCase() === mediaId.toUpperCase()
        : false
    ) ??
    books[0]
  );
};

const isReadarrUnreachableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  return (
    lower.includes('timeout') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('enotfound')
  );
};

export const formatReadarrLookupError = (
  error: unknown,
  serverName?: string
): string => {
  const message = error instanceof Error ? error.message : String(error);
  const label = serverName ?? 'Readarr';

  if (isReadarrUnreachableError(error)) {
    return `${label} is unreachable or too slow to respond. Book requests require your book server (Chaptarr/Readarr) to be online.`;
  }

  return message;
};

/**
 * Resolve a book in Readarr/Chaptarr by foreign id, Open Library work id, or title search.
 */
export const lookupBookInReadarr = async (
  readarr: ReadarrAPI,
  mediaId: string
): Promise<ReadarrBook | null> => {
  const trimmed = mediaId.trim();
  let lastError: unknown;

  for (const term of buildLookupTerms(trimmed)) {
    try {
      const books = await readarr.lookupBooks(term);
      const match = pickBookMatch(books, trimmed);
      if (match?.foreignBookId) {
        return match;
      }
    } catch (error) {
      lastError = error;
      logger.debug('Readarr book lookup term failed', {
        label: 'Readarr',
        term,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      if (isReadarrUnreachableError(error)) {
        break;
      }
    }
  }

  if (isOpenLibraryWorkId(trimmed) && !isReadarrUnreachableError(lastError)) {
    try {
      const openLibrary = new OpenLibrary();
      const work = await openLibrary.getWork(trimmed);
      const searchTerm = work.authorName
        ? `${work.title} ${work.authorName}`
        : work.title;

      const books = await readarr.lookupBooks(searchTerm);
      const titleLower = work.title.toLowerCase();
      const match =
        books.find((b) => b.title.toLowerCase() === titleLower) ??
        books.find((b) => b.title.toLowerCase().includes(titleLower)) ??
        books[0];

      if (match?.foreignBookId) {
        return match;
      }
    } catch (error) {
      lastError = error;
      logger.debug('Open Library assisted Readarr lookup failed', {
        label: 'Readarr',
        foreignBookId: trimmed,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};
