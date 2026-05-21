import type { ReadarrSettings } from '@server/lib/settings';

/** Resolve the Readarr instance for ebooks (isAudiobook false) or audiobooks (true). */
export const getReadarrServer = (
  readarrServers: ReadarrSettings[],
  isAudiobook: boolean
): ReadarrSettings | undefined =>
  readarrServers.find(
    (s) => (s.isAudiobook ?? false) === isAudiobook && s.isDefault
  ) ?? readarrServers.find((s) => (s.isAudiobook ?? false) === isAudiobook);
