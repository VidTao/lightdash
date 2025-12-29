-- @block_type: explore
-- @model_type: table
-- Leadbyte deliveries list with campaign and buyer information
{{ config(
    materialized = 'view',
    alias = 'leadbyte_deliveries_list_view'
) }}

SELECT
    client_id,
    ID,
    Created,
    Reference,
    status,
    deliver_to,
    advanced_distribution_only,
    payload,
    buyer_id,
    buyer_name,
    buyer_reference,
    buyer_revenue,
    `Lead Buyer`,
    campaign_id,
    campaign_name,
    campaign_reference,
    Campaign,
    Country,
    Action,
    Method,
    A_R_T,
    Revenue,
    Credit,
    Cap,
    `Total Cap`,
    `Monthly Cap`,
    `Weekly Cap`,
    `Daily Cap`,
    `Hourly Cap`,
    rules,
    schedule,
    source,
    schema_version,
    batch_id,
    job_id,
    stream,
    metadata_timestamp,
    publish_time,
    processed_at
FROM {{ source('production_tables_no_flat', 'leadbyte_deliveries_list') }}

