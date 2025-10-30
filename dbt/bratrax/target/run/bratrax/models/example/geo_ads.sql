

  create or replace view `bratrax-without-flattening`.`production_tables`.`geo_ads_view`
  OPTIONS()
  as -- @block_type: explore
-- @model_type: table
-- Geo ads model from bratrax-without-flattening.production_tables.geo_ads


SELECT
    client_id,
    platform,
    account_id,
    account_name,
    country,
    state,
    campaign_id,
    campaign_name,
    currency,
    event_date,
    processed_at,
    last_processed_at,
    cost,
    clicks,
    impressions,
    ctr,
    reach
FROM `bratrax-without-flattening`.`production_tables`.`geo_ads`;

