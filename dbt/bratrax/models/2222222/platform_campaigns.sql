-- @block_type: explore
-- @model_type: table
-- Platform Campaigns - Campaign configuration and budget management
{{ config(
    materialized = 'view',
    alias = 'platform_campaigns_view'
) }}

SELECT
    client_id,
    campaign_id,
    allocation_id,
    bid,
    channel,
    account_id,
    campaign_name,
    campaign_type,
    daily_budget,
    status,
    created_at,
    lifetime_budget,
    campaign_limit,
    total_spend
FROM {{ source('production_tables_no_flat', 'platform_campaigns') }}

