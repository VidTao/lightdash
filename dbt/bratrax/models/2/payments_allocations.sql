
{{
  config(
    tags=['created-by-lightdash']
  )
}}

SELECT
    alloc.client_id,
    alloc.allocation_id,
    alloc.buyer_id,
    alloc.bid,
    c.company_name,
    alloc.geos AS state,
    alloc.channel,
    CASE 
        WHEN active_camp.allocation_id IS NOT NULL THEN 'active'
        ELSE 'inactive'
    END AS status,
    alloc_type.allocation_type,
    alloc_type.last_payment_date,
    alloc_type.active_budget,
    COALESCE(budget.lifetime_budget, 0) AS lifetime_budget,
    COALESCE(active_camp.campaign_limit, last_camp.campaign_limit) AS campaign_limit,
    COALESCE(active_camp.maximum_spent, last_camp.maximum_spent) AS maximum_spent,
    d.date,
    COALESCE(d.spend, 0) AS spend,
    COALESCE(d.impressions, 0) AS impressions,
    COALESCE(d.clicks, 0) AS clicks,
    COALESCE(d.leads, 0) AS leads

FROM (
    SELECT DISTINCT allocation_id, client_id, buyer_id, bid, geos, channel
    FROM `bratrax-without-flattening`.`cod`.`slack_allocation`
) alloc

LEFT JOIN `bratrax-without-flattening`.`cod`.`clients` c
    ON alloc.buyer_id = c.buyer_id AND alloc.bid = c.bid

LEFT JOIN (
    SELECT
        pa.allocation_id,
        p.payment_type AS allocation_type,
        p.payment_date AS last_payment_date,
        pa.amount AS active_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa
    INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p
        ON pa.payment_id = p.payment_id
    INNER JOIN (
        SELECT pa2.allocation_id, MAX(p2.payment_date) AS max_payment_date
        FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa2
        INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p2
            ON pa2.payment_id = p2.payment_id
        GROUP BY pa2.allocation_id
    ) latest
        ON pa.allocation_id = latest.allocation_id
        AND p.payment_date = latest.max_payment_date
) alloc_type ON alloc.allocation_id = alloc_type.allocation_id

LEFT JOIN (
    SELECT allocation_id, SUM(amount) AS lifetime_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation`
    GROUP BY allocation_id
) budget ON alloc.allocation_id = budget.allocation_id

LEFT JOIN (
    SELECT
        allocation_id,
        SUM(campaign_limit + 10) AS campaign_limit,
        SUM(campaign_spend) AS maximum_spent
    FROM (
        SELECT
            pc.allocation_id,
            pc.campaign_id,
            MAX(COALESCE(pc.campaign_limit, 0)) AS campaign_limit,
            SUM(dm.spend) AS campaign_spend
        FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
        INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm
            ON pc.campaign_id = dm.campaign_id
        WHERE LOWER(pc.status) = 'active'
        GROUP BY pc.allocation_id, pc.campaign_id
    )
    GROUP BY allocation_id
) active_camp ON alloc.allocation_id = active_camp.allocation_id

LEFT JOIN (
    SELECT allocation_id, campaign_limit, maximum_spent
    FROM (
        SELECT
            pc.allocation_id,
            pc.campaign_limit,
            SUM(dm.spend) AS maximum_spent,
            ROW_NUMBER() OVER (PARTITION BY pc.allocation_id ORDER BY MAX(dm.date) DESC) AS rn
        FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
        INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm
            ON pc.campaign_id = dm.campaign_id
        GROUP BY pc.allocation_id, pc.campaign_id, pc.campaign_limit
    )
    WHERE rn = 1
) last_camp ON alloc.allocation_id = last_camp.allocation_id

LEFT JOIN (
    SELECT pc.allocation_id, dm.date, SUM(dm.spend) AS spend, SUM(dm.impressions) AS impressions, SUM(dm.clicks) AS clicks, SUM(dm.leads) AS leads
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
    INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm
        ON pc.campaign_id = dm.campaign_id
    GROUP BY pc.allocation_id, dm.date
) d ON alloc.allocation_id = d.allocation_id