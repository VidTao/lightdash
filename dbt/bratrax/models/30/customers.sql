-- @block_type: explore
-- @model_type: table
-- Primal Queen Customers - Customer master data with lifetime metrics
{{ config(
    materialized = 'view',
    alias = 'pq_customers_view'
) }}

SELECT
    customer_id,
    email,
    first_name,
    last_name,
    created_at,
    first_order_date,
    is_subscriber,
    subscription_status,
    country_code,
    state_code,
    city,
    total_orders,
    total_revenue,
    ltv,
    acquisition_channel,
    acquisition_campaign,
    first_touch_source,
    client_id
FROM {{ source('primal_queen', 'customers') }}

