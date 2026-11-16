import { accessSync, existsSync, readFileSync, statSync } from 'fs';
import fs from 'fs/promises';
import logger from '@server/logger';
import path from 'path';

const CONFIG_PATH = process.env.CONFIG_DIRECTORY
  ? process.env.CONFIG_DIRECTORY
  : path.join(__dirname, '../../config');

const DOCKER_PATH = `${CONFIG_PATH}/DOCKER`;

/** True when the config directory is on a separate mount (bind mount or named volume). */
const isConfigDirectoryMounted = (): boolean => {
  try {
    const configStat = statSync(CONFIG_PATH);
    const parentStat = statSync(path.dirname(CONFIG_PATH));
    return configStat.dev !== parentStat.dev;
  } catch {
    return false;
  }
};

/**
 * Returns true when app data is persisted (no setup warning).
 * The image ships with config/DOCKER; a volume mount at /app/config hides that file.
 */
export const appDataStatus = (): boolean => {
  if (!existsSync(DOCKER_PATH)) {
    return true;
  }

  // Older images created DOCKER on mounted volumes via entrypoint; still treat as OK.
  if (isConfigDirectoryMounted()) {
    return true;
  }

  return false;
};

export const appDataPath = (): string => {
  return CONFIG_PATH;
};

export const appDataPermissions = (): boolean => {
  try {
    accessSync(CONFIG_PATH);
    return true;
  } catch {
    return false;
  }
};

export const ensureAppDataDirectories = async (): Promise<void> => {
  await fs.mkdir(path.join(CONFIG_PATH, 'db'), { recursive: true });
  await fs.mkdir(path.join(CONFIG_PATH, 'logs'), { recursive: true });
  await fs.mkdir(path.join(CONFIG_PATH, 'cache', 'images'), { recursive: true });
};

export const logOpenFileLimit = (): void => {
  try {
    const limits = readFileSync('/proc/self/limits', 'utf8');
    const match = limits.match(/Max open files\s+\d+\s+\d+\s+(\d+)/);

    if (match && Number(match[1]) < 4096) {
      logger.warn(
        `Low open file limit (${match[1]}). Add Docker ulimits nofile=65536 (e.g. --ulimit nofile=65536:65536) to avoid EMFILE errors.`,
        { label: 'Server' }
      );
    }
  } catch {
    // Not Linux or /proc unavailable
  }
};
