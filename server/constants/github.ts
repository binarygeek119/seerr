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

export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`;
export const GITHUB_COMMITS_DEVELOP_URL = `${GITHUB_REPO_URL}/commits/develop`;

export const GITHUB_CI_WORKFLOW_URL = `${GITHUB_REPO_URL}/actions/workflows/ci.yml`;
export const GITHUB_CI_BADGE_URL = `${GITHUB_CI_WORKFLOW_URL}/badge.svg?branch=develop`;

export const GITHUB_RELEASE_WORKFLOW_URL = `${GITHUB_REPO_URL}/actions/workflows/release.yml`;
export const GITHUB_RELEASE_BADGE_URL = `${GITHUB_RELEASE_WORKFLOW_URL}/badge.svg`;

export const githubCompareDevelopUrl = (commitTag: string): string =>
  `${GITHUB_REPO_URL}/compare/${commitTag}...develop`;

export const GITHUB_API_REPO_BASE = `/repos/${GITHUB_REPO_FULL}`;

export const githubRawDevelopUrl = (filePath: string): string =>
  `https://raw.githubusercontent.com/${GITHUB_REPO_FULL}/refs/heads/develop/${filePath}`;
