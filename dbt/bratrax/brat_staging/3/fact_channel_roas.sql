WITH spend AS (
  SELECT
    CASE
      WHEN JSON_VALUE(features, '$.channel') = 'facebook_ads' THEN 'facebook_ads'
      WHEN JSON_VALUE(features, '$.channel') = 'google_ads' THEN 'google_ads'
      WHEN JSON_VALUE(features, '$.channel') = 'email' THEN 'email'
      WHEN JSON_VALUE(features, '$.channel') = 'organic' THEN 'organic'
      ELSE JSON_VALUE(features, '$.channel')
    END AS channel,
    COALESCE(JSON_VALUE(features, '$.campaign_name'), 'Unknown') AS campaign_name,
    TIMESTAMP_TRUNC(ts, MONTH) AS created_at,
    SUM(CAST(JSON_VALUE(features, '$.spend_amount') AS FLOAT64)) AS total_spend,
    COUNT(*) AS spend_events
  FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
  WHERE activity = 'campaign_spend_recorded'
  GROUP BY 1, 2, 3
),
attribution AS (
  SELECT
    mapped_channel AS channel,
    utm_campaign AS campaign_name,
    TIMESTAMP_TRUNC(booking_created_at, MONTH) AS created_at,
    SUM(first_touch_revenue) AS first_touch_revenue,
    SUM(last_touch_revenue) AS last_touch_revenue,
    SUM(linear_revenue) AS linear_revenue,
    COUNT(DISTINCT visitor_id) AS attributed_customers,
    COUNT(DISTINCT booking_id) AS attributed_bookings
  FROM {{ ref('fact_attribution') }}
  GROUP BY 1, 2, 3
)
SELECT
  COALESCE(s.channel, a.channel) AS channel,
  COALESCE(s.campaign_name, a.campaign_name, 'Unknown') AS campaign_name,
  COALESCE(s.created_at, a.created_at) AS created_at,
  '{{ var("client_id") }}' AS client_id,
  COALESCE(s.total_spend, 0) AS total_spend,
  COALESCE(a.first_touch_revenue, 0) AS first_touch_revenue,
  COALESCE(a.last_touch_revenue, 0) AS last_touch_revenue,
  COALESCE(a.linear_revenue, 0) AS linear_revenue,
  COALESCE(a.attributed_customers, 0) AS customers_acquired,
  COALESCE(a.attributed_bookings, 0) AS bookings_attributed,
  SAFE_DIVIDE(a.linear_revenue, s.total_spend) AS roas_linear,
  SAFE_DIVIDE(a.first_touch_revenue, s.total_spend) AS roas_first_touch,
  SAFE_DIVIDE(a.last_touch_revenue, s.total_spend) AS roas_last_touch,
  SAFE_DIVIDE(s.total_spend, a.attributed_bookings) AS cost_per_booking,
  SAFE_DIVIDE(s.total_spend, a.attributed_customers) AS cac,
  SAFE_DIVIDE(a.linear_revenue, a.attributed_customers) AS ltv,
  SAFE_DIVIDE(
    SAFE_DIVIDE(a.linear_revenue, a.attributed_customers),
    SAFE_DIVIDE(s.total_spend, a.attributed_customers)
  ) AS ltv_cac_ratio
FROM spend s
FULL OUTER JOIN attribution a ON s.channel = a.channel AND s.campaign_name = a.campaign_name AND s.created_at = a.created_at
