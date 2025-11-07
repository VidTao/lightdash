-- @block_type: explore
-- @model_type: table
-- COD Leads model from bratrax-without-flattening.production_tables.cod_leads
{{ config(
    materialized = 'view',
    alias = 'cod_leads_view'
) }}

SELECT
    received_at_utc,
    date,
    lead_id,
    lead_email,
    lead_fullname,
    lead_phone,
    client_id,
    country,
    state,
    supplier_id,
    supplier_sid,
    supplier_name,
    buyer_id,
    buyer_bid,
    buyer_name,
    delivery_name,
    leadbyte_campaign,
    model_type,
    lead_status,
    lead_count,
    revenue,
    last_processed_at
FROM {{ source('production_tables_no_flat', 'cod_leads') }}