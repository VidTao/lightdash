-- @block_type: explore
-- @model_type: table
-- Slack Payment Delivery model from bratrax-without-flattening.2.slack_payment_delivery
{{ config(
    materialized = 'view',
    alias = 'slack_payment_allocation_view'
) }}

SELECT
    client_id,
    payment_delivery_id,
    payment_id,
    allocation_id,
    amount,
    created_at,
    created_by
FROM {{ source('production_tables_no_flat', 'slack_payment_allocation') }}

