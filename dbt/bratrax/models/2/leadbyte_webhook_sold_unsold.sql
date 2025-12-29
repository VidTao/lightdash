-- @block_type: explore
-- @model_type: table
-- Leadbyte webhook sold/unsold lead tracking with supplier, buyer, campaign and delivery information
{{ config(
    materialized = 'view',
    alias = 'leadbyte_webhook_sold_unsold_view'
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
    supplier_status,
    supplier_commission,
    supplier_payout_type,
    buyer_id,
    buyer_bid,
    buyer_name,
    campaign_id,
    campaign_name,
    campaign_reference,
    campaign_currency,
    campaign_delivery_model,
    delivery_name,
    delivery_status,
    delivery_sent_at,
    delivery_request,
    revenue,
    record_type,
    callback_type,
    attribute_tag,
    processed_at,
    publish_time,
    processed_at_final
FROM {{ source('production_tables_no_flat', 'leadbyte_webhook_sold_unsold') }}

