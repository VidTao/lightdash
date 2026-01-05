-- @block_type: explore
-- @model_type: table
-- Primal Queen Subscriptions - Subscription data for MRR tracking
{{ config(
    materialized = 'view',
    alias = 'pq_subscriptions_view'
) }}

SELECT
    subscription_id,
    customer_id,
    created_at,
    status,
    monthly_value,
    billing_interval,
    started_at,
    cancelled_at,
    pause_started_at,
    cancellation_reason,
    months_active,
    client_id
FROM {{ source('primal_queen', 'subscriptions') }}

