-- @block_type: explore
-- @model_type: table
-- Geo reports model from bratrax-without-flattening.production_tables.geo_report


SELECT
    date,
    country,
    state,
    account_id,
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
FROM `bratrax-without-flattening`.`production_tables`.`geo_report`