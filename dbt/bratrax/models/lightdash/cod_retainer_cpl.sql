
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
WITH last_payment_dates AS (
  SELECT
    BID,
    buyer_name,
    MAX(CASE WHEN payment_gross_amount IS NOT NULL THEN date END) AS last_payment_date
  FROM `bratrax-without-flattening.production_tables.cod_retainer_view`
  WHERE client_id = '95d31546-a5e4-47a8-bc89-741538113978'
  GROUP BY BID, buyer_name
),

campaign_metrics AS (
  SELECT
    cr.buyer_name,
    cr.campaign_name,
    cr.BID,
    cr.platform,
    -- Last 7 Days
    SUM(CASE WHEN DATE_DIFF(CURRENT_DATE(), cr.date, DAY) <= 7 THEN cr.leads ELSE 0 END) AS leads_last_7_days,
    SUM(CASE WHEN DATE_DIFF(CURRENT_DATE(), cr.date, DAY) <= 7 THEN cr.spend ELSE 0 END) AS adspend_last_7_days,
    -- Last 30 Days
    SUM(CASE WHEN DATE_DIFF(CURRENT_DATE(), cr.date, DAY) <= 30 THEN cr.leads ELSE 0 END) AS leads_last_30_days,
    SUM(CASE WHEN DATE_DIFF(CURRENT_DATE(), cr.date, DAY) <= 30 THEN cr.spend ELSE 0 END) AS adspend_last_30_days,
    -- All Time
    SUM(cr.leads) AS leads_all_time,
    SUM(cr.spend) AS adspend_all_time,
    -- Since Last Payment
    SUM(CASE WHEN cr.date >= COALESCE(lpd.last_payment_date, '1970-01-01') THEN cr.leads ELSE 0 END) AS leads_since_last_payment,
    SUM(CASE WHEN cr.date >= COALESCE(lpd.last_payment_date, '1970-01-01') THEN cr.spend ELSE 0 END) AS adspend_since_last_payment
  FROM `bratrax-without-flattening.production_tables.cod_retainer_view` cr
  LEFT JOIN last_payment_dates lpd
    ON cr.BID = lpd.BID
    AND cr.buyer_name = lpd.buyer_name
  WHERE cr.client_id = '95d31546-a5e4-47a8-bc89-741538113978'
  GROUP BY cr.buyer_name, cr.campaign_name, cr.BID, cr.platform
)

SELECT
  buyer_name,
  campaign_name,
  BID,
  platform,
  -- Last 7 Days
  leads_last_7_days,
  adspend_last_7_days,
  SAFE_DIVIDE(adspend_last_7_days, NULLIF(leads_last_7_days, 0)) AS cpl_last_7_days,
  -- Last 30 Days
  leads_last_30_days,
  adspend_last_30_days,
  SAFE_DIVIDE(adspend_last_30_days, NULLIF(leads_last_30_days, 0)) AS cpl_last_30_days,
 -- Since Last Payment
  leads_since_last_payment,
  adspend_since_last_payment,
  SAFE_DIVIDE(adspend_since_last_payment, NULLIF(leads_since_last_payment, 0)) AS cpl_since_last_payment,
  -- All Time
  leads_all_time,
  adspend_all_time,
  SAFE_DIVIDE(adspend_all_time, NULLIF(leads_all_time, 0)) AS cpl_all_time
 
FROM campaign_metrics
ORDER BY leads_all_time DESC
