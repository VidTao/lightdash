-- Primal Queen Daily Metrics
-- Powers: Overview Tab - North Star + 7 Input Metrics
{{ config(
    materialized = 'view',
    alias = 'pq_daily_metrics'
) }}

SELECT
    date,

    -- North Star Metric
    contribution_margin,
    contribution_margin_pct_change,

    -- 7 Input Metrics
    revenue,
    gross_margin_pct,
    cac,
    ltv_cac_ratio,
    payback_months,
    mrr,
    churn_rate_pct,

    -- Supporting metrics
    new_customers,
    returning_customers,
    total_orders,
    aov,
    ad_spend,
    cogs,
    fulfillment_cost,

    -- Domain classifications
    cac_domain,
    revenue_domain,

    -- Active bets
    revenue_bets,
    cac_bets,
    mrr_bets,
    churn_bets,
    client_id

FROM {{ source('primal_queen', 'daily_metrics') }}
