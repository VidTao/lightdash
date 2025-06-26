#!/bin/bash
set -e

# Install production dependencies only
cd /usr/app
pnpm install --prod --frozen-lockfile

# Run migrations using local knex (dist should already exist from prod-builder stage)
cd packages/backend
./node_modules/.bin/knex migrate:latest --knexfile dist/knexfile.js

# Run prod
exec "$@"
