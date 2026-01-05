-- Primal Queen Subscriptions
-- Powers: MRR and churn tracking
{{ config(
    materialized = 'view',
    alias = 'pq_subscriptions'
) }}

SELECT
    subscription_id,
    customer_id,
    created_at,
    status,

    monthly_value,
    billing_interval,

    -- Lifecycle
    started_at,
    cancelled_at,
    pause_started_at,

    -- Churn tracking
    cancellation_reason,
    months_active,
    client_id

FROM {{ source('primal_queen', 'subscriptions') }}
