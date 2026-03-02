SELECT
  client_id,
  activity_id AS session_id,
  ts AS session_started_at,
  customer AS visitor_id,
  anonymous_id,
  JSON_VALUE(features, '$.utm_source') AS utm_source,
  JSON_VALUE(features, '$.utm_medium') AS utm_medium,
  JSON_VALUE(features, '$.utm_campaign') AS utm_campaign,
  JSON_VALUE(features, '$.utm_content') AS utm_content,
  JSON_VALUE(features, '$.utm_term') AS utm_term,
  JSON_VALUE(features, '$.referrer') AS referrer,
  JSON_VALUE(features, '$.landing_page') AS landing_page,
  JSON_VALUE(features, '$.device_type') AS device_type,
  JSON_VALUE(features, '$.locale_site') AS locale_site
FROM `bratrax-without-flattening`.`micazu`.`activity_stream`
WHERE activity = 'visitor_session_started'
