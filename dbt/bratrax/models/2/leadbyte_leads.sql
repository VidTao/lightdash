
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
-- ============================================================
-- Purpose: Full lead lifecycle view joining valid_invalid and 
--          sold_unsold with normalized state values
-- ============================================================

WITH valid_invalid AS (
  SELECT
    v.client_id,
    v.lead_id,
    v.lead_email,
    v.lead_fullname,
    v.lead_phone,
    v.lead_source,
    v.lead_c1,
    v.lead_c2,
    v.lead_c3,
    v.lead_sid,
    v.lead_ssid,
    v.received_at_utc,
    v.date,
    v.country,
    v.state AS state_raw,
    v.supplier_id,
    v.supplier_sid,
    v.supplier_name,
    v.campaign_id,
    v.campaign_name,
    v.campaign_reference,
    v.lead_request,
    v.record_type AS validation_record_type,
    v.callback_type AS validation_callback_type
  FROM `bratrax-without-flattening.cod.leadbyte_webhook_valid_invalid` v
),

sold_unsold AS (
  SELECT
    s.lead_id,
    s.supplier_status,
    s.supplier_commission,
    s.supplier_payout_type,
    s.buyer_id,
    s.buyer_bid,
    s.buyer_name,
    s.campaign_currency,
    s.campaign_delivery_model,
    s.delivery_name,
    s.delivery_status,
    s.delivery_sent_at,
    s.delivery_request,
    s.revenue,
    s.record_type AS distribution_record_type,
    s.callback_type AS distribution_callback_type
  FROM `bratrax-without-flattening.cod.leadbyte_webhook_sold_unsold` s
)

SELECT
  -- Lead Core Info (from valid_invalid as base)
  vi.lead_id,
  vi.client_id,
  vi.lead_email,
  vi.lead_fullname,
  vi.lead_phone,
  vi.lead_source,
  vi.lead_c1,
  vi.lead_c2,
  vi.lead_c3,
  vi.lead_sid,
  vi.lead_ssid,
  vi.received_at_utc,
  vi.date,
  vi.country,
  
  -- State (raw and normalized)
  vi.state_raw,
  st.state_code,
  st.state_name,
  
  -- Supplier Info
  vi.supplier_id,
  vi.supplier_sid,
  vi.supplier_name,
  su.supplier_status,
  su.supplier_commission,
  su.supplier_payout_type,
  
  -- Campaign Info
  vi.campaign_id,
  vi.campaign_name,
  vi.campaign_reference,
  su.campaign_currency,
  su.campaign_delivery_model,
  
  -- Buyer Info (from sold_unsold)
  su.buyer_id,
  su.buyer_bid,
  su.buyer_name,
  
  -- Delivery Info (from sold_unsold)
  su.delivery_name,
  su.delivery_status,
  su.delivery_sent_at,
  su.delivery_request,
  su.revenue,
  
  -- Raw request (from valid_invalid)
  vi.lead_request,
  
  -- Derived Status Fields
  CASE 
    WHEN su.lead_id IS NULL THEN 'Validation Only'
    WHEN su.revenue > 0 THEN 'Sold'
    WHEN su.supplier_status = 'Valid' THEN 'Valid (Pending)'
    WHEN su.delivery_status = 'Skipped' THEN 'Skipped'
    ELSE 'Unsold'
  END AS lead_status,
  
  -- Flags
  vi.lead_id IS NOT NULL AS in_valid_invalid,
  su.lead_id IS NOT NULL AS in_sold_unsold,
  su.revenue > 0 AS is_sold,
  
  -- Metadata
  vi.validation_record_type,
  vi.validation_callback_type,
  su.distribution_record_type,
  su.distribution_callback_type

FROM valid_invalid vi
LEFT JOIN sold_unsold su
  ON vi.lead_id = su.lead_id
LEFT JOIN `bratrax-without-flattening.cod.us_states_view` st
  ON vi.state_raw = st.state_raw;


-- ============================================================
-- ALTERNATE: Start from sold_unsold to capture all distributed leads
-- (in case some leads bypass validation webhook)
-- ============================================================

/*
CREATE OR REPLACE VIEW `bratrax-without-flattening.cod.vw_leads_complete_v2` AS

SELECT
  COALESCE(vi.lead_id, su.lead_id) AS lead_id,
  COALESCE(vi.client_id, su.client_id) AS client_id,
  -- ... etc using COALESCE to pick from either table
  
FROM `bratrax-without-flattening.cod.leadbyte_webhook_valid_invalid` vi
FULL OUTER JOIN `bratrax-without-flattening.cod.leadbyte_webhook_sold_unsold` su
  ON vi.lead_id = su.lead_id
LEFT JOIN `bratrax-without-flattening.cod.us_states_view` st
  ON COALESCE(vi.state, su.state) = st.state_raw;
*/
