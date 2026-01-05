-- Primal Queen Ad Spend
-- Powers: Channel performance analysis
{{ config(
    materialized = 'view',
    alias = 'pq_ad_spend'
) }}

SELECT
    date,
    channel,

    -- Spend
    spend,

    -- Volume
    impressions,
    clicks,
    conversions,

    -- Calculated metrics
    cpm,
    cpc,
    ctr,
    conversion_rate,
    roas,

    -- Attribution
    attributed_revenue,
    attributed_new_customers

FROM {{ source('demo', 'ad_spend') }}
