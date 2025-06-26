#!/bin/bash
set -e

# Install dependencies first
cd /usr/app
pnpm install --prod

# Run migrations using local knex
cd packages/backend
./node_modules/.bin/knex migrate:latest --knexfile dist/knexfile.js

# Run prod
exec "$@"
