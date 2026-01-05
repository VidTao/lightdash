-- @block_type: explore
-- @model_type: table
-- Primal Queen Ad Spend - Channel-level advertising spend and performance
{{ config(
    materialized = 'view',
    alias = 'pq_ad_spend_view'
) }}

SELECT
    date,
    channel,
    spend,
    impressions,
    clicks,
    conversions,
    cpm,
    cpc,
    ctr,
    conversion_rate,
    roas,
    attributed_revenue,
    attributed_new_customers,
    client_id
FROM {{ source('primal_queen', 'ad_spend') }}

