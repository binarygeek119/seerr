import logger from '@server/logger';
import { existsSync } from 'fs';
import path from 'path';

const COMMIT_TAG_PATH = path.join(__dirname, '../../committag.json');
let commitTag = 'local';

if (existsSync(COMMIT_TAG_PATH)) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  commitTag = require(COMMIT_TAG_PATH).commitTag;
  logger.info(`Commit Tag: ${commitTag}`);
}

export const FORK_VERSION_SUFFIX = '+';

export const getCommitTag = (): string => {
  return commitTag;
};

export const isDevelopVersion = (version: string): boolean =>
  version.startsWith('develop-');

export const formatVersionForDisplay = (version: string): string => {
  if (isDevelopVersion(version)) {
    return version.slice('develop-'.length);
  }

  return version;
};

export const getAppVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version } = require('../../package.json');

  let finalVersion = version;

  if (version === '0.1.0') {
    finalVersion = `develop-${getCommitTag()}${FORK_VERSION_SUFFIX}`;
  }

  return finalVersion;
};
