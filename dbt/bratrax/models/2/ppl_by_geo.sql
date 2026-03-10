
{{
  config(
    materialized='table',
    cluster_by=['state_code', 'date'],
    tags=['created-by-lightdash']
  )
}}
  
SELECT 
  COALESCE(s.date, l.date) AS date,
  COALESCE(s.state_code, l.state_code) AS state_code,
  COALESCE(s.state_name, l.state_name) AS state_name,
  COALESCE(s.spend, 0) AS spend,
  COALESCE(l.leads, 0) AS leads,
  COALESCE(l.revenue, 0) AS revenue
FROM (
  -- Combined PPL spend by date + state
  SELECT 
    date,
    state_code,
    state_name,
    SUM(spend) AS spend
  FROM (
    -- Facebook PPL spend
    SELECT 
      fb.date_start AS date,
      COALESCE(sm.state_code, 'UNMAPPED') AS state_code,
      COALESCE(sm.state_name, 'Unmapped Spend') AS state_name,
      fb.spend
    FROM (
      SELECT 
        campaign_id,
        date_start,
        region,
        SUM(spend) AS spend
      FROM `bratrax-without-flattening.cod.facebook_adsinsights_geo`
      GROUP BY campaign_id, date_start, region
    ) fb
    LEFT JOIN `bratrax-without-flattening.cod.ref_state_mapping` sm
      ON fb.region = sm.state_raw
    INNER JOIN `bratrax-without-flattening.cod.platform_campaigns` pc
      ON fb.campaign_id = pc.campaign_id
    WHERE pc.campaign_type = 'ppl'
    
    UNION ALL
    
    -- Google PPL spend
    SELECT 
      g.date AS date,
      COALESCE(sm.state_code, 'UNMAPPED') AS state_code,
      COALESCE(sm.state_name, 'Unmapped Spend') AS state_name,
      g.spend
    FROM (
      SELECT 
        campaign_id,
        date,
        geo_target_region,
        SUM(cost_micros) / 1000000.0 AS spend
      FROM `bratrax-without-flattening.cod.google_geo_performance_report`
      GROUP BY campaign_id, date, geo_target_region
    ) g
    LEFT JOIN `bratrax-without-flattening.cod.ref_state_mapping` sm
      ON g.geo_target_region = sm.state_raw
    INNER JOIN `bratrax-without-flattening.cod.platform_campaigns` pc
      ON CAST(g.campaign_id AS STRING) = pc.campaign_id
    WHERE pc.campaign_type = 'ppl'
  ) combined
  GROUP BY date, state_code, state_name
) s
FULL OUTER JOIN (
  -- PPL leads by date + state
  SELECT 
    date,
    state_code,
    state_name,
    COUNT(*) AS leads,
    SUM(revenue) AS revenue
  FROM `bratrax-without-flattening.cod.leadbyte_leads_extended`
  WHERE is_sold = TRUE
    AND revenue > 0
  GROUP BY date, state_code, state_name
) l ON s.date = l.date AND s.state_code = l.state_code
ORDER BY date DESC, state_code