#!/bin/sh
set -e

PROFILES_DIR="/opt/dbt/profiles"
PROJECT_DIR="/opt/dbt/bratrax"
TARGET="dev"
LOG_PREFIX="[dbt-cron $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

echo "$LOG_PREFIX Starting dbt refresh..."

# Incremental refresh of campaign_daily_metrics (7-day merge)
echo "$LOG_PREFIX Running campaign_daily_metrics (incremental)..."
dbt run --select campaign_daily_metrics \
  --profiles-dir "$PROFILES_DIR" \
  --project-dir "$PROJECT_DIR" \
  --target "$TARGET" \
  --profile bratrax

echo "$LOG_PREFIX Done. Next run at 06:00 UTC tomorrow."
