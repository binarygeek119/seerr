import type { RadarrMovie } from '@server/api/servarr/radarr';
import RadarrAPI from '@server/api/servarr/radarr';
import { MediaStatus, MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import BaseScanner from '@server/lib/scanners/baseScanner';
import type { RadarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { uniqWith } from 'lodash';

type SyncStatus = StatusBase & {
  currentServer: RadarrSettings;
  servers: RadarrSettings[];
};

class RadarrScanner
  extends BaseScanner<RadarrMovie>
  implements RunnableScanner<SyncStatus>
{
  private servers: RadarrSettings[];
  private currentServer: RadarrSettings;
  private radarrApi: RadarrAPI;
  private scannedTmdbIds: Set<number> = new Set();
  private scanned4kTmdbIds: Set<number> = new Set();
  private scanned3dTmdbIds: Set<number> = new Set();
  private didScanStandard = false;
  private didScan4k = false;
  private didScan3d = false;
  private serverReturnedEmpty = false;
  private server4kReturnedEmpty = false;
  private server3dReturnedEmpty = false;

  constructor() {
    super('Radarr Scan', { bundleSize: 50 });
  }

  public status(): SyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.items.length,
      currentServer: this.currentServer,
      servers: this.servers,
    };
  }

  public async run(): Promise<void> {
    const settings = getSettings();
    const sessionId = this.startRun();
    this.scannedTmdbIds.clear();
    this.scanned4kTmdbIds.clear();
    this.scanned3dTmdbIds.clear();
    this.didScanStandard = false;
    this.didScan4k = false;
    this.didScan3d = false;
    this.serverReturnedEmpty = false;
    this.server4kReturnedEmpty = false;
    this.server3dReturnedEmpty = false;

    try {
      this.servers = uniqWith(settings.radarr, (radarrA, radarrB) => {
        return (
          radarrA.hostname === radarrB.hostname &&
          radarrA.port === radarrB.port &&
          radarrA.baseUrl === radarrB.baseUrl
        );
      });

      for (const server of this.servers) {
        this.currentServer = server;
        if (server.syncEnabled) {
          this.log(
            `Beginning to process Radarr server: ${server.name}`,
            'info'
          );

          this.radarrApi = new RadarrAPI({
            apiKey: server.apiKey,
            url: RadarrAPI.buildUrl(server, '/api/v3'),
          });

          this.items = await this.radarrApi.getMovies();

          const server4k =
            this.enable4kMovie && server.is4k && !(server.is3d ?? false);
          const server3d =
            this.enable3dMovie && (server.is3d ?? false) && !server.is4k;
          if (server4k) {
            this.didScan4k = true;
          } else if (server3d) {
            this.didScan3d = true;
          } else {
            this.didScanStandard = true;
          }

          if (this.items.length === 0) {
            if (server4k) {
              this.server4kReturnedEmpty = true;
            } else if (server3d) {
              this.server3dReturnedEmpty = true;
            } else {
              this.serverReturnedEmpty = true;
            }
            this.log(
              `Radarr server ${server.name} returned no movies. Orphan cleanup for this profile type will be skipped.`,
              'warn'
            );
          }

          await this.loop(this.processRadarrMovie.bind(this), { sessionId });
        } else {
          this.log(`Sync not enabled. Skipping Radarr server: ${server.name}`);
        }
      }

      const allStandardScanned = this.servers
        .filter((s) => !s.is4k && !(s.is3d ?? false))
        .every((s) => s.syncEnabled);
      const all4kScanned = this.servers
        .filter((s) => this.enable4kMovie && s.is4k && !(s.is3d ?? false))
        .every((s) => s.syncEnabled);
      const all3dScanned = this.servers
        .filter((s) => this.enable3dMovie && (s.is3d ?? false) && !s.is4k)
        .every((s) => s.syncEnabled);

      if (!allStandardScanned) {
        this.didScanStandard = false;
      }
      if (!all4kScanned) {
        this.didScan4k = false;
      }
      if (!all3dScanned) {
        this.didScan3d = false;
      }

      if (this.serverReturnedEmpty) {
        this.didScanStandard = false;
      }
      if (this.server4kReturnedEmpty) {
        this.didScan4k = false;
      }
      if (this.server3dReturnedEmpty) {
        this.didScan3d = false;
      }

      await this.cleanupOrphanedMovies();
      this.log('Radarr scan complete', 'info');
    } catch (e) {
      this.log('Scan interrupted', 'error', { errorMessage: e.message });
    } finally {
      this.endRun(sessionId);
    }
  }

  private async processRadarrMovie(radarrMovie: RadarrMovie): Promise<void> {
    const server4k =
      this.enable4kMovie &&
      this.currentServer.is4k &&
      !(this.currentServer.is3d ?? false);
    const server3d =
      this.enable3dMovie &&
      (this.currentServer.is3d ?? false) &&
      !this.currentServer.is4k;
    if (server4k) {
      this.scanned4kTmdbIds.add(radarrMovie.tmdbId);
    } else if (server3d) {
      this.scanned3dTmdbIds.add(radarrMovie.tmdbId);
    } else {
      this.scannedTmdbIds.add(radarrMovie.tmdbId);
    }

    try {
      await this.processMovie(radarrMovie.tmdbId, {
        is4k: server4k,
        is3d: server3d,
        serviceId: this.currentServer.id,
        externalServiceId: radarrMovie.id,
        externalServiceSlug: radarrMovie.titleSlug,
        title: radarrMovie.title,
        processing: !radarrMovie.hasFile && radarrMovie.monitored,
        hasFile: radarrMovie.hasFile,
      });
    } catch (e) {
      this.log('Failed to process Radarr media', 'error', {
        errorMessage: e.message,
        title: radarrMovie.title,
      });
    }
  }

  private async cleanupOrphanedMovies(): Promise<void> {
    const mediaRepository = getRepository(Media);

    if (this.didScanStandard) {
      const processingMovies = await mediaRepository.find({
        where: { mediaType: MediaType.MOVIE, status: MediaStatus.PROCESSING },
        relations: { requests: true },
      });

      for (const media of processingMovies) {
        if (media.tmdbId != null && !this.scannedTmdbIds.has(media.tmdbId)) {
          media.status = MediaStatus.UNKNOWN;
          await mediaRepository.save(media);
          await this.declineOrphanedRequests(media, false);
          this.log(
            `Movie ${media.tmdbId} not found in any Radarr server. Status reset to UNKNOWN.`,
            'info'
          );
        }
      }
    } else {
      this.log(
        'Skipping orphaned movie cleanup: no standard Radarr servers were scanned.',
        'info'
      );
    }

    if (this.didScan4k) {
      const processing4kMovies = await mediaRepository.find({
        where: {
          mediaType: MediaType.MOVIE,
          status4k: MediaStatus.PROCESSING,
        },
        relations: { requests: true },
      });

      for (const media of processing4kMovies) {
        if (media.tmdbId != null && !this.scanned4kTmdbIds.has(media.tmdbId)) {
          media.status4k = MediaStatus.UNKNOWN;
          await mediaRepository.save(media);
          await this.declineOrphanedRequests(media, true);
          this.log(
            `Movie ${media.tmdbId} not found in any 4K Radarr server. 4K status reset to UNKNOWN.`,
            'info'
          );
        }
      }
    } else if (this.enable4kMovie) {
      this.log(
        'Skipping orphaned 4K movie cleanup: no 4K Radarr servers were scanned.',
        'info'
      );
    }

    if (this.didScan3d) {
      const processing3dMovies = await mediaRepository.find({
        where: {
          mediaType: MediaType.MOVIE,
          status3d: MediaStatus.PROCESSING,
        },
      });

      for (const media of processing3dMovies) {
        if (media.tmdbId != null && !this.scanned3dTmdbIds.has(media.tmdbId)) {
          media.status3d = MediaStatus.UNKNOWN;
          await mediaRepository.save(media);
          this.log(
            `Movie ${media.tmdbId} not found in any 3D Radarr server. 3D status reset to UNKNOWN.`,
            'info'
          );
        }
      }
    } else if (this.enable3dMovie) {
      this.log(
        'Skipping orphaned 3D movie cleanup: no 3D Radarr servers were scanned.',
        'info'
      );
    }
  }
}

export const radarrScanner = new RadarrScanner();
