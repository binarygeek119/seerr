import type { AllSettings } from '@server/lib/settings';

const migration = async (settings: AllSettings): Promise<AllSettings> => {
  if (
    Array.isArray(settings.migrations) &&
    settings.migrations.includes('0009_add_readarr_book_settings')
  ) {
    return settings;
  }

  if (!Array.isArray(settings.readarr)) {
    settings.readarr = [];
  }

  settings.main.defaultQuotas = {
    ...settings.main.defaultQuotas,
    book: settings.main.defaultQuotas?.book ?? {},
  };

  if (!settings.jobs?.['readarr-scan']) {
    settings.jobs = {
      ...settings.jobs,
      'readarr-scan': {
        schedule: '0 45 4 * * *',
      },
    };
  }

  if (!Array.isArray(settings.migrations)) {
    settings.migrations = [];
  }
  settings.migrations.push('0009_add_readarr_book_settings');

  return settings;
};

export default migration;
