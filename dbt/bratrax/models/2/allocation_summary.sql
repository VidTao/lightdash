
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

alloc_type AS (
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
                ORDER BY p.payment_date DESC, pa.created_at DESC, pa.payment_id DESC
            ) AS rn
        FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation` pa
        INNER JOIN `bratrax-without-flattening`.`cod`.`slack_payments` p
            ON pa.payment_id = p.payment_id
    )
    WHERE rn = 1
),

budget AS (
    SELECT
        allocation_id,
        SUM(amount) AS lifetime_budget
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation`
    GROUP BY allocation_id
),

active_camp AS (
    SELECT
        allocation_id,
        SUM(campaign_limit + 10) AS campaign_limit
    FROM (
        SELECT
            allocation_id,
            campaign_id,
            MAX(campaign_limit) AS campaign_limit
        FROM `bratrax-without-flattening`.`cod`.`platform_campaigns`
        WHERE LOWER(status) = 'active'
        GROUP BY allocation_id, campaign_id
    )
    GROUP BY allocation_id
),

last_camp AS (
    SELECT allocation_id, campaign_limit
    FROM (
        SELECT
            pc.allocation_id,
            pc.campaign_limit,
            ROW_NUMBER() OVER (
                PARTITION BY pc.allocation_id
                ORDER BY dm.max_date DESC
            ) AS rn
        FROM `bratrax-without-flattening`.`cod`.`platform_campaigns` pc
        INNER JOIN (
            SELECT campaign_id, MAX(date) AS max_date
            FROM `bratrax-without-flattening`.`cod`.`campaign_daily_metrics`
            GROUP BY campaign_id
        ) dm ON pc.campaign_id = dm.campaign_id
    )
    WHERE rn = 1
),

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
    COALESCE(active_camp.campaign_limit, last_camp.campaign_limit) AS campaign_limit,
    COALESCE(total_spend.maximum_spent, 0) AS maximum_spent
FROM alloc_base alloc
LEFT JOIN alloc_type ON alloc.allocation_id = alloc_type.allocation_id
LEFT JOIN budget ON alloc.allocation_id = budget.allocation_id
LEFT JOIN active_camp ON alloc.allocation_id = active_camp.allocation_id
LEFT JOIN last_camp ON alloc.allocation_id = last_camp.allocation_id
LEFT JOIN total_spend ON alloc.allocation_id = total_spend.allocation_id