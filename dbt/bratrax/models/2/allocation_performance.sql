
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
    -- Primary Keys / Dimensions
    alloc.client_id,    
    alloc.allocation_id,
    alloc.buyer_id,
    alloc.bid,
    
    -- Client Info (static)
    c.company_name,
    alloc.geos AS state,
    alloc.channel,
    CASE 
        WHEN active_camp.allocation_id IS NOT NULL THEN 'active'
        ELSE 'inactive'
    END AS status,
    
    -- Allocation Type & Payment Info (from most recent payment)
    alloc_type.allocation_type,
    alloc_type.last_payment_date,
    alloc_type.active_budget,
    
    -- Static Budget Metrics (use MAX in LightDash)
    COALESCE(budget.lifetime_budget, 0) AS lifetime_budget,
    active_camp.campaign_limit,
    COALESCE(total_spend.maximum_spent, 0) AS maximum_spent,
    
    -- Date Dimension (for filtering)
    daily.date,
    
    -- Daily Metrics (use SUM in LightDash)
    COALESCE(daily.spend, 0) AS spend,
    COALESCE(daily.impressions, 0) AS impressions,
    COALESCE(daily.clicks, 0) AS clicks,
    COALESCE(daily.leads, 0) AS leads

FROM (
    SELECT DISTINCT
        allocation_id,
        client_id,
        buyer_id,
        bid,
        geos,
        channel
    FROM `bratrax-without-flattening`.`cod`.`slack_allocation`
) alloc

-- Client info
LEFT JOIN `bratrax-without-flattening`.`cod`.`clients` c 
    ON alloc.buyer_id = c.buyer_id 
    AND alloc.bid = c.bid

-- Allocation type + last payment info (ROW_NUMBER guarantees 1 row)
LEFT JOIN (
    SELECT 
        allocation_id,
        allocation_type,
        last_payment_date,
        active_budget
    FROM (
        SELECT 
            pa.allocation_id,
            p.payment_type AS allocation_type,
            p.payment_date AS last_payment_date,
            pa.amount AS active_budget,
            ROW_NUMBER() OVER (
                PARTITION BY pa.allocation_id 
                ORDER BY p.payment_date DESC, pa.created_at DESC
            ) AS rn
        FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa
        INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p
            ON pa.payment_id = p.payment_id
    )
    WHERE rn = 1
) alloc_type 
    ON alloc.allocation_id = alloc_type.allocation_id

-- Lifetime budget (sum of all payment allocations)
LEFT JOIN (
    SELECT 
        allocation_id, 
        SUM(amount) AS lifetime_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation`
    GROUP BY allocation_id
) budget 
    ON alloc.allocation_id = budget.allocation_id

-- Campaign limit (from ACTIVE campaign only)
LEFT JOIN (
    SELECT 
        allocation_id, 
        MAX(campaign_limit)+10 AS campaign_limit
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns`
    WHERE LOWER(status) = 'active'
    GROUP BY allocation_id
) active_camp 
    ON alloc.allocation_id = active_camp.allocation_id

-- Maximum spent (all-time total across ALL campaigns for this allocation)
LEFT JOIN (
    SELECT 
        pc.allocation_id, 
        SUM(dm.spend) AS maximum_spent
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
    INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm 
        ON pc.campaign_id = dm.campaign_id
    GROUP BY pc.allocation_id
) total_spend 
    ON alloc.allocation_id = total_spend.allocation_id

-- Daily metrics (aggregated across all campaigns per allocation per date)
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