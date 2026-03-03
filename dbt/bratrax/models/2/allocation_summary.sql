
{{
  config(
    tags=['created-by-lightdash']
  )
}}

-- ALLOCATION_SUMMARY: One row per allocation with static budget/payment attributes.
-- Regular view that reads from the campaign_daily_metrics incremental table
-- (refreshed daily by dbt-cron) + small dimension tables.

WITH alloc_base AS (
    SELECT DISTINCT
        allocation_id,
        client_id,
        buyer_id,
        bid,
        geos,
        channel
    FROM `bratrax-without-flattening`.`cod`.`slack_allocation`
),

-- Most recent payment info per allocation
alloc_type AS (
    SELECT
        pa.allocation_id,
        p.payment_type AS allocation_type,
        p.payment_date AS last_payment_date,
        pa.amount AS active_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa
    INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p
        ON pa.payment_id = p.payment_id
    INNER JOIN (
        SELECT
            pa2.allocation_id,
            MAX(p2.payment_date) AS max_payment_date
        FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa2
        INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p2
            ON pa2.payment_id = p2.payment_id
        GROUP BY pa2.allocation_id
    ) latest
        ON pa.allocation_id = latest.allocation_id
        AND p.payment_date = latest.max_payment_date
),

-- Lifetime budget per allocation
budget AS (
    SELECT
        allocation_id,
        SUM(amount) AS lifetime_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation`
    GROUP BY allocation_id
),

-- Campaign limit from active campaigns only
active_camp AS (
    SELECT
        allocation_id,
        MAX(campaign_limit) + 10 AS campaign_limit
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns`
    WHERE LOWER(status) = 'active'
    GROUP BY allocation_id
),

-- Maximum spent (all-time total from materialized campaign_daily_metrics)
total_spend AS (
    SELECT
        pc.allocation_id,
        SUM(dm.spend) AS maximum_spent
    FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
    INNER JOIN `bratrax-without-flattening`.`cod`.`campaign_daily_metrics` dm
        ON pc.campaign_id = dm.campaign_id
    GROUP BY pc.allocation_id
)

SELECT
    alloc.client_id,
    alloc.allocation_id,
    alloc.buyer_id,
    alloc.bid,
    alloc.geos,
    alloc.channel,
    CASE
        WHEN active_camp.allocation_id IS NOT NULL THEN 'active'
        ELSE 'inactive'
    END AS status,
    alloc_type.allocation_type,
    alloc_type.last_payment_date,
    alloc_type.active_budget,
    COALESCE(budget.lifetime_budget, 0) AS lifetime_budget,
    active_camp.campaign_limit,
    COALESCE(total_spend.maximum_spent, 0) AS maximum_spent
FROM alloc_base alloc
LEFT JOIN alloc_type ON alloc.allocation_id = alloc_type.allocation_id
LEFT JOIN budget ON alloc.allocation_id = budget.allocation_id
LEFT JOIN active_camp ON alloc.allocation_id = active_camp.allocation_id
LEFT JOIN total_spend ON alloc.allocation_id = total_spend.allocation_id
