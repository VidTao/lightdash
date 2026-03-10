# dbt Materialization Strategy

## Problem

All models were materialized as **views** (default in `dbt_project.yml`). Every dashboard query recalculated them from scratch — joins, dedup, aggregations over raw tables — causing slow load times.

## Solution

Convert performance-critical models from views to **tables** or **incremental tables**, rebuilt on a cron schedule via `dbt-cron` (runs every 12 hours).

## Strategy

| Type | When to use | Example |
|------|-------------|---------|
| **`table`** | Dimension/lookup data, no clean time grain, any field can change retroactively | `platform_campaigns` |
| **`incremental`** | Time-series data with a date partition key, append-heavy, lookback merge | `campaign_daily_metrics` |
| **`view`** | Lightweight wrappers, rarely queried, or always need real-time data | (keep as default for non-critical models) |

## Converted Models

### `campaign_daily_metrics` — incremental
- **Date**: Pre-existing
- **Strategy**: `merge` with 7-day lookback
- **Partition**: `date` (day granularity)
- **Cluster**: `campaign_id`, `channel`
- **Why incremental**: Time-series daily metrics, append-heavy, date is natural partition key

### `platform_campaigns` — table
- **Date**: 2026-03-10
- **Cluster**: `client_id`, `channel`
- **Why table**: Dimension table — campaign metadata, budgets, statuses, lifetime spend. Any field can change retroactively (status, budget, spend totals). No clean incremental grain. Full rebuild is correct and simple.

### `ppl_by_geo` — table
- **Date**: 2026-03-10
- **Cluster**: `state_code`, `date`
- **Why table**: Geo aggregation joining Facebook/Google spend with Leadbyte leads via FULL OUTER JOIN. Depends on `platform_campaigns` for PPL filtering. Heavy query with multiple subqueries and joins — expensive as a view. No clean incremental grain (FULL OUTER JOIN on date+state makes partial updates unreliable).

## Remaining Models (still views)

To convert next, prioritized by query frequency and complexity:

- [ ] `campaign_daily_metrics_extended` — extends campaign_daily_metrics, likely good as table
- [ ] `allocation_performance` — aggregates across campaigns, good candidate for table
- [ ] `allocation_summary` — pre-aggregated allocation facts, good candidate for table
- [ ] `payments_allocations` — joins payments data, good candidate for table
- [ ] `clients` — client dimension table, good candidate for table
- [ ] `leadbyte_leads` — if heavily queried
- [ ] `leadbyte_buyers_list` — if heavily queried
- [ ] `leadbyte_deliveries_list` — if heavily queried
- [ ] `leadbyte_suppliers_list` — if heavily queried
- [ ] `leadbyte_webhook_sold_unsold` — if heavily queried
- [ ] `leadbyte_webhook_valid_invalid` — if heavily queried
- [ ] `slack_allocation` — if heavily queried
- [ ] `slack_payment_allocation` — if heavily queried
- [ ] `slack_payments` — if heavily queried
- [ ] `drasko_merge_test` — test model, skip

## dbt-cron Setup

- **Container**: `dbt-cron` service in `docker-compose.yml`
- **Schedule**: Every 12 hours (`sleep 43200`)
- **Command**: `dbt run` (all models — views are no-ops, tables get rebuilt, incrementals merge)
- **Config files**:
  - `docker/dbt-cron/Dockerfile` — container definition
  - `docker/dbt-cron/run_dbt.sh` — execution script
  - `dbt/bratrax/profiles_docker.yml` — BigQuery connection (mounted as profiles.yml)

## How to Add a New Table

1. Add config block to the model SQL:
   ```sql
   {{
     config(
       materialized='table',
       cluster_by=['<primary_filter_col>', '<secondary_filter_col>'],
       tags=['created-by-lightdash']
     )
   }}
   ```
2. No changes needed to `run_dbt.sh` — it runs all models
3. First run: `dbt run --select <model_name> --target dev` (or full `dbt run`)
4. Verify in BigQuery: model should appear as TABLE not VIEW
5. Update this file with the model entry
