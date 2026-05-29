import type TheMovieDb from '@server/api/themoviedb';
import type { TmdbMovieResult } from '@server/api/themoviedb/interfaces';
import {
  getTheatrical3dListEntries,
  isTheatrical3dMovie,
} from '@server/lib/movie3dList';
import logger from '@server/logger';

const PAGE_SIZE = 20;
const RESOLVE_BATCH_SIZE = 5;
const MIN_BACKDROPS = 5;
const MAX_BACKDROP_SCAN_PAGES = 20;

const resolvedByListKey = new Map<string, TmdbMovieResult | null>();

const listEntryKey = (title: string, year: number): string =>
  `${title}|${year}`;

const resolveTheatrical3dEntry = async (
  tmdb: TheMovieDb,
  entry: { title: string; year: number },
  language?: string
): Promise<TmdbMovieResult | null> => {
  const key = listEntryKey(entry.title, entry.year);

  if (resolvedByListKey.has(key)) {
    return resolvedByListKey.get(key) ?? null;
  }

  try {
    const search = await tmdb.searchMovies({
      query: entry.title,
      year: entry.year,
      language,
    });

    const match =
      search.results.find((movie) =>
        isTheatrical3dMovie({
          title: movie.title,
          originalTitle: movie.original_title,
          releaseDate: movie.release_date,
        })
      ) ?? null;

    resolvedByListKey.set(key, match);
    return match;
  } catch (error) {
    logger.debug('Failed to resolve theatrical 3D movie from TMDB search', {
      label: 'Movie 3D Discover',
      title: entry.title,
      year: entry.year,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    resolvedByListKey.set(key, null);
    return null;
  }
};

const resolveTheatrical3dPage = async (
  tmdb: TheMovieDb,
  page: number,
  language?: string
): Promise<TmdbMovieResult[]> => {
  const entries = getTheatrical3dListEntries();
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageEntries = entries.slice(start, start + PAGE_SIZE);
  const movies: TmdbMovieResult[] = [];

  for (let i = 0; i < pageEntries.length; i += RESOLVE_BATCH_SIZE) {
    const batch = pageEntries.slice(i, i + RESOLVE_BATCH_SIZE);
    const resolved = await Promise.all(
      batch.map((entry) => resolveTheatrical3dEntry(tmdb, entry, language))
    );

    for (const match of resolved) {
      if (match) {
        movies.push(match);
      }
    }
  }

  movies.sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
  );

  return movies;
};

export const getTheatrical3dDiscoverResults = async (
  tmdb: TheMovieDb,
  page: number,
  language?: string
): Promise<{
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbMovieResult[];
}> => {
  const entries = getTheatrical3dListEntries();
  const totalResults = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const results = await resolveTheatrical3dPage(tmdb, currentPage, language);

  if (currentPage === 1) {
    logger.info('Resolved theatrical 3D discover page', {
      label: 'Movie 3D Discover',
      page: currentPage,
      resolved: results.length,
      requested: Math.min(PAGE_SIZE, entries.length),
    });
  }

  return {
    page: currentPage,
    totalPages,
    totalResults,
    results,
  };
};

export const getTheatrical3dGenreBackdrops = async (
  tmdb: TheMovieDb,
  language?: string
): Promise<string[]> => {
  const backdrops: string[] = [];

  for (let page = 1; page <= MAX_BACKDROP_SCAN_PAGES; page++) {
    const data = await tmdb.getDiscoverMovies({
      page,
      sortBy: 'popularity.desc',
      language,
    });

    for (const movie of data.results) {
      if (
        movie.backdrop_path &&
        isTheatrical3dMovie({
          title: movie.title,
          originalTitle: movie.original_title,
          releaseDate: movie.release_date,
        })
      ) {
        backdrops.push(movie.backdrop_path);
      }
    }

    if (backdrops.length >= MIN_BACKDROPS || page >= data.total_pages) {
      break;
    }
  }

  return backdrops;
};

export const clearTheatrical3dDiscoverCache = (): void => {
  resolvedByListKey.clear();
};
