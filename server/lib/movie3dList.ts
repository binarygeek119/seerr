import listData from '@server/data/movie3d-theatrical-list.json';
import logger from '@server/logger';

type Theatrical3dListEntry = {
  title: string;
  year: number;
};

type Theatrical3dListFile = {
  source: string;
  movies: Theatrical3dListEntry[];
};

/**
 * Normalize titles for matching TMDB names to 3dmovielist.com entries.
 */
export const normalizeMovieTitleFor3dList = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const file = listData as Theatrical3dListFile;

const theatrical3dKeys = new Set<string>();

for (const entry of file.movies) {
  theatrical3dKeys.add(
    `${normalizeMovieTitleFor3dList(entry.title)}|${entry.year}`
  );
}

logger.info('Loaded theatrical 3D movie list', {
  label: 'Movie 3D List',
  count: theatrical3dKeys.size,
  source: file.source,
});

export const theatrical3dListSource = file.source;

export const theatrical3dListSize = theatrical3dKeys.size;

const releaseYearFromDate = (releaseDate?: string): number | undefined => {
  if (!releaseDate || releaseDate.length < 4) {
    return undefined;
  }
  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
};

const matchesKey = (normalizedTitle: string, year: number): boolean => {
  if (theatrical3dKeys.has(`${normalizedTitle}|${year}`)) {
    return true;
  }
  // Allow ±1 year for TMDB vs theatrical list discrepancies
  return (
    theatrical3dKeys.has(`${normalizedTitle}|${year - 1}`) ||
    theatrical3dKeys.has(`${normalizedTitle}|${year + 1}`)
  );
};

/**
 * Returns true when the movie appears on the 3dmovielist.com theatrical list.
 */
export const isTheatrical3dMovie = ({
  title,
  originalTitle,
  releaseDate,
}: {
  title: string;
  originalTitle?: string;
  releaseDate?: string;
}): boolean => {
  const year = releaseYearFromDate(releaseDate);
  if (!year) {
    return false;
  }

  const candidates = [title, originalTitle].filter(
    (value): value is string => !!value?.trim()
  );

  for (const candidate of candidates) {
    const normalized = normalizeMovieTitleFor3dList(candidate);
    if (normalized && matchesKey(normalized, year)) {
      return true;
    }
  }

  return false;
};
