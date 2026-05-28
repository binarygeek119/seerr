import type TheMovieDb from '@server/api/themoviedb';
import type { TmdbMovieResult } from '@server/api/themoviedb/interfaces';
import listData from '@server/data/movie3d-theatrical-list.json';
import { isTheatrical3dMovie } from '@server/lib/movie3dList';
import logger from '@server/logger';

const PAGE_SIZE = 20;
const RESOLVE_BATCH_SIZE = 10;
const MIN_BACKDROPS = 5;
const MAX_BACKDROP_SCAN_PAGES = 20;

type Theatrical3dCache = {
  movies: TmdbMovieResult[];
};

let cache: Theatrical3dCache | null = null;
let cachePromise: Promise<Theatrical3dCache> | null = null;

const resolveTheatrical3dMovies = async (
  tmdb: TheMovieDb,
  language?: string
): Promise<Theatrical3dCache> => {
  const movies: TmdbMovieResult[] = [];
  const seenIds = new Set<number>();

  for (let i = 0; i < listData.movies.length; i += RESOLVE_BATCH_SIZE) {
    const batch = listData.movies.slice(i, i + RESOLVE_BATCH_SIZE);

    await Promise.all(
      batch.map(async (entry) => {
        const search = await tmdb.searchMovies({
          query: entry.title,
          year: entry.year,
          language,
        });

        const match = search.results.find((movie) =>
          isTheatrical3dMovie({
            title: movie.title,
            originalTitle: movie.original_title,
            releaseDate: movie.release_date,
          })
        );

        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          movies.push(match);
        }
      })
    );
  }

  movies.sort((a, b) => b.popularity - a.popularity);

  logger.info('Resolved theatrical 3D movies for discover', {
    label: 'Movie 3D Discover',
    resolved: movies.length,
    total: listData.movies.length,
  });

  return { movies };
};

const getTheatrical3dCache = async (
  tmdb: TheMovieDb,
  language?: string
): Promise<Theatrical3dCache> => {
  if (cache) {
    return cache;
  }

  if (!cachePromise) {
    cachePromise = resolveTheatrical3dMovies(tmdb, language).then((result) => {
      cache = result;
      return result;
    });
  }

  return cachePromise;
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
  const { movies } = await getTheatrical3dCache(tmdb, language);
  const totalResults = movies.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    page: currentPage,
    totalPages,
    totalResults,
    results: movies.slice(start, start + PAGE_SIZE),
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
  cache = null;
  cachePromise = null;
};
