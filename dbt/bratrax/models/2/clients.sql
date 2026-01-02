
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT 
    COALESCE(cm.buyer_id, bb.buyer_id) as buyer_id,
    bb.bid,
    bb.company_name,
    bb.contact_name,
    cm.relationship_types,
    bb.client_id,
    CASE 
        WHEN cs.has_active_campaigns = TRUE THEN 'active'
        ELSE 'inactive'
    END as status,

FROM (
    -- buyer_base subquery
    SELECT DISTINCT
        CAST(b.ID AS STRING) as buyer_id,
        CAST(b.BID AS STRING) as bid,
        b.Name as company_name,
        b.First_name,
        b.Last_name,
        CONCAT(b.First_name, ' ', b.Last_name) as contact_name,
        b.client_id
    FROM `bratrax-without-flattening`.`cod`.`leadbyte_buyers_list` b
) bb

LEFT JOIN (
    -- client_mapping subquery
    SELECT DISTINCT
        sp.buyer_id,
        sp.bid,
        STRING_AGG(DISTINCT sp.payment_type, ', ') as relationship_types
    FROM `bratrax-without-flattening`.`cod`.`slack_payments` sp
    WHERE sp.client_id IS NOT NULL
    GROUP BY sp.bid, sp.buyer_id
) cm ON bb.buyer_id = cm.buyer_id

LEFT JOIN (
    -- campaign_status subquery
    SELECT DISTINCT
        bid,
        TRUE as has_active_campaigns
    FROM (
        SELECT REGEXP_EXTRACT(name, r'SID:(\d+)') as bid
        FROM `bratrax-without-flattening`.`cod`.`facebook_campaigns`
        WHERE UPPER(status) = 'ACTIVE' AND name LIKE '%SID:%'
        
        UNION DISTINCT
        
        SELECT REGEXP_EXTRACT(name, r'SID:(\d+)') as bid
        FROM `bratrax-without-flattening`.`cod`.`google_campaigns`
        WHERE UPPER(status) = 'ENABLED' AND name LIKE '%SID:%'
    )
) cs ON bb.bid = cs.bid

ORDER BY bb.buyer_id
