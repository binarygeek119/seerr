import AudiobookshelfAPI from '@server/api/audiobookshelf';
import { getSettings } from '@server/lib/settings';
import { Router } from 'express';

const audiobookshelfRoutes = Router();

audiobookshelfRoutes.get('/', (_req, res) => {
  res.status(200).json(getSettings().audiobookshelf);
});

audiobookshelfRoutes.post('/', async (req, res) => {
  const settings = getSettings();
  settings.audiobookshelf = {
    ...settings.audiobookshelf,
    ...req.body,
  };
  await settings.save();
  return res.status(200).json(settings.audiobookshelf);
});

audiobookshelfRoutes.post('/test', async (req, res, next) => {
  try {
    const client = new AudiobookshelfAPI(req.body);
    await client.testConnection();
    return res.status(200).json({ success: true });
  } catch (e) {
    return next({
      status: 500,
      message: 'Failed to connect to Audiobookshelf',
    });
  }
});

export default audiobookshelfRoutes;
