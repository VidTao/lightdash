
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
-- ============================================================
-- Purpose: Full lead lifecycle view combining:
--   - valid_invalid (validation stage)
--   - sold_unsold (distribution stage)
--   - deliveries_list (delivery ID mapping)
--   - us_states_view (state normalization)
-- ============================================================

SELECT
  -- ============================================================
  -- Lead Core Info
  -- ============================================================
  COALESCE(su.client_id, vi.client_id) AS client_id,
  COALESCE(su.lead_id, vi.lead_id) AS lead_id,
  COALESCE(su.lead_email, vi.lead_email) AS lead_email,
  COALESCE(su.lead_fullname, vi.lead_fullname) AS lead_fullname,
  COALESCE(su.lead_phone, vi.lead_phone) AS lead_phone,
  COALESCE(su.lead_source, vi.lead_source) AS lead_source,
  COALESCE(su.lead_c1, vi.lead_c1) AS lead_c1,
  COALESCE(su.lead_c2, vi.lead_c2) AS lead_c2,
  COALESCE(su.lead_c3, vi.lead_c3) AS lead_c3,
  COALESCE(su.lead_sid, vi.lead_sid) AS lead_sid,
  COALESCE(su.lead_ssid, vi.lead_ssid) AS lead_ssid,
  TIMESTAMP_ADD(
    COALESCE(su.received_at_utc, vi.received_at_utc), 
    INTERVAL 7 HOUR
  ) AS received_at_utc,
  DATE(TIMESTAMP_ADD(
    COALESCE(su.received_at_utc, vi.received_at_utc), 
    INTERVAL 7 HOUR
  )) AS date,
  COALESCE(su.country, vi.country) AS country,
  
  -- ============================================================
  -- State (raw and normalized)
  -- ============================================================
  COALESCE(su.state, vi.state) AS state_raw,
  st.state_code,
  st.state_name,
  
  -- ============================================================
  -- Supplier Info
  -- ============================================================
  COALESCE(su.supplier_id, vi.supplier_id) AS supplier_id,
  COALESCE(su.supplier_sid, vi.supplier_sid) AS supplier_sid,
  COALESCE(su.supplier_name, vi.supplier_name) AS supplier_name,
  su.supplier_status,
  su.supplier_commission,
  su.supplier_payout_type,
  
  -- ============================================================
  -- Campaign Info
  -- ============================================================
  COALESCE(su.campaign_id, vi.campaign_id) AS campaign_id,
  COALESCE(su.campaign_name, vi.campaign_name) AS campaign_name,
  COALESCE(su.campaign_reference, vi.campaign_reference) AS campaign_reference,
  su.campaign_currency,
  su.campaign_delivery_model,
  
  -- ============================================================
  -- Buyer Info (from sold_unsold only)
  -- ============================================================
  su.buyer_id,
  su.buyer_bid,
  su.buyer_name,
  
  -- ============================================================
  -- Delivery Info (from sold_unsold + deliveries_list)
  -- ============================================================
  su.delivery_name,
  CAST(d.ID AS STRING) AS delivery_id,
  CASE 
    WHEN su.buyer_bid IS NOT NULL AND d.ID IS NOT NULL 
    THEN CONCAT(su.buyer_bid, '_', CAST(d.ID AS STRING))
    ELSE NULL
  END AS allocation_reference,
  su.delivery_status,
  su.delivery_sent_at,
  su.delivery_request,
  su.revenue,
  
  -- ============================================================
  -- Additional Delivery Details (from deliveries_list)
  -- ============================================================
  d.status AS delivery_config_status,
  d.deliver_to,
  d.buyer_revenue AS delivery_buyer_revenue,
  d.Credit AS delivery_credit,
  d.Cap AS delivery_cap,
  d.`Total Cap` AS delivery_total_cap,
  d.`Monthly Cap` AS delivery_monthly_cap,
  d.`Weekly Cap` AS delivery_weekly_cap,
  d.`Daily Cap` AS delivery_daily_cap,
  d.`Hourly Cap` AS delivery_hourly_cap,
  
  -- ============================================================
  -- Validation Request (from valid_invalid only)
  -- ============================================================
  vi.lead_request,
  
  -- ============================================================
  -- Lead Status (Derived)
  -- ============================================================
  CASE 
    WHEN su.lead_id IS NULL THEN 'Validation Only'
    WHEN su.revenue > 0 THEN 'Sold'
    ELSE 'Unsold'
  END AS lead_status,
  
  -- ============================================================
  -- Flags
  -- ============================================================
  vi.lead_id IS NOT NULL AS in_valid_invalid,
  su.lead_id IS NOT NULL AS in_sold_unsold,
  su.revenue > 0 AS is_sold,
  
  -- ============================================================
  -- Metadata
  -- ============================================================
  vi.record_type AS validation_record_type,
  vi.callback_type AS validation_callback_type,
  su.record_type AS distribution_record_type,
  su.callback_type AS distribution_callback_type,
  su.attribute_tag,
  COALESCE(su.processed_at, vi.processed_at) AS processed_at,
  COALESCE(su.publish_time, vi.publish_time) AS publish_time,
  COALESCE(su.processed_at_final, vi.processed_at_final) AS processed_at_final

FROM `bratrax-without-flattening.cod.leadbyte_webhook_valid_invalid` vi

FULL OUTER JOIN `bratrax-without-flattening.cod.leadbyte_webhook_sold_unsold` su
  ON vi.lead_id = su.lead_id

LEFT JOIN `bratrax-without-flattening.cod.leadbyte_deliveries_list` d
  ON su.delivery_name = d.Reference

LEFT JOIN `bratrax-without-flattening.cod.us_states_view` st
  ON COALESCE(su.state, vi.state) = st.state_raw