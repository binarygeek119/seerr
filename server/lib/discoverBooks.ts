import OpenLibrary from '@server/api/openlibrary';
import ReadarrAPI from '@server/api/servarr/readarr';
import { MediaType } from '@server/constants/media';
import Media from '@server/entity/Media';
import type { User } from '@server/entity/User';
import {
  dedupeBookSearchResults,
  mapOpenLibraryDocToSearchResult,
  mapReadarrBookToSearchResult,
} from '@server/lib/bookResults';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import {
  mapSearchResults,
  type ReadarrBookSearchResult,
} from '@server/models/Search';

export interface DiscoverBooksPage {
  page: number;
  totalPages: number;
  totalResults: number;
  source: 'library' | 'popular';
  results: Awaited<ReturnType<typeof mapSearchResults>>;
}

const buildDiscoverPage = async (
  user: User | undefined,
  page: number,
  pageSize: number,
  bookSearchRaw: ReadarrBookSearchResult[],
  totalResults: number,
  source: DiscoverBooksPage['source']
): Promise<DiscoverBooksPage> => {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const bookRefs = bookSearchRaw.map((b) => ({
    foreignBookId: b.foreignBookId,
    mediaType: MediaType.BOOK,
  }));

  const bookMedia =
    bookRefs.length > 0 ? await Media.getRelatedMedia(user, bookRefs) : [];
  const results = await mapSearchResults(bookSearchRaw, bookMedia);

  return {
    page,
    totalPages,
    totalResults,
    source,
    results,
  };
};

export const getPopularDiscoverBooks = async (
  user: User | undefined,
  page = 1,
  pageSize = 20
): Promise<DiscoverBooksPage> => {
  const openLibrary = new OpenLibrary();
  const { docs, numFound } = await openLibrary.getPopularBooks({
    page,
    limit: pageSize,
  });

  const bookSearchRaw = dedupeBookSearchResults(
    docs
      .map((doc, index) =>
        mapOpenLibraryDocToSearchResult(doc, Math.max(0, 100 - index))
      )
      .filter((book): book is ReadarrBookSearchResult => book !== null)
  );

  return buildDiscoverPage(
    user,
    page,
    pageSize,
    bookSearchRaw,
    numFound,
    'popular'
  );
};

export const getLibraryDiscoverBooks = async (
  user: User | undefined,
  page = 1,
  pageSize = 20,
  sortBy = 'title.asc'
): Promise<DiscoverBooksPage | null> => {
  const settings = getSettings();
  const readarrServer = getReadarrServer(settings.readarr, false);

  if (!readarrServer) {
    return null;
  }

  const readarr = new ReadarrAPI({
    apiKey: readarrServer.apiKey,
    url: ReadarrAPI.buildUrl(readarrServer, '/api/v1'),
  });

  const allBooksResponse = await Promise.race([
    readarr.getBooks(),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Readarr books request timed out')),
        8000
      );
    }),
  ]);

  const allBooks = allBooksResponse.filter((b) => b.foreignBookId);
  const [field, direction] = sortBy.split('.');
  const multiplier = direction === 'desc' ? -1 : 1;
  const sorted = [...allBooks].sort((a, b) => {
    switch (field) {
      case 'author': {
        const authorA = a.author?.authorName ?? '';
        const authorB = b.author?.authorName ?? '';
        return authorA.localeCompare(authorB) * multiplier;
      }
      case 'monitored':
        return (
          (Number(Boolean(a.monitored)) - Number(Boolean(b.monitored))) *
          multiplier
        );
      case 'hasFile':
        return (
          (Number(Boolean(a.hasFile)) - Number(Boolean(b.hasFile))) * multiplier
        );
      case 'title':
      default:
        return a.title.localeCompare(b.title) * multiplier;
    }
  });

  const totalResults = sorted.length;
  const offset = (page - 1) * pageSize;
  const pageSlice = sorted.slice(offset, offset + pageSize);

  const bookSearchRaw = pageSlice
    .map((b) => mapReadarrBookToSearchResult(b, 0))
    .filter((book): book is ReadarrBookSearchResult => book !== null);

  return buildDiscoverPage(
    user,
    page,
    pageSize,
    bookSearchRaw,
    totalResults,
    'library'
  );
};

export const getDiscoverBooks = async (
  user: User | undefined,
  page = 1,
  pageSize = 20,
  sortBy = 'title.asc'
): Promise<DiscoverBooksPage> => {
  try {
    const libraryPage = await getLibraryDiscoverBooks(
      user,
      page,
      pageSize,
      sortBy
    );

    if (libraryPage && libraryPage.totalResults > 0) {
      return libraryPage;
    }
  } catch (e) {
    logger.warn(
      'Readarr library books unavailable, falling back to Open Library',
      {
        label: 'API',
        errorMessage: e instanceof Error ? e.message : String(e),
      }
    );
  }

  return getPopularDiscoverBooks(user, page, pageSize);
};
