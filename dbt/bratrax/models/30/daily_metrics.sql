-- @block_type: explore
-- @model_type: table
-- Primal Queen Daily Metrics - North Star and 7 Input Metrics
{{ config(
    materialized = 'view',
    alias = 'pq_daily_metrics_view'
) }}

SELECT
    date,
    contribution_margin,
    contribution_margin_pct_change,
    revenue,
    gross_margin_pct,
    cac,
    ltv_cac_ratio,
    payback_months,
    mrr,
    churn_rate_pct,
    new_customers,
    returning_customers,
    total_orders,
    aov,
    ad_spend,
    cogs,
    fulfillment_cost,
    cac_domain,
    revenue_domain,
    revenue_bets,
    cac_bets,
    mrr_bets,
    churn_bets,
    client_id
FROM {{ source('primal_queen', 'daily_metrics') }}

