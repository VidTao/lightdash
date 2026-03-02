
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  


-- CAMPAIGN_DAILY_METRICS: Daily performance metrics by campaign
-- What this does:
-- 1. Aggregate Facebook hourly data to daily (core + actions tables)
-- 2. Extract leads from Facebook actions table (multiple action_types)
-- 3. Aggregate Google campaign performance to daily
-- 4. Convert Google cost_micros to dollars and cast campaign_id to STRING
-- 5. UNION Facebook + Google metrics
-- 6. Calculate CPL (cost per lead)
-- 7. Join to PLATFORM_CAMPAIGN to add client_id (universal join key)

WITH facebook_core AS (
    -- Facebook core metrics: spend, impressions, clicks
    -- No dedup needed — verified no duplicate rows across batches
    SELECT 
        campaign_id,
        date_start AS date,
        SUM(spend) AS spend,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks
    FROM `bratrax-without-flattening.cod.facebook_adsinsights_hourly_core`
    WHERE campaign_id IS NOT NULL
        AND date_start IS NOT NULL
    GROUP BY campaign_id, date_start
),
facebook_leads AS (
    -- Facebook leads from actions table
    -- No dedup needed — verified no duplicate rows across batches
    SELECT 
        campaign_id,
        date_start AS date,
        SUM(action_value) AS leads
    FROM `bratrax-without-flattening.cod.facebook_adsinsights_hourly_actions`
    WHERE campaign_id IS NOT NULL
        AND date_start IS NOT NULL
        AND action_type IN (
            'lead',
            'leadgen.other',
            'onsite_conversion.lead_grouped',
            'offsite_conversion.fb_pixel_lead'
        )
    GROUP BY campaign_id, date_start
),
facebook_metrics AS (
    SELECT 
        'facebook' AS channel,
        c.campaign_id,
        c.date,
        c.spend,
        c.impressions,
        c.clicks,
        COALESCE(l.leads, 0) AS leads
    FROM facebook_core c
    LEFT JOIN facebook_leads l 
        ON c.campaign_id = l.campaign_id 
        AND c.date = l.date
),
google_deduped AS (
    -- Google: DEDUP REQUIRED — 25 duplicate batches per row
    -- Keep latest processed_at per unique grain
    SELECT
        campaign_id, date, cost_micros, impressions, clicks, conversions
    FROM (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY campaign_id, date, hour, device, ad_network_type, click_type
                ORDER BY processed_at DESC
            ) AS rn
        FROM `bratrax-without-flattening.cod.google_campaign_performance_report`
        WHERE campaign_id IS NOT NULL
            AND date IS NOT NULL
    )
    WHERE rn = 1
),
google_metrics AS (
    SELECT 
        'google' AS channel,
        CAST(campaign_id AS STRING) AS campaign_id,
        date,
        SUM(cost_micros) / 1000000.0 AS spend,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(conversions) AS leads
    FROM google_deduped
    GROUP BY campaign_id, date
),
unified_metrics AS (
    SELECT 
        channel,
        campaign_id,
        date,
        spend,
        impressions,
        clicks,
        leads,
        CASE 
            WHEN leads > 0 THEN spend / leads
            ELSE NULL
        END AS cpl
    FROM (
        SELECT * FROM facebook_metrics
        UNION ALL
        SELECT * FROM google_metrics
    )
)
SELECT 
    pc.client_id,
    m.campaign_id,
    m.date,
    m.channel,
    m.spend,
    m.impressions,
    m.clicks,
    m.leads,
    m.cpl
FROM unified_metrics m
INNER JOIN `bratrax-without-flattening.cod.platform_campaigns` pc 
    ON m.campaign_id = pc.campaign_id