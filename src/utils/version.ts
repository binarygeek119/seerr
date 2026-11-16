export const FORK_VERSION_SUFFIX = '+';

export const isDevelopVersion = (version: string): boolean =>
  version.startsWith('develop-');

export const formatVersionForDisplay = (version: string): string => {
  if (isDevelopVersion(version)) {
    return version.slice('develop-'.length);
  }

  return version;
};
