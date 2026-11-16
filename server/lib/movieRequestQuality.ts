export type MovieRequestQuality = 'hd' | '4k' | '3d';

export type MovieStatusField = 'status' | 'status4k' | 'status3d';

export type MovieServiceFields = {
  status: MovieStatusField;
  serviceId: 'serviceId' | 'serviceId4k' | 'serviceId3d';
  externalServiceId:
    | 'externalServiceId'
    | 'externalServiceId4k'
    | 'externalServiceId3d';
  externalServiceSlug:
    | 'externalServiceSlug'
    | 'externalServiceSlug4k'
    | 'externalServiceSlug3d';
  ratingKey: 'ratingKey' | 'ratingKey4k' | 'ratingKey3d';
  jellyfinMediaId: 'jellyfinMediaId' | 'jellyfinMediaId4k' | 'jellyfinMediaId3d';
};

export const movieStatusField = (
  is4k: boolean,
  is3d: boolean
): MovieStatusField => {
  if (is3d) {
    return 'status3d';
  }
  if (is4k) {
    return 'status4k';
  }
  return 'status';
};

export const movieServiceFields = (
  is4k: boolean,
  is3d: boolean
): MovieServiceFields => {
  if (is3d) {
    return {
      status: 'status3d',
      serviceId: 'serviceId3d',
      externalServiceId: 'externalServiceId3d',
      externalServiceSlug: 'externalServiceSlug3d',
      ratingKey: 'ratingKey3d',
      jellyfinMediaId: 'jellyfinMediaId3d',
    };
  }
  if (is4k) {
    return {
      status: 'status4k',
      serviceId: 'serviceId4k',
      externalServiceId: 'externalServiceId4k',
      externalServiceSlug: 'externalServiceSlug4k',
      ratingKey: 'ratingKey4k',
      jellyfinMediaId: 'jellyfinMediaId4k',
    };
  }
  return {
    status: 'status',
    serviceId: 'serviceId',
    externalServiceId: 'externalServiceId',
    externalServiceSlug: 'externalServiceSlug',
    ratingKey: 'ratingKey',
    jellyfinMediaId: 'jellyfinMediaId',
  };
};

export const qualityFromFlags = (
  is4k?: boolean,
  is3d?: boolean
): MovieRequestQuality => {
  if (is3d) {
    return '3d';
  }
  if (is4k) {
    return '4k';
  }
  return 'hd';
};

export const flagsFromQuality = (
  quality: MovieRequestQuality
): { is4k: boolean; is3d: boolean } => {
  return {
    is4k: quality === '4k',
    is3d: quality === '3d',
  };
};

export const normalizeMovieRequestFlags = (
  is4k?: boolean,
  is3d?: boolean
): { is4k: boolean; is3d: boolean } => {
  if (is3d) {
    return { is4k: false, is3d: true };
  }
  return { is4k: !!is4k, is3d: false };
};

export const radarrServerMatchesRequest = (
  server: { is4k: boolean; is3d?: boolean },
  is4k: boolean,
  is3d: boolean
): boolean => {
  return server.is4k === is4k && (server.is3d ?? false) === is3d;
};

export const defaultRadarrServer = <
  T extends { is4k: boolean; is3d?: boolean; isDefault: boolean },
>(
  servers: T[],
  is4k: boolean,
  is3d: boolean
): T | undefined =>
  servers.find(
    (server) =>
      server.isDefault && radarrServerMatchesRequest(server, is4k, is3d)
  );
