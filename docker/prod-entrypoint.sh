#!/bin/bash
set -e

# Install dependencies and build
cd /usr/app
pnpm install --prod
cd packages/backend
pnpm run build

# Run migrations using local knex after build
./node_modules/.bin/knex migrate:latest --knexfile dist/knexfile.js

# Run prod
exec "$@"
