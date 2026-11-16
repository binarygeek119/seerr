import ReadarrAPI from '@server/api/servarr/readarr';
import type { ReadarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const readarrRoutes = Router();

readarrRoutes.get('/', (_req, res) => {
  const settings = getSettings();
  // Older settings files may not have readarr initialized yet.
  if (!Array.isArray(settings.readarr)) {
    settings.readarr = [];
  }
  res.status(200).json(settings.readarr);
});

readarrRoutes.post('/', (req, res) => {
  const settings = getSettings();

  const newReadarr = {
    ...req.body,
    isAudiobook: req.body.isAudiobook ?? false,
    is4k: false,
  } as ReadarrSettings;
  const lastItem = settings.readarr[settings.readarr.length - 1];
  newReadarr.id = lastItem ? lastItem.id + 1 : 0;

  if (newReadarr.isDefault) {
    settings.readarr
      .filter(
        (readarrInstance) =>
          readarrInstance.isAudiobook === newReadarr.isAudiobook
      )
      .forEach((readarrInstance) => {
        readarrInstance.isDefault = false;
      });
  }

  settings.readarr = [...settings.readarr, newReadarr];
  settings.save();

  return res.status(201).json(newReadarr);
});

readarrRoutes.post<
  undefined,
  Record<string, unknown>,
  ReadarrSettings & { tagLabel?: string }
>('/test', async (req, res, next) => {
  try {
    const readarr = new ReadarrAPI({
      apiKey: req.body.apiKey,
      url: ReadarrAPI.buildUrl(req.body, '/api/v1'),
    });

    const urlBase = await readarr
      .getSystemStatus()
      .then((value) => value.urlBase)
      .catch(() => req.body.baseUrl);
    const profiles = await readarr.getProfiles();
    const metadataProfiles = await readarr.getMetadataProfiles();
    const folders = await readarr.getRootFolders();
    const tags = await readarr.getTags();

    return res.status(200).json({
      profiles,
      metadataProfiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
      tags,
      urlBase,
    });
  } catch (e) {
    logger.error('Failed to test Readarr', {
      label: 'Readarr',
      message: e.message,
    });
    next({ status: 500, message: 'Failed to connect to Readarr' });
  }
});

readarrRoutes.put<{ id: string }, ReadarrSettings, ReadarrSettings>(
  '/:id',
  (req, res, next) => {
    const settings = getSettings();

    const readarrIndex = settings.readarr.findIndex(
      (r) => r.id === Number(req.params.id)
    );

    if (readarrIndex === -1) {
      return next({ status: '404', message: 'Settings instance not found' });
    }

    const updatedReadarr = {
      ...req.body,
      isAudiobook: req.body.isAudiobook ?? false,
      is4k: false,
      id: Number(req.params.id),
    } as ReadarrSettings;

    if (updatedReadarr.isDefault) {
      settings.readarr
        .filter(
          (readarrInstance) =>
            readarrInstance.id !== updatedReadarr.id &&
            readarrInstance.isAudiobook === updatedReadarr.isAudiobook
        )
        .forEach((readarrInstance) => {
          readarrInstance.isDefault = false;
        });
    }

    settings.readarr[readarrIndex] = updatedReadarr;
    settings.save();

    return res.status(200).json(settings.readarr[readarrIndex]);
  }
);

readarrRoutes.get<{ id: string }>('/:id/profiles', async (req, res, next) => {
  const settings = getSettings();

  const readarrSettings = settings.readarr.find(
    (r) => r.id === Number(req.params.id)
  );

  if (!readarrSettings) {
    return next({ status: '404', message: 'Settings instance not found' });
  }

  const readarr = new ReadarrAPI({
    apiKey: readarrSettings.apiKey,
    url: ReadarrAPI.buildUrl(readarrSettings, '/api/v1'),
  });

  const profiles = await readarr.getProfiles();

  return res.status(200).json(
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
    }))
  );
});

readarrRoutes.delete<{ id: string }>('/:id', (req, res, next) => {
  const settings = getSettings();

  const readarrIndex = settings.readarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (readarrIndex === -1) {
    return next({ status: '404', message: 'Settings instance not found' });
  }

  const removed = settings.readarr.splice(readarrIndex, 1);
  settings.save();

  return res.status(200).json(removed[0]);
});

export default readarrRoutes;
