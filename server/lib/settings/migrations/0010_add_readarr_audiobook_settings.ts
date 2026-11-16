import type { AllSettings } from '@server/lib/settings';

const migration = async (settings: AllSettings): Promise<AllSettings> => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0010_add_readarr_audiobook_settings')
  ) {
    return settings;
  }

  if (Array.isArray(settings.readarr)) {
    settings.readarr = settings.readarr.map((server) => ({
      ...server,
      isAudiobook: server.isAudiobook ?? false,
      is4k: false,
    }));
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0010_add_readarr_audiobook_settings');

  return settings;
};

export default migration;
