-- Primal Queen Customers
-- Powers: Ontology Tab - Customer entities
{{ config(
    materialized = 'view',
    alias = 'pq_customers'
) }}

SELECT
    customer_id,
    email,
    first_name,
    last_name,
    created_at,
    first_order_date,

    -- Customer type
    is_subscriber,
    subscription_status,

    -- Location
    country_code,
    state_code,
    city,

    -- Lifetime metrics
    total_orders,
    total_revenue,
    ltv,

    -- Acquisition
    acquisition_channel,
    acquisition_campaign,
    first_touch_source

FROM {{ source('primal_queen', 'customers') }}
