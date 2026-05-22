#!/bin/sh
set -e

CONFIG_DIR="${CONFIG_DIRECTORY:-/app/config}"

# Avoid EMFILE when file logging is enabled (LOG_TO_FILE=true).
ulimit -n 65536 2>/dev/null || ulimit -n 4096 2>/dev/null || true

mkdir -p "${CONFIG_DIR}/db" "${CONFIG_DIR}/logs" "${CONFIG_DIR}/cache/images"

if [ ! -f "${CONFIG_DIR}/DOCKER" ]; then
  touch "${CONFIG_DIR}/DOCKER"
fi

# Host bind mounts often arrive as root-owned; the app runs as node (uid 1000).
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "${CONFIG_DIR}"
  exec su-exec node:node "$@"
fi

exec "$@"
