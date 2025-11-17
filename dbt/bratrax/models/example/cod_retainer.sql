-- @block_type: explore
-- @model_type: table
-- COD Retainer model from bratrax-without-flattening.production_tables.cod_retainer
{{ config(
    materialized = 'view',
    alias = 'cod_retainer_view'
) }}

SELECT
    client_id,
    BID,
    buyer_name,
    now_date,
    payments_net_total_amount,
    payments_gross_total_amount,
    payments_processing_fee_total_amount,
    payments_fee_total_amount,
    payment_count,
    payments_net_latest_amount,
    payments_gross_latest_amount,
    payments_processing_fee_latest_amount,
    last_payment_date,
    spend_lifetime_amount,
    spend_lifetime_facebook_amount,
    spend_lifetime_google_amount,
    spend_since_latest_payment_amount,
    spend_since_latest_payment_facebook_amount,
    spend_since_latest_payment_google_amount,
    lead_count_lifetime,
    revenue_lifetime_amount,
    lead_count_since_latest_payment,
    revenue_since_latest_payment_amount,
    cpl_lifetime_amount,
    active_days,
    last_activity_date,
    campaign_platforms,
    active_campaigns,
    total_daily_budget_amount,
    remaining_budget_amount,
    last_processed_at
FROM {{ source('production_tables_no_flat', 'cod_retainer') }}