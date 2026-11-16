import { isOpenLibraryWorkId } from '@server/lib/readarr/lookupBook';

const OPEN_LIBRARY_KEY_PATTERN = /OL\d+W/i;

/**
 * Extract a Readarr-compatible Open Library work id (e.g. OL27479W) from Jellyfin provider ids.
 */
export const extractForeignBookIdFromJellyfin = (providerIds?: {
  [key: string]: string | null | undefined;
}): string | null => {
  if (!providerIds) {
    return null;
  }

  const candidates = [
    providerIds.OpenLibrary,
    providerIds.openlibrary,
    providerIds.Openlibrary,
    providerIds['Open Library'],
  ].filter((value): value is string => !!value?.trim());

  for (const raw of candidates) {
    const trimmed = raw.trim();
    if (isOpenLibraryWorkId(trimmed)) {
      return trimmed.toUpperCase();
    }

    const fromPath = trimmed.match(OPEN_LIBRARY_KEY_PATTERN);
    if (fromPath) {
      return fromPath[0].toUpperCase();
    }
  }

  return null;
};
