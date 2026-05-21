import type { OpenLibrarySearchDoc } from '@server/api/openlibrary';
import type { ReadarrBook } from '@server/api/servarr/readarr';
import { pickReadarrBookCover } from '@server/models/Book';
import type { ReadarrBookSearchResult } from '@server/models/Search';

export const mapReadarrBookToSearchResult = (
  book: ReadarrBook,
  score = 0
): ReadarrBookSearchResult | null => {
  if (!book.foreignBookId) {
    return null;
  }

  return {
    media_type: 'book',
    id: book.foreignBookId,
    title: book.title,
    foreignBookId: book.foreignBookId,
    authorName: book.author?.authorName,
    posterPath: pickReadarrBookCover(book),
    monitored: book.monitored,
    hasFile: book.hasFile,
    score,
  };
};

export const mapOpenLibraryDocToSearchResult = (
  doc: OpenLibrarySearchDoc,
  score = 0
): ReadarrBookSearchResult | null => {
  const foreignBookId = doc.key.replace(/^\/works\//, '');
  if (!foreignBookId) {
    return null;
  }

  const authorName = doc.author_name?.[0];

  return {
    media_type: 'book',
    id: foreignBookId,
    title: doc.title,
    foreignBookId,
    authorName,
    posterPath: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    monitored: false,
    hasFile: false,
    score,
  };
};

export const dedupeBookSearchResults = (
  results: ReadarrBookSearchResult[]
): ReadarrBookSearchResult[] => {
  const seenIds = new Set<string>();

  return results.filter((result) => {
    if (seenIds.has(result.foreignBookId)) {
      return false;
    }
    seenIds.add(result.foreignBookId);
    return true;
  });
};
