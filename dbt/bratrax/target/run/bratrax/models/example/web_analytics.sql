

  create or replace view `bratrax-without-flattening`.`production_tables`.`web_analytics_view`
  OPTIONS()
  as -- @block_type: explore
-- @model_type: table
-- Web analytics model from bratrax-without-flattening.production_tables.web_analytics


SELECT
    client_id,
    write_key,
    session_id,
    anonymous_id,
    event_date,
    event_hour,
    timezone,
    device,
    device_category,
    browser,
    operating_system,
    city,
    country,
    landing_page_path,
    landing_page_url,
    landing_page_type,
    traffic_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    sessions,
    page_views,
    time_on_site,
    bounce,
    bounce_rate,
    users,
    new_users,
    user_type,
    average_page_views_per_session,
    average_session_duration,
    product_views,
    collection_views,
    searches,
    cart_views,
    checkout_starts,
    add_to_carts,
    orders_quantity,
    order_revenue,
    conversion_rate,
    average_order_value,
    add_to_cart_rate,
    checkout_rate,
    checkout_completion_rate,
    product_to_cart_rate,
    cart_to_checkout_rate,
    checkout_to_purchase_rate,
    product_to_purchase_rate,
    session_value,
    user_segment,
    engagement_level,
    email,
    has_login_event,
    start_timestamp,
    last_timestamp,
    processed_at,
    analytics_processed_at
FROM `bratrax-without-flattening`.`production_tables`.`web_analytics`;

