import ServarrBase from './base';

export interface ReadarrAuthor {
  id?: number;
  foreignAuthorId: string;
  authorName?: string;
  monitored?: boolean;
  qualityProfileId?: number;
  metadataProfileId?: number;
  rootFolderPath?: string;
  tags?: number[];
}

export interface ReadarrEdition {
  id?: number;
  bookId?: number;
  foreignEditionId: string;
  title: string;
  titleSlug: string;
  monitored?: boolean;
  manualAdd?: boolean;
  images?: unknown[];
}

export interface ReadarrBook {
  id: number;
  title: string;
  titleSlug?: string;
  foreignBookId: string;
  monitored: boolean;
  hasFile?: boolean;
  author?: ReadarrAuthor;
  editions?: ReadarrEdition[];
  statistics?: {
    bookFileCount?: number;
    totalBookCount?: number;
    percentOfBooks?: number;
  };
}

export interface ReadarrAddBookInput {
  monitored: boolean;
  tags: number[];
  addOptions?: {
    addType?: string;
    searchForNewBook: boolean;
  };
  author: {
    monitored: boolean;
    qualityProfileId: number;
    metadataProfileId: number;
    foreignAuthorId: string;
    rootFolderPath: string;
    tags: number[];
    addOptions?: {
      searchForMissingBooks?: boolean;
      monitored?: boolean;
      monitor?: string;
      booksToMonitor?: string[];
    };
  };
  editions: {
    title: string;
    titleSlug: string;
    images: unknown[];
    foreignEditionId: string;
    monitored: boolean;
    manualAdd: boolean;
  }[];
  foreignBookId: string;
}

export interface MetadataProfile {
  id: number;
  name: string;
}

class ReadarrAPI extends ServarrBase<{ bookId: number }> {
  protected apiKey: string;

  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'readarr', apiName: 'Readarr' });
    this.apiKey = apiKey;
  }

  public async getBooks(): Promise<ReadarrBook[]> {
    try {
      return await this.get<ReadarrBook[]>('/book');
    } catch (e) {
      throw new Error(`[Readarr] Failed to retrieve books: ${e.message}`);
    }
  }

  public async getBookById(id: number): Promise<ReadarrBook> {
    try {
      return await this.get<ReadarrBook>(`/book/${id}`);
    } catch (e) {
      throw new Error(`[Readarr] Failed to retrieve book: ${e.message}`);
    }
  }

  public async lookupBooks(term: string): Promise<ReadarrBook[]> {
    try {
      return await this.get<ReadarrBook[]>('/book/lookup', {
        params: { term },
      });
    } catch (e) {
      throw new Error(`[Readarr] Failed to lookup books: ${e.message}`);
    }
  }

  public async addBook(body: ReadarrAddBookInput): Promise<ReadarrBook> {
    try {
      return await this.post<ReadarrBook>(
        '/book',
        body as unknown as Record<string, unknown>
      );
    } catch (e) {
      throw new Error(`[Readarr] Failed to add book: ${e.message}`);
    }
  }

  public async getMetadataProfiles(): Promise<MetadataProfile[]> {
    try {
      return await this.get<MetadataProfile[]>('/metadataProfile');
    } catch (e) {
      throw new Error(
        `[Readarr] Failed to retrieve metadata profiles: ${e.message}`
      );
    }
  }
}

export default ReadarrAPI;
