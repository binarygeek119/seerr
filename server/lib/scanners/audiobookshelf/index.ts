import AudiobookshelfAPI, {
  type AudiobookshelfLibraryItem,
} from '@server/api/audiobookshelf';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import BaseScanner from '@server/lib/scanners/baseScanner';
import { resolveAudiobookshelfBook } from '@server/lib/audiobookshelf/resolveAudiobookshelfBook';
import type { AudiobookshelfLibrary } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';

type SyncStatus = StatusBase & {
  currentLibrary?: AudiobookshelfLibrary;
  libraries: AudiobookshelfLibrary[];
};

class AudiobookshelfScanner
  extends BaseScanner<AudiobookshelfLibraryItem>
  implements RunnableScanner<SyncStatus>
{
  private libraries: AudiobookshelfLibrary[] = [];
  private currentLibrary?: AudiobookshelfLibrary;
  private client?: AudiobookshelfAPI;

  constructor() {
    super('Audiobookshelf Scan', { bundleSize: 25 });
  }

  public status(): SyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.items.length,
      currentLibrary: this.currentLibrary,
      libraries: this.libraries,
    };
  }

  public async run(): Promise<void> {
    const settings = getSettings().audiobookshelf;
    const sessionId = this.startRun();

    if (!settings.hostname || !settings.apiKey) {
      this.log('Audiobookshelf is not configured. Skipping scan.', 'warn');
      this.endRun(sessionId);
      return;
    }

    try {
      this.client = new AudiobookshelfAPI(settings);
      this.libraries = settings.libraries.filter((library) => library.enabled);

      for (const library of this.libraries) {
        this.currentLibrary = library;
        this.log(`Beginning Audiobookshelf library scan: ${library.name}`, 'info');

        this.items = [];
        let page = 0;
        let total = 0;

        do {
          const response = await this.client.getLibraryItems(library.id, page, 100);
          total = response.total;
          this.items.push(...response.results.filter((item) => item.mediaType === 'book'));
          page += 1;
        } while (page * 100 < total);

        await this.loop(this.processAudiobookshelfItem.bind(this), { sessionId });
      }

      this.log('Audiobookshelf scan complete', 'info');
    } catch (e) {
      this.log('Audiobookshelf scan interrupted', 'error', {
        errorMessage: e.message,
      });
    } finally {
      this.currentLibrary = undefined;
      this.endRun(sessionId);
    }
  }

  private async processAudiobookshelfItem(
    item: AudiobookshelfLibraryItem
  ): Promise<void> {
    const resolved = await resolveAudiobookshelfBook(item);

    if (!resolved) {
      this.log(
        `Skipping Audiobookshelf item without Readarr match: ${item.media?.metadata?.title ?? item.id}`,
        'debug'
      );
      return;
    }

    await this.processBook(resolved.foreignBookId, {
      is4k: true,
      title: resolved.title,
      serviceId: resolved.serviceId,
      externalServiceId: resolved.externalServiceId,
      externalServiceSlug: resolved.externalServiceSlug,
      audiobookshelfMediaId: item.id,
      mediaAddedAt: item.addedAt ? new Date(item.addedAt) : undefined,
    });
  }
}

export const audiobookshelfScanner = new AudiobookshelfScanner();
