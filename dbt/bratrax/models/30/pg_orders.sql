-- Primal Queen Orders
-- Powers: Transaction-level analysis
{{ config(
    materialized = 'view',
    alias = 'pq_orders'
) }}

SELECT
    order_id,
    customer_id,
    order_date,
    created_at,

    -- Revenue
    gross_revenue,
    net_revenue,
    discount_amount,
    refund_amount,

    -- Costs
    cogs,
    shipping_cost,
    payment_fees,

    -- Derived
    contribution_margin,

    -- Order type
    is_subscription,
    is_first_order,

    -- Products
    product_skus,
    product_names,

    -- Attribution
    channel,
    campaign,
    creative_id,
    utm_source,
    utm_medium,
    utm_campaign

FROM {{ source('primal_queen', 'orders') }}
