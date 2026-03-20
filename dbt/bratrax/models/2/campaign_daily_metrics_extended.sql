
{{
  config(
    materialized='table',
    cluster_by=['client_id', 'date'],
    tags=['created-by-lightdash']
  )
}}
  
WITH campaign_leads_agg AS (
  SELECT 
    lead_date AS date,
    client_id,
    attributed_campaign_id AS campaign_id,
    COUNT(lead_id) AS leads_total,
    COUNT(CASE WHEN in_sold_unsold = TRUE AND revenue > 0 THEN 1 END) AS leads_sold,
    COUNT(CASE WHEN in_sold_unsold = TRUE AND revenue = 0 THEN 1 END) AS leads_retainer_absorbed,
    COUNT(CASE WHEN in_valid_invalid = TRUE AND in_sold_unsold = FALSE THEN 1 END) AS leads_invalid,
    SUM(revenue) AS lead_revenue,
    buyer_bid,
    buyer_name,
    delivery_name
  FROM `bratrax-without-flattening`.`cod`.`vw_lead_attribution_complete`
  WHERE final_attribution_status IN ('matched_to_campaign', 'attributed_no_campaign_match')
    AND attributed_campaign_id IS NOT NULL
  GROUP BY 1, 2, 3, buyer_bid, buyer_name, delivery_name
)

SELECT 
  cdm.date,
  cdm.client_id,
  cdm.campaign_id,
  pc.campaign_name,
  pc.channel AS platform,
  pc.allocation_id,
  pc.status AS campaign_status,
  pc.campaign_type,

  -- Buyer info
  cla.buyer_bid,
  cla.buyer_name,
  cla.delivery_name,

  -- Ad platform metrics
  cdm.spend AS daily_spend,
  cdm.impressions,
  cdm.clicks,
  cdm.leads AS platform_reported_leads,

  -- Leadbyte-attributed lead metrics
  COALESCE(cla.leads_total, 0) AS leads_total,
  COALESCE(cla.leads_sold, 0) AS leads_sold,
  COALESCE(cla.leads_retainer_absorbed, 0) AS leads_retainer_absorbed,
  COALESCE(cla.leads_invalid, 0) AS leads_invalid,
  COALESCE(cla.lead_revenue, 0.0) AS lead_revenue

FROM `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` cdm

LEFT JOIN `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
  ON cdm.campaign_id = pc.campaign_id
  AND cdm.client_id = pc.client_id

LEFT JOIN campaign_leads_agg cla
  ON cdm.campaign_id = cla.campaign_id
  AND cdm.date = cla.date
  AND cdm.client_id = cla.client_id

WHERE cdm.date >= '2026-02-01'