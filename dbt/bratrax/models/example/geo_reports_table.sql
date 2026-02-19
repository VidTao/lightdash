-- @block_type: explore
-- @model_type: table
-- Geo reports model from bratrax.production_tables.geo_reports
{{ config(
    materialized = 'view',
    alias = 'geo_reports_table_view'
) }}

SELECT
    date,
    country,
    state,
    supplier_id,
    supplier_name,
    model_type,
    buyer_id,
    buyer_name,
    leadbyte_campaign,
    lead_status,
    facebook_spend,
    google_spend,
    total_spend,
    lead_count,
    revenue,
    gross_profit,
    client_id,
    last_processed_at
FROM {{ source('production_tables_bratrax', 'geo_reports') }}
