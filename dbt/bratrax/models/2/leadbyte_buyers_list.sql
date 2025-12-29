-- @block_type: explore
-- @model_type: table
-- Leadbyte buyers list with account and contact information
{{ config(
    materialized = 'view',
    alias = 'leadbyte_buyers_list_view'
) }}

SELECT
    client_id,
    ID,
    Name,
    BID,
    Created,
    Balance,
    Street1,
    Street2,
    Town_city,
    County,
    Country,
    Postcode,
    First_name,
    Last_name,
    Email,
    Account_Manager,
    Status,
    source,
    schema_version,
    batch_id,
    job_id,
    stream,
    publish_time,
    processed_at
FROM {{ source('production_tables_no_flat', 'leadbyte_buyers_list') }}

