
{{
  config(
    materialized='table',
    cluster_by=['client_id', 'channel'],
    tags=['created-by-lightdash']
  )
}}
  
SELECT
    c.client_id,
    c.campaign_id,
    c.allocation_id,
    REGEXP_EXTRACT(c.allocation_id, r'^(\d+)_') AS bid,
    c.channel,
    c.account_id,
    c.campaign_name,
    c.campaign_type,
    c.daily_budget,
    c.status,
    c.created_at,
    b.lifetime_budget,
    rules.campaign_limit,
    spend.total_spend
FROM (
    -- Facebook Campaigns
    SELECT
        fb.client_id,
        CAST(fb.id AS STRING) AS campaign_id,
        REGEXP_EXTRACT(fb.name, r'\((\d+_[\d,]+_(?:Meta|Google)_[A-Z,]+(?:_[A-Za-z0-9]+)?)\)') AS allocation_id,
        'facebook' AS channel,
        fb.account_id,
        fb.name AS campaign_name,
        CASE 
            WHEN REGEXP_CONTAINS(fb.name, r'\(RT\)') THEN 'retainer'
            ELSE 'ppl'
        END AS campaign_type,
        fb.daily_budget / 100.0 AS daily_budget,
        CASE fb.status
            WHEN 'ACTIVE' THEN 'active'
            WHEN 'PAUSED' THEN 'paused'
            WHEN 'DELETED' THEN 'deleted'
            WHEN 'ARCHIVED' THEN 'archived'
            ELSE 'unknown'
        END AS status,
        fb.publish_time AS created_at
    FROM `bratrax-without-flattening.cod.facebook_campaigns` fb
    WHERE fb.id IS NOT NULL
        AND fb.name IS NOT NULL
    UNION DISTINCT
    -- Google Campaigns
    SELECT
        g.client_id,
        CAST(g.id AS STRING) AS campaign_id,
        REGEXP_EXTRACT(g.name, r'\((\d+_[\d,]+_(?:Meta|Google)_[A-Z,]+(?:_[A-Za-z0-9]+)?)\)') AS allocation_id,
        'google' AS channel,
        CAST(g.customer_id AS STRING) AS account_id,
        g.name AS campaign_name,
        CASE 
            WHEN REGEXP_CONTAINS(g.name, r'\(RT\)') THEN 'retainer'
            ELSE 'ppl'
        END AS campaign_type,
        CAST(JSON_EXTRACT_SCALAR(g.campaign_budget, '$.amount_micros') AS FLOAT64) / 1000000.0 AS daily_budget,
        CASE g.status
            WHEN 'ENABLED' THEN 'active'
            WHEN 'PAUSED' THEN 'paused'
            WHEN 'REMOVED' THEN 'deleted'
            ELSE 'unknown'
        END AS status,
        g.publish_time AS created_at
    FROM `bratrax-without-flattening.cod.google_campaigns` g
    WHERE g.id IS NOT NULL
        AND g.name IS NOT NULL
) c
LEFT JOIN (
    -- Lifetime budget from payment allocations
    SELECT 
        allocation_id,
        SUM(amount) AS lifetime_budget
    FROM `bratrax-without-flattening.cod.slack_payment_allocation`
    GROUP BY allocation_id
) b ON c.allocation_id = b.allocation_id
LEFT JOIN (
    -- Campaign limit from Facebook ad rules (most recent rule wins)
    SELECT 
        campaign_id,
        spend_limit / 100.0 AS campaign_limit
    FROM (
        SELECT
            JSON_VALUE(cid) AS campaign_id,
            CAST(JSON_EXTRACT_SCALAR(filter, '$.value') AS FLOAT64) AS spend_limit,
            r.updated_time,
            ROW_NUMBER() OVER (
                PARTITION BY JSON_VALUE(cid) 
                ORDER BY r.updated_time DESC
            ) AS rn
        FROM `bratrax-without-flattening.cod.facebook_adrules_library` r,
        UNNEST(JSON_EXTRACT_ARRAY(r.evaluation_filters)) AS filter,
        UNNEST(
            JSON_EXTRACT_ARRAY(
                (SELECT f FROM UNNEST(JSON_EXTRACT_ARRAY(r.evaluation_filters)) f 
                 WHERE JSON_EXTRACT_SCALAR(f, '$.field') = 'campaign.id'),
                '$.value'
            )
        ) AS cid
        WHERE JSON_EXTRACT_SCALAR(filter, '$.field') = 'spent'
          AND JSON_EXTRACT_SCALAR(filter, '$.operator') = 'GREATER_THAN'
    )
    WHERE rn = 1
) rules ON c.campaign_id = rules.campaign_id
LEFT JOIN (
    -- Total spend: all-time spend per campaign
    SELECT
        campaign_id,
        SUM(spend) AS total_spend
    FROM (
        -- Facebook spend (no dedup needed — no duplicates)
        SELECT
            campaign_id,
            spend
        FROM `bratrax-without-flattening.cod.facebook_adsinsights_hourly_core`
        WHERE campaign_id IS NOT NULL
        
        UNION ALL
        
        -- Google spend (DEDUP REQUIRED — 25 duplicate batches)
        SELECT
            CAST(campaign_id AS STRING) AS campaign_id,
            cost_micros / 1000000.0 AS spend
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY campaign_id, date, hour, device, ad_network_type, click_type
                    ORDER BY processed_at DESC
                ) AS rn
            FROM `bratrax-without-flattening.cod.google_campaign_performance_report`
            WHERE campaign_id IS NOT NULL
        )
        WHERE rn = 1
    )
    GROUP BY campaign_id
) spend ON c.campaign_id = spend.campaign_id
WHERE c.client_id = '95d31546-a5e4-47a8-bc89-741538113978'