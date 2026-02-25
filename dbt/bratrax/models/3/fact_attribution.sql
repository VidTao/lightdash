WITH sessions AS (
  SELECT
    client_id,
    activity_id AS session_id,
    ts AS session_started_at,
    customer AS visitor_id,
    JSON_VALUE(features, '$.utm_source') AS utm_source,
    JSON_VALUE(features, '$.utm_medium') AS utm_medium,
    JSON_VALUE(features, '$.utm_campaign') AS utm_campaign,
    JSON_VALUE(features, '$.referrer') AS referrer,
    JSON_VALUE(features, '$.device_type') AS device_type
  FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
  WHERE activity = 'visitor_session_started'
),
bookings AS (
  SELECT
    client_id,
    booking_id,
    guest_id,
    created_at AS booking_created_at,
    CAST(total_guest_payment AS FLOAT64) AS booking_revenue,
    CAST(commission_amount AS FLOAT64) AS booking_commission
  FROM `bratrax-without-flattening`.`micazu`.`dim_bookings`
),
pairs AS (
  SELECT
    s.*,
    b.booking_id,
    b.booking_created_at,
    b.booking_revenue,
    b.booking_commission,
    ROW_NUMBER() OVER (
      PARTITION BY b.booking_id ORDER BY s.session_started_at ASC
    ) AS session_rank_asc,
    ROW_NUMBER() OVER (
      PARTITION BY b.booking_id ORDER BY s.session_started_at DESC
    ) AS session_rank_desc,
    COUNT(*) OVER (
      PARTITION BY b.booking_id
    ) AS sessions_per_booking
  FROM sessions s
  JOIN bookings b
    ON s.visitor_id = b.guest_id
    AND s.session_started_at <= b.booking_created_at
)
SELECT
  client_id,
  session_id,
  session_started_at,
  visitor_id,
  utm_source,
  utm_medium,
  utm_campaign,
  referrer,
  device_type,
  booking_id,
  booking_created_at,
  booking_revenue,
  booking_commission,
  CASE
    WHEN utm_source = 'facebook' AND utm_medium = 'paid_social' THEN 'facebook_ads'
    WHEN utm_source = 'google' AND utm_medium = 'cpc' THEN 'google_ads'
    WHEN utm_source = 'email' THEN 'email'
    WHEN utm_medium IN ('organic', 'referral', 'social', '(none)') THEN 'organic'
    WHEN utm_source IN ('direct', 'bing', 'instagram') THEN 'organic'
    WHEN utm_source = 'google' AND utm_medium = 'organic' THEN 'organic'
    ELSE COALESCE(utm_source, 'organic')
  END AS mapped_channel,
  IF(session_rank_asc = 1, 1.0, 0.0) AS first_touch_weight,
  IF(session_rank_desc = 1, 1.0, 0.0) AS last_touch_weight,
  1.0 / sessions_per_booking AS linear_weight,
  booking_revenue * IF(session_rank_asc = 1, 1.0, 0.0) AS first_touch_revenue,
  booking_revenue * IF(session_rank_desc = 1, 1.0, 0.0) AS last_touch_revenue,
  booking_revenue / sessions_per_booking AS linear_revenue,
  booking_commission * IF(session_rank_asc = 1, 1.0, 0.0) AS first_touch_commission,
  booking_commission * IF(session_rank_desc = 1, 1.0, 0.0) AS last_touch_commission,
  booking_commission / sessions_per_booking AS linear_commission
FROM pairs
