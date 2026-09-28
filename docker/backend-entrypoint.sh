#!/bin/sh
set -e
cd /app/apps/backend
export PATH="/app/node_modules/.bin:/app/apps/backend/node_modules/.bin:${PATH}"
prisma migrate deploy
exec node dist/main.js
