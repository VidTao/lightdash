-- @block_type: explore
-- @model_type: table
-- Primal Queen Orders - Transaction-level order data
{{ config(
    materialized = 'view',
    alias = 'pq_orders_view'
) }}

SELECT
    order_id,
    customer_id,
    order_date,
    created_at,
    gross_revenue,
    net_revenue,
    discount_amount,
    refund_amount,
    cogs,
    shipping_cost,
    payment_fees,
    contribution_margin,
    is_subscription,
    is_first_order,
    product_skus,
    product_names,
    channel,
    campaign,
    creative_id,
    utm_source,
    utm_medium,
    utm_campaign,
    client_id
FROM {{ source('primal_queen', 'orders') }}

