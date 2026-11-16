import ListenBrainzAPI from '@server/api/listenbrainz';
import type LidarrAPI from '@server/api/servarr/lidarr';
import type {
  LidarrAlbumResult,
  LidarrArtistResult,
  LidarrLookupAlbum,
} from '@server/api/servarr/lidarr';
import logger from '@server/logger';

const isAlbumResult = (
  result: LidarrAlbumResult | LidarrArtistResult
): result is LidarrAlbumResult => {
  return result.media_type === 'album' || 'album' in result;
};

const mapLookupAlbumToSearchResult = (
  lookup: LidarrLookupAlbum
): LidarrAlbumResult => {
  const artist = lookup.artist ?? {
    id: lookup.artistId ?? 0,
    status: 'continuing',
    ended: false,
    foreignArtistId: '',
    tadbId: 0,
    discogsId: 0,
    artistType: 'person',
    disambiguation: undefined,
    links: [],
    images: [],
    genres: [],
    cleanName: undefined,
    sortName: undefined,
    tags: [],
    added: new Date().toISOString(),
    ratings: undefined,
    artistName: 'Unknown Artist',
    overview: '',
  };

  return {
    id: lookup.id ?? 0,
    mbId: lookup.foreignAlbumId,
    media_type: 'album',
    album: {
      disambiguation: lookup.disambiguation ?? '',
      duration: lookup.duration ?? 0,
      mediumCount: lookup.mediumCount ?? 0,
      ratings: lookup.ratings,
      links: [],
      media_type: 'music',
      title: lookup.title,
      foreignAlbumId: lookup.foreignAlbumId,
      overview: lookup.overview ?? '',
      releaseDate: lookup.releaseDate ?? '',
      albumType: lookup.albumType ?? 'Album',
      genres: lookup.genres ?? [],
      images: lookup.images ?? [],
      artist: {
        ...artist,
        id: artist.id ?? lookup.artistId ?? 0,
        foreignArtistId: artist.foreignArtistId ?? '',
      },
    },
  };
};

const pickLookupAlbum = (
  albums: LidarrLookupAlbum[],
  mbId: string
): LidarrLookupAlbum | undefined => {
  if (!albums.length) {
    return undefined;
  }

  const normalizedMbId = mbId.toLowerCase();

  return (
    albums.find((a) => a.foreignAlbumId?.toLowerCase() === normalizedMbId) ??
    albums[0]
  );
};

const pickAlbumMatch = (
  results: (LidarrAlbumResult | LidarrArtistResult)[],
  mbId: string
): LidarrAlbumResult | undefined => {
  const albums = results.filter(isAlbumResult);

  if (!albums.length) {
    return undefined;
  }

  const normalizedMbId = mbId.toLowerCase();

  return (
    albums.find(
      (entry) =>
        entry.mbId?.toLowerCase() === normalizedMbId ||
        entry.album?.foreignAlbumId?.toLowerCase() === normalizedMbId
    ) ?? albums[0]
  );
};

const buildSearchTerms = (mbId: string): string[] => [
  `lidarr:${mbId}`,
  `mbid:${mbId}`,
  mbId,
];

const isLidarrUnreachableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  return (
    lower.includes('timeout') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('enotfound')
  );
};

const isDiscogsMetadataError = (message: string): boolean => {
  const lower = message.toLowerCase();

  return (
    lower.includes('discogs') ||
    lower.includes('discogsapiservice') ||
    lower.includes('discogsproxy')
  );
};

export const formatLidarrLookupError = (
  error: unknown,
  serverName?: string
): string => {
  const message = error instanceof Error ? error.message : String(error);
  const label = serverName ?? 'Lidarr';

  if (isDiscogsMetadataError(message)) {
    return (
      `${label} album search failed: Discogs metadata provider error. ` +
      'In Lidarr go to Settings → Metadata, verify your Discogs personal access token, ' +
      'or switch the metadata profile away from Discogs-only search. ' +
      'Then search the album in Lidarr UI; if that also fails, restart Lidarr and retry.'
    );
  }

  if (isLidarrUnreachableError(error)) {
    return `${label} could not look up this album (metadata API error or server unreachable). Check Lidarr logs and try searching the album directly in Lidarr.`;
  }

  return message;
};

export const resolveMusicSearchHints = async (
  mbId: string,
  hints?: { title?: string; artist?: string }
): Promise<{ title?: string; artist?: string }> => {
  if (hints?.title) {
    return hints;
  }

  try {
    const album = await new ListenBrainzAPI().getAlbum(mbId);
    return {
      title: album.release_group_metadata.release_group.name,
      artist: album.release_group_metadata.artist.name,
    };
  } catch (error) {
    logger.debug('ListenBrainz album lookup failed for Lidarr search hints', {
      label: 'Lidarr',
      mbId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return hints ?? {};
  }
};

/**
 * Resolve an album in Lidarr via /album/lookup first, then /search, then title search.
 */
export const lookupAlbumInLidarr = async (
  lidarr: LidarrAPI,
  mbId: string,
  hints?: { title?: string; artist?: string }
): Promise<LidarrAlbumResult | null> => {
  const trimmedMbId = mbId.trim();
  let lastError: unknown;

  for (const term of buildSearchTerms(trimmedMbId)) {
    try {
      const lookupResults = await lidarr.lookupAlbumsByTerm(term);
      const lookupMatch = pickLookupAlbum(lookupResults, trimmedMbId);
      if (lookupMatch?.foreignAlbumId && lookupMatch.artist?.foreignArtistId) {
        return mapLookupAlbumToSearchResult(lookupMatch);
      }
    } catch (error) {
      lastError = error;
      logger.debug('Lidarr /album/lookup term failed', {
        label: 'Lidarr',
        term,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const results = await lidarr.searchByTerm(term);
      const match = pickAlbumMatch(results, trimmedMbId);
      if (
        match?.album?.foreignAlbumId &&
        match.album?.artist?.foreignArtistId
      ) {
        return match;
      }
    } catch (error) {
      lastError = error;
      logger.debug('Lidarr /search term failed', {
        label: 'Lidarr',
        term,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const searchHints = await resolveMusicSearchHints(trimmedMbId, hints);

  if (searchHints.title) {
    const textTerms = [
      searchHints.artist
        ? `${searchHints.artist} ${searchHints.title}`
        : searchHints.title,
      searchHints.title,
    ];

    for (const term of [...new Set(textTerms)]) {
      try {
        const lookupResults = await lidarr.lookupAlbumsByTerm(term);
        const lookupMatch = pickLookupAlbum(lookupResults, trimmedMbId);
        if (
          lookupMatch?.foreignAlbumId &&
          lookupMatch.artist?.foreignArtistId
        ) {
          return mapLookupAlbumToSearchResult(lookupMatch);
        }
      } catch (error) {
        lastError = error;
        logger.debug('Lidarr text /album/lookup failed', {
          label: 'Lidarr',
          term,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        const results = await lidarr.searchByTerm(term);
        const match = pickAlbumMatch(results, trimmedMbId);
        if (
          match?.album?.foreignAlbumId &&
          match.album?.artist?.foreignArtistId
        ) {
          return match;
        }
      } catch (error) {
        lastError = error;
        logger.debug('Lidarr text /search failed', {
          label: 'Lidarr',
          term,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};
