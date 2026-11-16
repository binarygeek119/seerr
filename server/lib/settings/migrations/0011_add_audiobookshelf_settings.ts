import type { AllSettings } from '@server/lib/settings';

const migrationAddAudiobookshelfSettings = async (
  settings: AllSettings
): Promise<AllSettings> => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0011_add_audiobookshelf_settings')
  ) {
    return settings;
  }

  if (!settings.audiobookshelf) {
    settings.audiobookshelf = {
      hostname: '',
      port: 13378,
      useSsl: false,
      urlBase: '',
      apiKey: '',
      webAppUrl: '',
      libraries: [],
    };
  }

  if (!settings.jobs?.['audiobookshelf-scan']) {
    settings.jobs = {
      ...settings.jobs,
      'audiobookshelf-scan': {
        schedule: '0 15 4 * * *',
      },
    };
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0011_add_audiobookshelf_settings');

  return settings;
};

export default migrationAddAudiobookshelfSettings;
