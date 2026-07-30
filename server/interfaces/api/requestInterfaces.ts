import type { MediaType } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { NonFunctionProperties, PaginatedResponse } from './common';

export interface RequestResultsResponse extends PaginatedResponse {
  results: (NonFunctionProperties<MediaRequest> & {
    profileName?: string;
    canRemove?: boolean;
  })[];
  serviceErrors: {
    radarr: { id: number; name: string }[];
    sonarr: { id: number; name: string }[];
    lidarr: { id: number; name: string }[];
    readarr: { id: number; name: string }[];
  };
}

export type MediaRequestBody = {
  mediaType: MediaType;
  /** TMDB id for movies/TV; MusicBrainz release group id for music; lookup term or foreign id for books. */
  mediaId: number | string;
  tvdbId?: number;
  seasons?: number[] | 'all';
  is4k?: boolean;
  is3d?: boolean;
  serverId?: number;
  profileId?: number;
  profileName?: string;
  rootFolder?: string;
  languageProfileId?: number;
  userId?: number;
  tags?: number[];
  ignoreQuota?: boolean;
};
