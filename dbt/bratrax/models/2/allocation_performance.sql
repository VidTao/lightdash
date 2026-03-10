
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
    s.client_id,
    s.allocation_id,
    s.buyer_id,
    s.bid,
    c.company_name,
    s.geos AS state,
    s.channel,
    s.status,
    s.allocation_type,
    s.last_payment_date,
    s.active_budget,
    s.lifetime_budget,
    s.campaign_limit,
    s.maximum_spent,
    d.date,
    COALESCE(d.spend, 0) AS spend,
    COALESCE(d.impressions, 0) AS impressions,
    COALESCE(d.clicks, 0) AS clicks,
    COALESCE(d.leads, 0) AS leads
FROM `bratrax-without-flattening`.`cod`.`allocation_summary` s
LEFT JOIN `bratrax-without-flattening`.`cod`.`clients` c
    ON s.buyer_id = c.buyer_id
    AND s.bid = c.bid
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
) d ON s.allocation_id = d.allocation_id