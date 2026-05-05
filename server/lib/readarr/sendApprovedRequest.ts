import type { ReadarrAddBookInput, ReadarrBook } from '@server/api/servarr/readarr';
import ReadarrAPI from '@server/api/servarr/readarr';
import { MediaRequestStatus, MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { MediaRequest } from '@server/entity/MediaRequest';
import type { ReadarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Notification } from '@server/lib/notifications';

function buildAddBookPayload(
  book: ReadarrBook,
  readarrSettings: ReadarrSettings,
  entity: MediaRequest,
  tags: number[]
): ReadarrAddBookInput {
  const author = book.author;
  const edition = book.editions?.find((e) => e.monitored) ?? book.editions?.[0];
  if (!author?.foreignAuthorId || !edition?.foreignEditionId) {
    throw new Error('Readarr lookup result is missing author or edition data');
  }

  let rootFolder = readarrSettings.activeDirectory;
  if (entity.rootFolder && entity.rootFolder !== '') {
    rootFolder = entity.rootFolder;
  }

  const qualityProfile = entity.profileId ?? readarrSettings.activeProfileId;
  const metadataProfile = readarrSettings.activeMetadataProfileId ?? 1;

  return {
    foreignBookId: book.foreignBookId,
    monitored: true,
    tags,
    addOptions: {
      searchForNewBook: true,
    },
    author: {
      monitored: true,
      qualityProfileId: qualityProfile,
      metadataProfileId: metadataProfile,
      foreignAuthorId: author.foreignAuthorId,
      rootFolderPath: rootFolder,
      tags,
      addOptions: {
        searchForMissingBooks: false,
        monitored: true,
        monitor: 'none',
        booksToMonitor: [],
      },
    },
    editions: [
      {
        title: edition.title,
        titleSlug: edition.titleSlug,
        images: (edition.images as unknown[]) ?? [],
        foreignEditionId: edition.foreignEditionId,
        monitored: true,
        manualAdd: true,
      },
    ],
  };
}

export async function sendApprovedBookToReadarr(
  entity: MediaRequest
): Promise<void> {
  if (
    entity.status !== MediaRequestStatus.APPROVED ||
    entity.type !== MediaType.BOOK
  ) {
    return;
  }

  const mediaRepository = getRepository(Media);
  const settings = getSettings();

  if (!settings.readarr?.length) {
    logger.info('No Readarr server configured, skipping book request processing', {
      label: 'Media Request',
      requestId: entity.id,
      mediaId: entity.media.id,
    });
    return;
  }

  let readarrSettings = settings.readarr.find((r) => r.isDefault);

  if (
    entity.serverId !== null &&
    entity.serverId >= 0 &&
    readarrSettings?.id !== entity.serverId
  ) {
    readarrSettings = settings.readarr.find((r) => r.id === entity.serverId);
  }

  if (!readarrSettings) {
    logger.warn('There is no default Readarr server configured.', {
      label: 'Media Request',
      requestId: entity.id,
      mediaId: entity.media.id,
    });
    return;
  }

  const media = await mediaRepository.findOne({
    where: { id: entity.media.id },
  });

  if (!media) {
    logger.error('Media data not found', {
      label: 'Media Request',
      requestId: entity.id,
      mediaId: entity.media.id,
    });
    return;
  }

  if (media.status === MediaStatus.AVAILABLE) {
    logger.warn('Book media already available, skipping Readarr send', {
      label: 'Media Request',
      requestId: entity.id,
      mediaId: entity.media.id,
    });
    return;
  }

  if (!media.foreignBookId) {
    throw new Error('media.foreignBookId is required for book requests');
  }

  const readarr = new ReadarrAPI({
    apiKey: readarrSettings.apiKey,
    url: ReadarrAPI.buildUrl(readarrSettings, '/api/v1'),
  });

  const lookup = await readarr.lookupBooks(media.foreignBookId);
  const book =
    lookup.find((b) => b.foreignBookId === media.foreignBookId) ?? lookup[0];

  if (!book) {
    throw new Error('Book not found in Readarr lookup');
  }

  const tags = [...(entity.tags ?? [])];

  if (readarrSettings.tagRequests) {
    let userTag = (await readarr.getTags()).find((v) =>
      v.label.startsWith(entity.requestedBy.id + ' - ')
    );
    if (!userTag) {
      userTag = await readarr.createTag({
        label: entity.requestedBy.id + ' - ' + entity.requestedBy.displayName,
      });
    }
    if (userTag?.id && !tags.includes(userTag.id)) {
      tags.push(userTag.id);
    }
  }

  const payload = buildAddBookPayload(book, readarrSettings, entity, tags);

  readarr
    .addBook(payload)
    .then(async (result) => {
      const latest = await mediaRepository.findOne({
        where: { id: entity.media.id },
      });
      if (!latest) {
        throw new Error('Media data not found');
      }
      latest.externalServiceId = result.id;
      latest.externalServiceSlug = result.titleSlug;
      latest.serviceId = readarrSettings.id;
      await mediaRepository.save(latest);
    })
    .catch(async (error) => {
      const requestRepository = getRepository(MediaRequest);
      entity.status = MediaRequestStatus.FAILED;
      await requestRepository.save(entity);
      logger.warn('Readarr add book failed', {
        label: 'Media Request',
        requestId: entity.id,
        mediaId: entity.media.id,
        error: error.message,
      });
      MediaRequest.sendNotification(entity, media, Notification.MEDIA_FAILED);
    });

  logger.info('Sent book request to Readarr', {
    label: 'Media Request',
    requestId: entity.id,
    mediaId: entity.media.id,
  });
}
