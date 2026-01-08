-- @block_type: explore
-- @model_type: table
-- Campaign Daily Metrics - Daily performance metrics by campaign
{{ config(
    materialized = 'view',
    alias = 'campaign_daily_metrics_view'
) }}

SELECT
    client_id,
    campaign_id,
    date,
    channel,
    spend,
    impressions,
    clicks,
    leads,
    cpl
FROM {{ source('production_tables_no_flat', 'campaign_daily_metrics') }}

