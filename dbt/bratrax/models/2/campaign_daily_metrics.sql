
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
    -- Aggregate hourly data to daily by campaign
    SELECT 
        campaign_id,
        date_start as date,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks
    FROM `bratrax-without-flattening.cod.facebook_adsinsights_hourly_core`
    WHERE campaign_id IS NOT NULL
        AND date_start IS NOT NULL
    GROUP BY campaign_id, date_start
),

facebook_leads AS (
    -- Facebook leads from actions table
    -- Filter for lead-specific action types and aggregate to daily
    SELECT 
        campaign_id,
        date_start as date,
        SUM(action_value) as leads
    FROM `bratrax-without-flattening.cod.facebook_adsinsights_hourly_actions`
    WHERE campaign_id IS NOT NULL
        AND date_start IS NOT NULL
        AND action_type IN (
            'lead',                              -- Aggregated leads (all sources)
            'leadgen.other',                     -- Facebook Lead Ads forms
            'onsite_conversion.lead_grouped',    -- On-platform lead conversions
            'offsite_conversion.fb_pixel_lead'   -- Website pixel-tracked leads
        )
    GROUP BY campaign_id, date_start
),

facebook_metrics AS (
    -- Join Facebook core metrics with leads
    -- Use LEFT JOIN to keep days with spend but no leads
    SELECT 
        'facebook' as channel,
        c.campaign_id,
        c.date,
        c.spend,
        c.impressions,
        c.clicks,
        COALESCE(l.leads, 0) as leads
    FROM facebook_core c
    LEFT JOIN facebook_leads l 
        ON c.campaign_id = l.campaign_id 
        AND c.date = l.date
),

google_metrics AS (
    -- Google metrics: all in one table
    -- Aggregate to daily by campaign and convert micros to dollars
    SELECT 
        'google' as channel,
        CAST(campaign_id AS STRING) as campaign_id,
        date,
        SUM(cost_micros) / 1000000.0 as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as leads
    FROM `bratrax-without-flattening.cod.google_campaign_performance_report`
    WHERE campaign_id IS NOT NULL
        AND date IS NOT NULL
    GROUP BY campaign_id, date
),

unified_metrics AS (
    -- Combine Facebook and Google metrics
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
        END as cpl
    FROM (
        SELECT * FROM facebook_metrics
        UNION ALL
        SELECT * FROM google_metrics
    )
)

-- Final select: add client_id from PLATFORM_CAMPAIGN
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
    ON m.campaign_id = pc.campaign_id;
