
{{
  config(
    tags=['created-by-lightdash']
  )
}}

-- ALLOCATION_PERFORMANCE: Allocation-level metrics with daily aggregations.
-- Simplified view that reads from pre-computed allocation_summary (table)
-- and campaign_daily_metrics (incremental table) instead of scanning
-- raw tables with 5+ inline subqueries.

SELECT
    -- From allocation_summary (materialized table)
    alloc.client_id,
    alloc.allocation_id,
    alloc.buyer_id,
    alloc.bid,

    -- Client Info
    c.company_name,
    alloc.geos AS state,
    alloc.channel,
    alloc.status,

    -- Allocation Type & Payment Info
    alloc.allocation_type,
    alloc.last_payment_date,
    alloc.active_budget,

    -- Static Budget Metrics (use MAX in LightDash)
    alloc.lifetime_budget,
    alloc.campaign_limit,
    alloc.maximum_spent,

    -- Date Dimension (for filtering)
    daily.date,

    -- Daily Metrics (use SUM in LightDash)
    COALESCE(daily.spend, 0) AS spend,
    COALESCE(daily.impressions, 0) AS impressions,
    COALESCE(daily.clicks, 0) AS clicks,
    COALESCE(daily.leads, 0) AS leads

FROM `bratrax-without-flattening`.`cod`.`allocation_summary` alloc

-- Client info (join on buyer_id AND bid)
LEFT JOIN `bratrax-without-flattening`.`cod`.`clients` c
    ON alloc.buyer_id = c.buyer_id
    AND alloc.bid = c.bid

-- Daily metrics aggregated across all campaigns per allocation per date
LEFT JOIN (
    SELECT
        pc.allocation_id,
        dm.date,
        SUM(dm.spend) AS spend,
        SUM(dm.impressions) AS impressions,
        SUM(dm.clicks) AS clicks,
        SUM(dm.leads) AS leads
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
    INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm
        ON pc.campaign_id = dm.campaign_id
    GROUP BY pc.allocation_id, dm.date
) daily
    ON alloc.allocation_id = daily.allocation_id
