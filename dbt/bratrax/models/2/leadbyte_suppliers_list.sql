-- @block_type: explore
-- @model_type: table
-- Leadbyte suppliers list with account and contact information
{{ config(
    materialized = 'view',
    alias = 'leadbyte_suppliers_list_view'
) }}

SELECT
    client_id,
    ID,
    Name,
    SID,
    Created,
    `External ref_`,
    `External ref__2_`,
    `External ref__3_`,
    `External ref__4_`,
    `External ref__5_`,
    `Street 1`,
    `Street 2`,
    Town_city,
    County,
    Country,
    Postcode,
    `First name`,
    `Last name`,
    Email,
    `Account Manager`,
    Status,
    `Portal Access`,
    Signed,
    `Signed Timestamp`,
    `Signed Browser`,
    `Signed IP`,
    source,
    schema_version,
    batch_id,
    job_id,
    stream,
    metadata_timestamp,
    publish_time,
    processed_at
FROM {{ source('production_tables_no_flat', 'leadbyte_suppliers_list') }}

