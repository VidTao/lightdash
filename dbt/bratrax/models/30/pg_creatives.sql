-- Primal Queen Creatives
-- Powers: Creative performance (Extremistan domain)
{{ config(
    materialized = 'view',
    alias = 'pq_creatives'
) }}

SELECT
    creative_id,
    creative_name,
    creative_type,
    channel,

    launched_at,

    -- Performance
    total_spend,
    total_conversions,
    total_revenue,

    cpa,
    roas,

    -- Status
    is_active,
    fatigue_score,
    days_active

FROM {{ source('demo', 'creatives') }}
