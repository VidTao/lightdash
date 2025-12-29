-- @block_type: explore
-- @model_type: table
-- Leadbyte webhook valid/invalid lead tracking with supplier and campaign information
{{ config(
    materialized = 'view',
    alias = 'leadbyte_webhook_valid_invalid_view'
) }}

SELECT
    client_id,
    lead_id,
    lead_email,
    lead_fullname,
    lead_phone,
    lead_source,
    lead_c1,
    lead_c2,
    lead_c3,
    lead_sid,
    lead_ssid,
    received_at_utc,
    date,
    country,
    state,
    supplier_id,
    supplier_sid,
    supplier_name,
    campaign_id,
    campaign_name,
    campaign_reference,
    lead_request,
    record_type,
    callback_type,
    attribute_tag,
    processed_at,
    publish_time,
    processed_at_final
FROM {{ source('production_tables_no_flat', 'leadbyte_webhook_valid_invalid') }}

