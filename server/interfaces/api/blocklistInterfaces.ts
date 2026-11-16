import type { User } from '@server/entity/User';
import type { PaginatedResponse } from '@server/interfaces/api/common';

export interface BlocklistItem {
  tmdbId?: number;
  mbId?: string;
  foreignBookId?: string;
  mediaType: 'movie' | 'tv' | 'music' | 'book';
  title?: string;
  createdAt?: Date;
  user?: User;
  blocklistedTags?: string;
}

export interface BlocklistResultsResponse extends PaginatedResponse {
  results: BlocklistItem[];
}
