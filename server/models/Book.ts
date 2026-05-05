import type { ReadarrBook } from '@server/api/servarr/readarr';
import type Media from '@server/entity/Media';

export interface BookDetails {
  id: string;
  foreignBookId: string;
  title: string;
  titleSlug?: string;
  mediaType: 'book';
  author: {
    foreignAuthorId?: string;
    authorName?: string;
  };
  releaseDate?: string;
  overview?: string;
  posterPath?: string;
  monitored?: boolean;
  hasFile?: boolean;
  mediaInfo?: Media;
  onUserWatchlist?: boolean;
}

const pickCoverFromImages = (images: unknown): string | undefined => {
  if (!Array.isArray(images)) {
    return undefined;
  }
  for (const img of images) {
    if (typeof img !== 'object' || !img) {
      continue;
    }
    const rec = img as Record<string, unknown>;
    const url =
      typeof rec.url === 'string'
        ? rec.url
        : typeof rec.remoteUrl === 'string'
          ? rec.remoteUrl
          : undefined;
    if (url) {
      return url;
    }
  }
  return undefined;
};

export const pickReadarrBookCover = (book: ReadarrBook): string | undefined => {
  const editions = book.editions ?? [];
  for (const edition of editions) {
    const cover = pickCoverFromImages(edition.images);
    if (cover) {
      return cover;
    }
  }
  return undefined;
};

export const mapBookDetails = (
  book: ReadarrBook,
  media?: Media,
  onUserWatchlist?: boolean
): BookDetails => ({
  id: book.foreignBookId,
  foreignBookId: book.foreignBookId,
  title: book.title,
  titleSlug: book.titleSlug,
  mediaType: 'book',
  author: {
    foreignAuthorId: book.author?.foreignAuthorId,
    authorName: book.author?.authorName,
  },
  releaseDate: undefined,
  overview: undefined,
  posterPath: pickReadarrBookCover(book),
  monitored: book.monitored,
  hasFile: book.hasFile,
  mediaInfo: media,
  onUserWatchlist,
});
