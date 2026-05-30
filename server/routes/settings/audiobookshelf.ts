import AudiobookshelfAPI from '@server/api/audiobookshelf';
import {
  getAudiobookshelfConnectionErrorMessage,
  normalizeAudiobookshelfConnection,
} from '@server/lib/audiobookshelf/normalizeConnectionSettings';
import { audiobookshelfScanner } from '@server/lib/scanners/audiobookshelf';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const audiobookshelfRoutes = Router();

audiobookshelfRoutes.get('/', (_req, res) => {
  res.status(200).json(getSettings().audiobookshelf);
});

audiobookshelfRoutes.post('/', async (req, res, next) => {
  const settings = getSettings();

  try {
    const normalized = normalizeAudiobookshelfConnection({
      ...settings.audiobookshelf,
      ...req.body,
    });

    const client = new AudiobookshelfAPI(normalized);
    await client.testConnection();

    settings.audiobookshelf = {
      ...settings.audiobookshelf,
      ...normalized,
      webAppUrl: req.body.webAppUrl?.trim?.() ?? settings.audiobookshelf.webAppUrl,
    };
    await settings.save();

    return res.status(200).json(settings.audiobookshelf);
  } catch (e) {
    const normalized = normalizeAudiobookshelfConnection({
      ...settings.audiobookshelf,
      ...req.body,
    });

    logger.error('Something went wrong saving Audiobookshelf settings', {
      label: 'API',
      errorMessage: e instanceof Error ? e.message : String(e),
      url: AudiobookshelfAPI.buildUrl(normalized),
    });

    return next({
      status: 500,
      message: getAudiobookshelfConnectionErrorMessage(e),
    });
  }
});

audiobookshelfRoutes.post('/test', async (req, res, next) => {
  try {
    const normalized = normalizeAudiobookshelfConnection(req.body);
    const client = new AudiobookshelfAPI(normalized);
    await client.testConnection();
    return res.status(200).json({ success: true });
  } catch (e) {
    const normalized = normalizeAudiobookshelfConnection(req.body);

    logger.error('Something went wrong testing Audiobookshelf connection', {
      label: 'API',
      errorMessage: e instanceof Error ? e.message : String(e),
      url: AudiobookshelfAPI.buildUrl(normalized),
    });

    return next({
      status: 500,
      message: getAudiobookshelfConnectionErrorMessage(e),
    });
  }
});

audiobookshelfRoutes.get('/library', async (req, res, next) => {
  const settings = getSettings();

  try {
    if (req.query.sync) {
      const client = new AudiobookshelfAPI(settings.audiobookshelf);
      const libraries = await client.getLibraries();
      const existing = settings.audiobookshelf.libraries;

      settings.audiobookshelf.libraries = libraries
        .filter((library) => library.mediaType === 'book')
        .map((library) => {
          const current = existing.find((entry) => entry.id === library.id);
          return {
            id: library.id,
            name: library.name,
            enabled: current?.enabled ?? false,
          };
        });
    }

    const enabledLibraries = req.query.enable
      ? (req.query.enable as string).split(',')
      : [];

    if (req.query.enable) {
      settings.audiobookshelf.libraries = settings.audiobookshelf.libraries.map(
        (library) => ({
          ...library,
          enabled: enabledLibraries.includes(library.id),
        })
      );
    }

    await settings.save();
    return res.status(200).json(settings.audiobookshelf.libraries);
  } catch (e) {
    logger.error('Something went wrong retrieving Audiobookshelf libraries', {
      label: 'API',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return next({
      status: 500,
      message: 'Unable to retrieve Audiobookshelf libraries.',
    });
  }
});

audiobookshelfRoutes.get('/sync', (_req, res) => {
  return res.status(200).json(audiobookshelfScanner.status());
});

audiobookshelfRoutes.post('/sync', (req, res) => {
  if (req.body.cancel) {
    audiobookshelfScanner.cancel();
  } else if (req.body.start) {
    audiobookshelfScanner.run();
  }
  return res.status(200).json(audiobookshelfScanner.status());
});

export default audiobookshelfRoutes;
