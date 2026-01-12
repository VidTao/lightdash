-- @block_type: explore
-- @model_type: table
-- Slack Delivery model from bratrax-without-flattening.2.slack_delivery
{{ config(
    materialized = 'view',
    alias = 'slack_allocation_view'
) }}

SELECT
    client_id,
    bid,
    buyer_id,
    allocation_id,
    delivery_id,
    channel,
    geos,
    optional_tag,
    status,
    created_at,
    created_by,
    total_budget,
    total_spent,
    available
FROM {{ source('production_tables_no_flat', 'slack_allocation') }}

