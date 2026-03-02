SELECT
  client_id,
  activity_id AS event_id,
  ts AS event_at,
  activity AS event_name,
  CASE
    WHEN activity IN ('visitor_session_started', 'search_performed') THEN 'demand'
    WHEN activity IN ('visitor_listing_viewed', 'visitor_listing_favorited') THEN 'engagement'
    WHEN activity IN ('guest_booking_requested', 'host_booking_responded', 'booking_created') THEN 'booking'
    WHEN activity IN ('payment_initiated', 'payment_completed', 'commission_deducted', 'host_payout_received') THEN 'finance'
    WHEN activity IN ('listing_created', 'listing_updated', 'calendar_updated', 'calendar_synced') THEN 'operations'
    WHEN activity IN ('review_submitted') THEN 'trust'
    WHEN activity IN ('message_sent') THEN 'communication'
    WHEN activity IN ('campaign_spend_recorded', 'email_campaign_sent', 'email_campaign_interacted') THEN 'marketing'
    ELSE 'other'
  END AS event_category,
  customer AS actor_id,
  anonymous_id,
  CASE
    WHEN activity IN ('visitor_session_started', 'search_performed', 'visitor_listing_viewed', 'visitor_listing_favorited') THEN 'visitor'
    WHEN activity IN ('guest_booking_requested', 'booking_created', 'payment_initiated', 'payment_completed', 'review_submitted', 'message_sent') THEN 'guest'
    WHEN activity IN ('host_booking_responded', 'listing_created', 'listing_updated', 'calendar_updated', 'calendar_synced', 'host_payout_received') THEN 'host'
    WHEN activity IN ('commission_deducted') THEN 'platform'
    WHEN activity IN ('campaign_spend_recorded', 'email_campaign_sent', 'email_campaign_interacted') THEN 'marketing'
    ELSE 'unknown'
  END AS actor_type,
  COALESCE(revenue_impact, 0) AS revenue_impact,
  JSON_VALUE(features, '$.booking_id') AS booking_id,
  JSON_VALUE(features, '$.listing_id') AS listing_id,
  JSON_VALUE(features, '$.host_id') AS host_id,
  JSON_VALUE(features, '$.utm_source') AS utm_source,
  JSON_VALUE(features, '$.utm_medium') AS utm_medium,
  JSON_VALUE(features, '$.device_type') AS device_type,
  SAFE_CAST(JSON_VALUE(features, '$.amount') AS FLOAT64) AS event_amount,
  JSON_VALUE(features, '$.channel') AS marketing_channel,
  JSON_VALUE(features, '$.campaign_name') AS campaign_name,
  SAFE_CAST(JSON_VALUE(features, '$.spend_amount') AS FLOAT64) AS spend_amount,
  source AS event_source
FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
WHERE client_id = '{{ var("client_id") }}'
