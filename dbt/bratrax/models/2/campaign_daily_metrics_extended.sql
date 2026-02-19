
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
WITH campaign_leads_agg AS (
  SELECT 
    lead_date as date,
    client_id,
    attributed_campaign_id as campaign_id,
    COUNT(lead_id) as leads_total,
    COUNT(CASE WHEN in_sold_unsold = TRUE AND revenue > 0 THEN 1 END) as leads_sold,
    COUNT(CASE WHEN in_sold_unsold = TRUE AND revenue = 0 THEN 1 END) as leads_retainer_absorbed,
    COUNT(CASE WHEN in_valid_invalid = TRUE AND in_sold_unsold = FALSE THEN 1 END) as leads_invalid,
    SUM(revenue) as lead_revenue,
    -- Preserve buyer info as arrays for reference without causing multiplication
    ARRAY_AGG(DISTINCT buyer_bid IGNORE NULLS) as buyer_bids,
    ARRAY_AGG(DISTINCT buyer_name IGNORE NULLS) as buyer_names,
    ARRAY_AGG(DISTINCT delivery_name IGNORE NULLS) as delivery_names
  FROM `bratrax-without-flattening.cod.vw_lead_attribution_complete`
  WHERE final_attribution_status IN ('matched_to_campaign', 'attributed_no_campaign_match')
    AND attributed_campaign_id IS NOT NULL
  GROUP BY 1, 2, 3
)

SELECT 
  cdm.date,
  cdm.client_id,
  cdm.campaign_id,
  pc.campaign_name,
  pc.channel as platform,
  pc.allocation_id,
  pc.status as campaign_status,
  pc.campaign_type,
  
  -- Buyer info as arrays (for reference, won't multiply rows)
  cla.buyer_bids,
  cla.buyer_names,
  cla.delivery_names,
  
  -- Metrics - now correctly 1:1
  cdm.spend as daily_spend,
  cdm.impressions,
  cdm.clicks,
  cdm.leads as platform_reported_leads,
  
  -- Lead metrics
  COALESCE(cla.leads_total, 0) as leads_total,
  COALESCE(cla.leads_sold, 0) as leads_sold,
  COALESCE(cla.leads_retainer_absorbed, 0) as leads_retainer_absorbed,
  COALESCE(cla.leads_invalid, 0) as leads_invalid,
  COALESCE(cla.lead_revenue, 0) as lead_revenue

FROM `bratrax-without-flattening.cod.campaign_daily_metrics` cdm

LEFT JOIN `bratrax-without-flattening.cod.platform_campaigns` pc
  ON cdm.campaign_id = pc.campaign_id
  AND cdm.client_id = pc.client_id

LEFT JOIN campaign_leads_agg cla
  ON cdm.campaign_id = cla.campaign_id
  AND cdm.date = cla.date
  AND cdm.client_id = cla.client_id