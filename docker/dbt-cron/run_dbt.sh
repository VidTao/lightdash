#!/bin/sh
set -e

PROFILES_DIR="/opt/dbt/profiles"
PROJECT_DIR="/opt/dbt/bratrax"
TARGET="dev"
LOG_PREFIX="[dbt-cron $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "$LOG_PREFIX Starting dbt refresh (all models)..."

dbt run \
  --profiles-dir "$PROFILES_DIR" \
  --project-dir "$PROJECT_DIR" \
  --target "$TARGET" \
  --profile bratrax

echo "$LOG_PREFIX Done."
