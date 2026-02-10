
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
WITH campaign_leads AS (
  SELECT 
    lead_date as date,
    client_id,
    attributed_campaign_id as campaign_id,
    COUNT(lead_id) as leads_total,
    COUNT(CASE WHEN in_sold_unsold = TRUE THEN 1 END) as leads_sold,
    COUNT(CASE WHEN in_valid_invalid = TRUE AND in_sold_unsold = FALSE THEN 1 END) as leads_invalid,
    SUM(revenue) as lead_revenue
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
  cdm.spend as daily_spend,
  cdm.impressions,
  cdm.clicks,
  cdm.leads as platform_reported_leads,
  COALESCE(cl.leads_total, 0) as leads_total,
  COALESCE(cl.leads_sold, 0) as leads_sold,
  COALESCE(cl.leads_invalid, 0) as leads_invalid,
  COALESCE(cl.lead_revenue, 0) as lead_revenue

FROM `bratrax-without-flattening.cod.campaign_daily_metrics` cdm
LEFT JOIN `bratrax-without-flattening.cod.platform_campaigns` pc
  ON cdm.campaign_id = pc.campaign_id
  AND cdm.client_id = pc.client_id
LEFT JOIN campaign_leads cl
  ON cdm.campaign_id = cl.campaign_id
  AND cdm.date = cl.date
  AND cdm.client_id = cl.client_id

WHERE cdm.date >= '2026-02-01'
