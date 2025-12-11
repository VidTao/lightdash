-- @block_type: explore
-- @model_type: table
-- COD Retainer model from bratrax-without-flattening.production_tables.cod_retainer
{{ config(
    materialized = 'view',
    alias = 'cod_retainer_view'
) }}

SELECT
    client_id,
    date,
    buyer_name,
    BID,
    platform,
    account_id,
    campaign_name,
    state,
    payment_gross_amount,
    payment_adspend,
    spend,
    leads,
    campaign_budget,
    campaign_limit,
    campaign_status,
    last_processed_at
FROM {{ source('production_tables_no_flat', 'cod_retainer') }}