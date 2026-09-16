#!/bin/sh
set -eu
cd /app

RUN_AS=""
if [ "$(id -u)" = "0" ]; then
  RUN_AS="su-exec pealuna:nodejs"
  # A freshly mounted volume belongs to root while the API runs as pealuna.
  if [ -n "${MEDIA_DIR:-}" ]; then
    mkdir -p "$MEDIA_DIR"
    chown pealuna:nodejs "$MEDIA_DIR"
  fi
fi

echo "Applying database migrations..."
$RUN_AS pnpm --filter @velure/database db:migrate
echo "Starting API..."
exec $RUN_AS node apps/api/dist/main.js
