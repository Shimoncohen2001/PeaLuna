#!/bin/sh
set -eu
cd /app
echo "Applying database migrations..."
pnpm --filter @velure/database db:migrate
echo "Starting API..."
exec node apps/api/dist/main.js
