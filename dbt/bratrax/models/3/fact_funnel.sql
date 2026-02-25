WITH first_sessions AS (
  SELECT
    client_id,
    customer AS visitor_id,
    JSON_VALUE(features, '$.utm_source') AS first_touch_source,
    JSON_VALUE(features, '$.utm_medium') AS first_touch_medium,
    JSON_VALUE(features, '$.referrer') AS first_touch_referrer,
    JSON_VALUE(features, '$.device_type') AS first_touch_device,
    ts AS first_session_at
  FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
  WHERE activity = 'visitor_session_started'
  QUALIFY ROW_NUMBER() OVER (PARTITION BY customer ORDER BY ts ASC) = 1
),
stages AS (
  SELECT
    customer AS visitor_id,
    MAX(IF(activity = 'visitor_session_started', 1, 0)) AS reached_session,
    MAX(IF(activity = 'search_performed', 1, 0)) AS reached_search,
    MAX(IF(activity IN ('visitor_listing_viewed', 'visitor_listing_favorited'), 1, 0)) AS reached_engagement,
    MAX(IF(activity = 'guest_booking_requested', 1, 0)) AS reached_request,
    MAX(IF(activity = 'booking_created', 1, 0)) AS reached_booking,
    MAX(IF(activity = 'payment_completed', 1, 0)) AS reached_payment,
    COUNT(DISTINCT IF(activity = 'booking_created', JSON_VALUE(features, '$.booking_id'), NULL)) AS booking_count,
    SUM(IF(activity = 'payment_completed', CAST(JSON_VALUE(features, '$.amount') AS FLOAT64), 0)) AS total_payment_amount
  FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
  GROUP BY customer
)
SELECT
  fs.visitor_id,
  fs.client_id,
  fs.first_touch_source,
  fs.first_touch_medium,
  fs.first_touch_referrer,
  fs.first_touch_device,
  fs.first_session_at,
  fs.first_session_at AS created_at,
  s.reached_session,
  s.reached_search,
  s.reached_engagement,
  s.reached_request,
  s.reached_booking,
  s.reached_payment,
  s.booking_count,
  s.total_payment_amount,
  CASE
    WHEN s.reached_payment = 1 THEN '6_Payment'
    WHEN s.reached_booking = 1 THEN '5_Booking'
    WHEN s.reached_request = 1 THEN '4_Request'
    WHEN s.reached_engagement = 1 THEN '3_Engagement'
    WHEN s.reached_search = 1 THEN '2_Search'
    WHEN s.reached_session = 1 THEN '1_Session'
    ELSE '0_Unknown'
  END AS furthest_stage
FROM first_sessions fs
JOIN stages s ON fs.visitor_id = s.visitor_id
