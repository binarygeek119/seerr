import {
  DuplicateWatchlistRequestError,
  NotFoundError,
  Watchlist,
} from '@server/entity/Watchlist';
import logger from '@server/logger';
import { Router } from 'express';
import { QueryFailedError } from 'typeorm';

import { MediaType } from '@server/constants/media';
import { watchlistCreate } from '@server/interfaces/api/watchlistCreate';

const watchlistRoutes = Router();

watchlistRoutes.post<never, Watchlist, Watchlist>(
  '/',
  async (req, res, next) => {
    try {
      if (!req.user) {
        return next({
          status: 401,
          message: 'You must be logged in to add watchlist.',
        });
      }
      const values = watchlistCreate.parse(req.body);

      const request = await Watchlist.createWatchlist({
        watchlistRequest: values,
        user: req.user,
      });
      return res.status(201).json(request);
    } catch (error) {
      if (!(error instanceof Error)) {
        return;
      }
      switch (error.constructor) {
        case QueryFailedError:
          logger.warn('Something wrong with data watchlist', {
            tmdbId: req.body.tmdbId,
            mbId: req.body.mbId,
            mediaType: req.body.mediaType,
            label: 'Watchlist',
          });
          return next({ status: 409, message: 'Something wrong' });
        case DuplicateWatchlistRequestError:
          return next({ status: 409, message: error.message });
        default:
          return next({ status: 500, message: error.message });
      }
    }
  }
);

watchlistRoutes.delete('/:id', async (req, res, next) => {
  if (!req.user) {
    return next({
      status: 401,
      message: 'You must be logged in to delete watchlist data.',
    });
  }
  try {
    const mediaType = req.query.mediaType;
    if (
      mediaType !== MediaType.MOVIE &&
      mediaType !== MediaType.TV &&
      mediaType !== MediaType.MUSIC
    ) {
      return next({
        status: 400,
        message: 'Invalid mediaType query parameter.',
      });
    }

    const id =
      mediaType === MediaType.MUSIC
        ? req.params.id
        : String(Number(req.params.id));

    if (mediaType !== MediaType.MUSIC && Number.isNaN(Number(id))) {
      return next({
        status: 400,
        message: 'Invalid id path parameter.',
      });
    }

    await Watchlist.deleteWatchlist(id, mediaType, req.user);
    return res.status(204).send();
  } catch (e) {
    if (e instanceof NotFoundError) {
      return next({
        status: 404,
        message: e.message,
      });
    }
    return next({ status: 500, message: e.message });
  }
});

export default watchlistRoutes;
