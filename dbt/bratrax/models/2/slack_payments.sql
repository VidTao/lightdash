-- @block_type: explore
-- @model_type: table
-- Slack Payments model from bratrax-without-flattening.2.slack_payments
{{ config(
    materialized = 'view',
    alias = 'slack_payments_view'
) }}

SELECT
    client_id,
    bid,
    buyer_id,
    payment_id,
    payment_date,
    gross_amount,
    payment_type,
    fee_percent,
    fee_amount,
    net_amount,
    payment_method,
    invoice_number,
    subscription_start_date,
    subscription_end_date,
    created_at,
    created_by
FROM {{ source('production_tables_no_flat', 'slack_payments') }}

