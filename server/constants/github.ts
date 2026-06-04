// eslint-disable-next-line @typescript-eslint/no-require-imports
const { homepage, bugs } = require('../../package.json') as {
  homepage?: string;
  bugs?: { url?: string };
};

export const GITHUB_REPO_URL =
  homepage?.replace(/\/$/, '') ?? 'https://github.com/binarygeek119/seerr';

export const GITHUB_ISSUES_URL =
  bugs?.url ?? `${GITHUB_REPO_URL}/issues`;

export const GITHUB_REPO_FULL = GITHUB_REPO_URL.replace(
  'https://github.com/',
  ''
);

export const GITHUB_DISCUSSIONS_URL = `${GITHUB_REPO_URL}/discussions`;
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
export const GITHUB_COMMITS_DEVELOP_URL = `${GITHUB_REPO_URL}/commits/develop`;

export const githubCompareDevelopUrl = (commitTag: string): string =>
  `${GITHUB_REPO_URL}/compare/${commitTag}...develop`;

export const GITHUB_API_REPO_BASE = `/repos/${GITHUB_REPO_FULL}`;

export const githubRawDevelopUrl = (filePath: string): string =>
  `https://raw.githubusercontent.com/${GITHUB_REPO_FULL}/refs/heads/develop/${filePath}`;
