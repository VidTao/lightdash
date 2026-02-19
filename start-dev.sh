#!/bin/bash
# Start Lightdash dev with local DB and MCP enabled
set -a
source .env.development
set +a

export PGHOST=localhost
export PGPORT=5433
export PGPASSWORD=password
export MCP_ENABLED=true
export BRATRAX_API_URL=http://localhost:8081
export SITE_URL=http://localhost:8080
export FE_PORT=3002

exec pnpm dev
