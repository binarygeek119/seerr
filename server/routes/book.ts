import OpenLibrary from '@server/api/openlibrary';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import ReadarrAPI from '@server/api/servarr/readarr';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { Watchlist } from '@server/entity/Watchlist';
import { getReadarrServer } from '@server/lib/readarr/getReadarrServer';
import {
  formatReadarrLookupError,
  isOpenLibraryWorkId,
  lookupBookInReadarr,
} from '@server/lib/readarr/lookupBook';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { mapBookDetails } from '@server/models/Book';
import { Router } from 'express';

const bookRoutes = Router();

bookRoutes.get('/:id', async (req, res, next) => {
  const foreignBookId = decodeURIComponent(req.params.id);
  const settings = getSettings();
  const readarrServer = getReadarrServer(settings.readarr, false);

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

    let book: ReadarrBook | null = null;

    try {
      book = await lookupBookInReadarr(readarr, foreignBookId);
    } catch (error) {
      if (isOpenLibraryWorkId(foreignBookId)) {
        try {
          const work = await new OpenLibrary().getWork(foreignBookId);
          book = {
            id: 0,
            title: work.title,
            foreignBookId,
            monitored: false,
            hasFile: false,
            author: work.authorName
              ? { foreignAuthorId: '', authorName: work.authorName }
              : undefined,
            editions: work.coverId
              ? [
                  {
                    foreignEditionId: foreignBookId,
                    title: work.title,
                    titleSlug: foreignBookId,
                    images: [
                      {
                        url: `https://covers.openlibrary.org/b/id/${work.coverId}-L.jpg`,
                      },
                    ],
                  },
                ]
              : [
                  {
                    foreignEditionId: foreignBookId,
                    title: work.title,
                    titleSlug: foreignBookId,
                  },
                ],
          };
        } catch (olError) {
          logger.warn('Open Library book details fallback failed', {
            label: 'Book API',
            foreignBookId,
            errorMessage:
              olError instanceof Error ? olError.message : String(olError),
          });
        }
      }

      if (!book) {
        return next({
          status: 503,
          message: formatReadarrLookupError(error, readarrServer.name),
        });
      }
    }

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
