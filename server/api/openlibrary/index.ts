import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';

export interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export interface OpenLibraryWork {
  title: string;
  description?: string | { value?: string };
  covers?: number[];
  authors?: { author?: { key?: string } }[];
}

interface OpenLibrarySearchResponse {
  docs: OpenLibrarySearchDoc[];
  numFound?: number;
}

class OpenLibrary extends ExternalAPI {
  constructor() {
    super(
      'https://openlibrary.org',
      {},
      {
        headers: {
          'User-Agent': 'Seerr/1.0.0 (https://github.com/binarygeek119/seerr)',
          Accept: 'application/json',
        },
        nodeCache: cacheManager.getCache('openlibrary').data,
      }
    );
  }

  public async searchBooks({
    query,
    limit = 20,
    page = 1,
  }: {
    query: string;
    limit?: number;
    page?: number;
  }): Promise<{ docs: OpenLibrarySearchDoc[]; numFound: number }> {
    try {
      const data = await this.get<OpenLibrarySearchResponse>(
        '/search.json',
        {
          params: {
            q: query,
            limit: limit.toString(),
            page: page.toString(),
            fields: 'key,title,author_name,cover_i',
          },
        },
        3600
      );

      return {
        docs: data.docs ?? [],
        numFound: data.numFound ?? 0,
      };
    } catch (e) {
      throw new Error(
        `[Open Library] Failed to search books: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getWork(workId: string): Promise<{
    title: string;
    authorName?: string;
    description?: string;
    coverId?: number;
  }> {
    const normalized = workId.replace(/^\/works\//, '').trim();
    try {
      const data = await this.get<OpenLibraryWork>(
        `/works/${normalized}.json`,
        {},
        3600
      );

      let authorName: string | undefined;
      const authorKey = data.authors?.[0]?.author?.key;
      if (authorKey) {
        try {
          const authorData = await this.get<{ name?: string }>(
            `${authorKey}.json`,
            {},
            3600
          );
          authorName = authorData.name;
        } catch {
          // author name is optional for lookup
        }
      }

      const description =
        typeof data.description === 'string'
          ? data.description
          : data.description?.value;

      return {
        title: data.title,
        authorName,
        description,
        coverId: data.covers?.[0],
      };
    } catch (e) {
      throw new Error(
        `[Open Library] Failed to retrieve work: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getPopularBooks({
    page = 1,
    limit = 20,
  }: {
    page?: number;
    limit?: number;
  }): Promise<{ docs: OpenLibrarySearchDoc[]; numFound: number }> {
    try {
      const data = await this.get<OpenLibrarySearchResponse>(
        '/search.json',
        {
          params: {
            subject: 'fiction',
            sort: 'rating desc',
            limit: limit.toString(),
            page: page.toString(),
            fields: 'key,title,author_name,cover_i',
          },
        },
        3600
      );

      return {
        docs: data.docs ?? [],
        numFound: data.numFound ?? 0,
      };
    } catch (e) {
      throw new Error(
        `[Open Library] Failed to retrieve popular books: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default OpenLibrary;
