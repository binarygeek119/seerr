import AudiobookshelfAPI from '@server/api/audiobookshelf';
import {
  getAudiobookshelfConnectionErrorMessage,
  normalizeAudiobookshelfConnection,
} from '@server/lib/audiobookshelf/normalizeConnectionSettings';
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
    logger.error('Something went wrong saving Audiobookshelf settings', {
      label: 'API',
      errorMessage: e instanceof Error ? e.message : String(e),
    });

    return next({
      status: 500,
      message: getAudiobookshelfConnectionErrorMessage(e),
    });
  }
});

audiobookshelfRoutes.post('/test', async (req, res, next) => {
  try {
    const client = new AudiobookshelfAPI(
      normalizeAudiobookshelfConnection(req.body)
    );
    await client.testConnection();
    return res.status(200).json({ success: true });
  } catch (e) {
    logger.error('Something went wrong testing Audiobookshelf connection', {
      label: 'API',
      errorMessage: e instanceof Error ? e.message : String(e),
    });

    return next({
      status: 500,
      message: getAudiobookshelfConnectionErrorMessage(e),
    });
  }
});

export default audiobookshelfRoutes;
