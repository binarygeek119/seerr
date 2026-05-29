import { isOpenLibraryWorkId } from '@server/lib/readarr/lookupBook';

const OPEN_LIBRARY_KEY_PATTERN = /OL\d+W/i;

/**
 * Extract a Readarr-compatible Open Library work id from Plex Guid entries.
 */
export const extractForeignBookIdFromPlex = (
  guids?: { id: string }[]
): string | null => {
  if (!guids?.length) {
    return null;
  }

  for (const guid of guids) {
    const raw = guid.id?.trim();
    if (!raw) {
      continue;
    }

    const openLibraryMatch = raw.match(OPEN_LIBRARY_KEY_PATTERN);
    if (openLibraryMatch && isOpenLibraryWorkId(openLibraryMatch[0])) {
      return openLibraryMatch[0].toUpperCase();
    }

    const pathMatch = raw.match(/openlibrary\.org\/works\/(OL\d+W)/i);
    if (pathMatch && isOpenLibraryWorkId(pathMatch[1])) {
      return pathMatch[1].toUpperCase();
    }
  }

  return null;
};
