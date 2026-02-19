
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  

WITH buyer_base AS (
    SELECT DISTINCT
        CAST(b.ID AS STRING) as buyer_id,
        CAST(b.BID AS STRING) as bid,
        b.Name as company_name,
        b.First_name,
        b.Last_name,
        CONCAT(b.First_name, ' ', b.Last_name) as contact_name,
        b.Email as contact_email,
        b.Created as created_at,
        b.Account_Manager as account_manager,
        b.Balance as current_balance
    FROM `bratrax-without-flattening`.`cod`.`leadbyte_buyers_list` b
),

client_mapping AS (
    SELECT DISTINCT
        sp.buyer_id,
        STRING_AGG(DISTINCT sp.payment_type, ', ') as relationship_types
    FROM `bratrax-without-flattening`.`cod`.`slack_payments` sp
    WHERE sp.client_id IS NOT NULL
    GROUP BY sp.buyer_id
),

campaign_status AS (
    SELECT DISTINCT
        REGEXP_EXTRACT(name, r'SID:(\d+)') as bid,
        TRUE as has_active_campaigns
    FROM `bratrax-without-flattening`.`cod`.`facebook_campaigns`
    WHERE UPPER(status) = 'ACTIVE'
      AND name LIKE '%SID:%'
    
    UNION DISTINCT
    
    SELECT DISTINCT
        REGEXP_EXTRACT(name, r'SID:(\d+)') as bid,
        TRUE as has_active_campaigns
    FROM `bratrax-without-flattening`.`cod`.`google_campaigns`
    WHERE UPPER(status) = 'ENABLED'
      AND name LIKE '%SID:%'
)

SELECT 
    '95d31546-a5e4-47a8-bc89-741538113978' as client_id,
    bb.buyer_id,
    bb.bid,
    bb.company_name,
    bb.contact_name,
    bb.contact_email,
    cm.relationship_types,
    CASE 
        WHEN cs.has_active_campaigns = TRUE THEN 'active'
        ELSE 'inactive'
    END as status,
    bb.created_at,
    bb.account_manager,
    bb.current_balance
FROM buyer_base bb
LEFT JOIN client_mapping cm
    ON bb.buyer_id = cm.buyer_id
LEFT JOIN campaign_status cs
    ON bb.bid = cs.bid
ORDER BY bb.buyer_id