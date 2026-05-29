export const extractForeignBookIdFromAudiobookshelf = (metadata?: {
  isbn?: string | null;
  asin?: string | null;
}): string | null => {
  const isbn = metadata?.isbn?.trim();
  if (isbn) {
    return isbn;
  }

  const asin = metadata?.asin?.trim();
  if (asin) {
    return asin;
  }

  return null;
};

export const buildAudiobookshelfSearchTerms = (
  metadata?: {
    title?: string;
    authorName?: string;
    isbn?: string | null;
    asin?: string | null;
  },
  fallbackTitle?: string
): string[] => {
  const terms: string[] = [];
  const title = metadata?.title?.trim() || fallbackTitle?.trim();
  const author = metadata?.authorName?.trim();
  const isbn = metadata?.isbn?.trim();
  const asin = metadata?.asin?.trim();

  if (isbn) {
    terms.push(isbn);
  }
  if (asin) {
    terms.push(asin);
  }
  if (title && author) {
    terms.push(`${title} ${author}`);
  }
  if (title) {
    terms.push(title);
  }

  return [...new Set(terms.filter(Boolean))];
};
