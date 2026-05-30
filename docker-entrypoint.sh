#!/bin/sh
set -e

CONFIG_DIR="${CONFIG_DIRECTORY:-/app/config}"

mkdir -p "${CONFIG_DIR}/db" "${CONFIG_DIR}/logs" "${CONFIG_DIR}/cache/images"

# Do not create ${CONFIG_DIR}/DOCKER here. That marker is baked into the image at
# build time and is hidden when /app/config is bind-mounted or uses a named volume.
# Seerr uses its absence to detect a properly configured persistent config path.

# Remove stale rotate symlinks/audit files from prior file-logging runs (can cause EBADF).
if [ "${LOG_TO_FILE}" != "true" ]; then
  rm -f "${CONFIG_DIR}/logs/seerr.log" "${CONFIG_DIR}/logs/.machinelogs.json" 2>/dev/null || true
  rm -f "${CONFIG_DIR}/logs/"*-audit.json "${CONFIG_DIR}/logs/."*-audit.json 2>/dev/null || true
fi

run_app() {
  # prlimit often fails on capped hosts (e.g. Unraid). Test before exec; always fall back to ulimit.
  if command -v prlimit >/dev/null 2>&1 && prlimit --nofile=65536:65536 true 2>/dev/null; then
    exec prlimit --nofile=65536:65536 "$@"
  fi

  ulimit -n 65536 2>/dev/null || ulimit -n 4096 2>/dev/null || ulimit -n 2048 2>/dev/null || true
  exec "$@"
}

# Host bind mounts often arrive as root-owned; the app runs as node (uid 1000).
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "${CONFIG_DIR}"
  run_app su-exec node:node "$@"
fi

run_app "$@"
