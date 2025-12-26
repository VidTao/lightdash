-- @block_type: explore
-- @model_type: table
-- COD Campaigns Geo model from bratrax-without-flattening.production_tables.cod_campaigns_geo
{{ config(
    materialized = 'view',
    alias = 'cod_campaigns_geo_view'
) }}

SELECT
    client_id,
    platform,
    account_id,
    account_name,
    model_type,
    SID,
    supplier_name,
    BID,
    buyer_name,
    campaign_name,
    campaign_id,
    country,
    state,
    clicks,
    impressions,
    reach,
    cost,
    ctr,
    currency,
    campaign_total_daily_budget,
    event_date,
    processed_at,
    campaign_limit,
    campaign_status,
    last_processed_at,
    lead_conversions
FROM {{ source('production_tables_no_flat', 'cod_campaigns_geo') }}