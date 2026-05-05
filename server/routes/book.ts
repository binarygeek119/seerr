import ReadarrAPI from '@server/api/servarr/readarr';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { Watchlist } from '@server/entity/Watchlist';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { mapBookDetails } from '@server/models/Book';
import { Router } from 'express';

const bookRoutes = Router();

bookRoutes.get('/:id', async (req, res, next) => {
  const foreignBookId = decodeURIComponent(req.params.id);
  const settings = getSettings();
  const readarrServer =
    settings.readarr.find((s) => s.isDefault) ?? settings.readarr[0];

  if (!readarrServer) {
    return next({
      status: 503,
      message: 'Readarr is not configured.',
    });
  }

  try {
    const readarr = new ReadarrAPI({
      url: ReadarrAPI.buildUrl(readarrServer, '/api/v1'),
      apiKey: readarrServer.apiKey,
    });

    const lookup = await readarr.lookupBooks(foreignBookId);
    const book =
      lookup.find((b) => b.foreignBookId === foreignBookId) ?? lookup[0];

    if (!book) {
      return next({
        status: 404,
        message: 'Book not found.',
      });
    }

    const [media, onUserWatchlist] = await Promise.all([
      getRepository(Media)
        .createQueryBuilder('media')
        .leftJoinAndSelect('media.requests', 'requests')
        .leftJoinAndSelect('requests.requestedBy', 'requestedBy')
        .leftJoinAndSelect('requests.modifiedBy', 'modifiedBy')
        .where('media.foreignBookId = :foreignBookId', {
          foreignBookId: book.foreignBookId,
        })
        .andWhere('media.mediaType = :mediaType', { mediaType: MediaType.BOOK })
        .getOne()
        .then((m) => m ?? undefined),
      req.user
        ? getRepository(Watchlist)
            .createQueryBuilder('w')
            .innerJoin('w.media', 'm')
            .where('w.requestedById = :uid', { uid: req.user.id })
            .andWhere('w.mediaType = :wt', { wt: MediaType.BOOK })
            .andWhere('m.foreignBookId = :fid', { fid: book.foreignBookId })
            .getExists()
        : Promise.resolve(false),
    ]);

    return res.status(200).json(mapBookDetails(book, media, onUserWatchlist));
  } catch (error) {
    logger.error('Something went wrong retrieving book details', {
      label: 'Book API',
      errorMessage: error instanceof Error ? error.message : String(error),
      foreignBookId,
    });
    return next({
      status: 500,
      message: 'Unable to retrieve book details.',
    });
  }
});

export default bookRoutes;
