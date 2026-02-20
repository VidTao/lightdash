/**
 * Bundled stack templates embedded directly in the frontend.
 * Eliminates the need for the Bratrax API to be running just to load templates.
 */

export type BundledTemplate = {
    name: string;
    display_name: string;
    description: string;
    files: Record<string, string>;
};

export const BUNDLED_TEMPLATES: BundledTemplate[] = [
    {
        name: 'shopify-paid-media',
        display_name: 'Shopify + Paid Media',
        description:
            'E-commerce brand with Shopify store and paid acquisition channels',
        files: {
            config: `template_id: shopify-paid-media
display_name: "Shopify + Paid Media"
description: "E-commerce brand with Shopify store and paid acquisition channels"

warehouse:
  type: bigquery
  project: bratrax
  raw_dataset: raw_data
  cod_dataset: cod

required_sources:
  - shopify
  - facebook_ads

optional_sources:
  - google_ads
  - klaviyo
  - tiktok_ads
  - pinterest_ads`,

            ontology: `version: "1.0"
namespace: "\${CLIENT_ID}"
generated_at: null

objects:

  Customer:
    description: "A customer who has purchased from the store"
    primary_key: customer_id
    table: dim_customers

    properties:
      customer_id:
        type: string
        backing:
          source: $sources.shopify.customers
          field: id

      email:
        type: string
        pii: true
        backing:
          source: $sources.shopify.customers
          field: email

      first_name:
        type: string
        pii: true
        backing:
          source: $sources.shopify.customers
          field: first_name

      last_name:
        type: string
        pii: true
        backing:
          source: $sources.shopify.customers
          field: last_name

      created_at:
        type: timestamp
        backing:
          source: $sources.shopify.customers
          field: created_at

      total_spent:
        type: decimal
        description: "Total amount spent (from Shopify)"
        backing:
          source: $sources.shopify.customers
          field: total_spent

      orders_count:
        type: integer
        description: "Number of orders (from Shopify)"
        backing:
          source: $sources.shopify.customers
          field: orders_count

      acquisition_channel:
        type: string
        description: "First-touch acquisition channel"
        derived:
          type: first_touch
          event: $events.page_view
          field: utm_source
          default: "direct"

      lifetime_value:
        type: decimal
        description: "Total revenue from this customer"
        derived:
          type: sum
          event: $events.order_completed
          field: revenue
          window: all_time

      avg_order_value:
        type: decimal
        computed:
          formula: "lifetime_value / NULLIF(orders_count, 0)"
          depends_on:
            - lifetime_value
            - orders_count

  Order:
    description: "A Shopify order"
    primary_key: order_id
    table: dim_orders

    properties:
      order_id:
        type: string
        backing:
          source: $sources.shopify.orders
          field: id

      customer_id:
        type: string
        backing:
          source: $sources.shopify.orders
          field: customer_id

      total_price:
        type: decimal
        backing:
          source: $sources.shopify.orders
          field: total_price

      subtotal_price:
        type: decimal
        backing:
          source: $sources.shopify.orders
          field: subtotal_price

      currency:
        type: string
        backing:
          source: $sources.shopify.orders
          field: currency

      financial_status:
        type: string
        backing:
          source: $sources.shopify.orders
          field: financial_status

      fulfillment_status:
        type: string
        backing:
          source: $sources.shopify.orders
          field: fulfillment_status

      created_at:
        type: timestamp
        backing:
          source: $sources.shopify.orders
          field: created_at

      first_touch_channel:
        type: string
        derived:
          type: first_touch
          event: $events.page_view
          field: utm_source
          lookback: 30d
          anchor_event: $events.order_completed
          default: "direct"

      last_touch_channel:
        type: string
        derived:
          type: last_touch
          event: $events.page_view
          field: utm_source
          lookback: 30d
          anchor_event: $events.order_completed
          default: "direct"

  Campaign:
    description: "A paid media campaign"
    primary_key: campaign_id
    table: dim_campaigns

    properties:
      campaign_id:
        type: string
        backing:
          source: $sources.facebook_ads.campaigns
          field: campaign_id

      campaign_name:
        type: string
        backing:
          source: $sources.facebook_ads.campaigns
          field: campaign_name

      status:
        type: string
        backing:
          source: $sources.facebook_ads.campaigns
          field: status

      spend:
        type: decimal
        backing:
          source: $sources.facebook_ads.ad_insights
          field: spend

      impressions:
        type: integer
        backing:
          source: $sources.facebook_ads.ad_insights
          field: impressions

      clicks:
        type: integer
        backing:
          source: $sources.facebook_ads.ad_insights
          field: clicks

      cpc:
        type: decimal
        computed:
          formula: "spend / NULLIF(clicks, 0)"
          depends_on:
            - spend
            - clicks

  Product:
    description: "A product in the catalog"
    primary_key: product_id
    table: dim_products

    properties:
      product_id:
        type: string
        backing:
          source: $sources.shopify.products
          field: id

      title:
        type: string
        backing:
          source: $sources.shopify.products
          field: title

      vendor:
        type: string
        backing:
          source: $sources.shopify.products
          field: vendor

      product_type:
        type: string
        backing:
          source: $sources.shopify.products
          field: product_type

links:
  Customer_Order:
    from: Customer.customer_id
    to: Order.customer_id
    cardinality: one_to_many

metrics:
  total_revenue:
    object: Order
    aggregation: SUM(total_price)

  total_customers:
    object: Customer
    aggregation: COUNT(DISTINCT customer_id)
    filter: "orders_count > 0"

  avg_order_value:
    object: Order
    aggregation: AVG(total_price)`,

            sources: `version: "1.0"
namespace: "\${CLIENT_ID}"
generated_at: null

activity_stream:
  database: bigquery
  table: activity_stream
  schema:
    activity_id:
      type: STRING
    ts:
      type: TIMESTAMP
    activity:
      type: STRING
    customer:
      type: STRING
    anonymous_id:
      type: STRING
    features:
      type: JSON
    revenue_impact:
      type: FLOAT64
    source:
      type: STRING

sources:

  browser_events:
    type: pubsub
    description: "Browser events from tracking pixel"

    transport:
      project: \${GCP_PROJECT}
      topic: topic-\${CLIENT_ID}-events-raw
      subscription: \${CLIENT_ID}-events-sub

    produces_events:
      - $events.page_view
      - $events.add_to_cart
      - $events.checkout_started
      - $events.order_completed

    field_mapping:
      activity_id: "event_id"
      ts: "timestamp"
      activity: "event_name"
      customer: "user_id"
      anonymous_id: "anonymous_id"
      features: "properties"
      revenue_impact: "properties.revenue"
      source: "'browser'"

  shopify:
    type: meltano
    description: "Shopify store data"

    tap: tap-shopify
    variant: singer-io

    connection:
      shop: \${SHOPIFY_SHOP}
      api_key: \${SHOPIFY_API_KEY}
      start_date: "2023-01-01T00:00:00Z"

    raw_table: raw_commerce_crm
    raw_filter:
      source: shopify

    streams:
      orders:
        replication_method: INCREMENTAL
        replication_key: updated_at
        key_properties: [id]
        raw_filter:
          stream: orders
        fields:
          id: INT64
          customer_id: INT64
          total_price: FLOAT64
          subtotal_price: FLOAT64
          total_tax: FLOAT64
          currency: STRING
          financial_status: STRING
          fulfillment_status: STRING
          created_at: TIMESTAMP
          updated_at: TIMESTAMP
          cancelled_at: TIMESTAMP
          line_items: "ARRAY<STRUCT>"

      customers:
        replication_method: INCREMENTAL
        replication_key: updated_at
        key_properties: [id]
        raw_filter:
          stream: customers
        fields:
          id: INT64
          email: STRING
          first_name: STRING
          last_name: STRING
          created_at: TIMESTAMP
          updated_at: TIMESTAMP
          orders_count: INT64
          total_spent: FLOAT64

      products:
        replication_method: INCREMENTAL
        replication_key: updated_at
        key_properties: [id]
        raw_filter:
          stream: products
        fields:
          id: INT64
          title: STRING
          vendor: STRING
          product_type: STRING
          created_at: TIMESTAMP
          updated_at: TIMESTAMP
          variants: "ARRAY<STRUCT>"

  facebook_ads:
    type: meltano
    description: "Facebook/Meta advertising data"

    tap: tap-facebook
    variant: meltanolabs

    connection:
      account_id: \${FACEBOOK_ACCOUNT_ID}
      access_token: \${FACEBOOK_ACCESS_TOKEN}
      start_date: "2023-01-01T00:00:00Z"

    raw_table: raw_ads
    raw_filter:
      source: facebook

    streams:
      campaigns:
        replication_method: INCREMENTAL
        replication_key: updated_time
        key_properties: [campaign_id]
        raw_filter:
          stream: campaigns
        fields:
          campaign_id: STRING
          campaign_name: STRING
          status: STRING
          objective: STRING
          created_time: TIMESTAMP
          updated_time: TIMESTAMP

      ad_insights:
        replication_method: INCREMENTAL
        replication_key: date_start
        key_properties: [campaign_id, date_start]
        raw_filter:
          stream: adsinsights
        fields:
          campaign_id: STRING
          date_start: DATE
          date_stop: DATE
          spend: FLOAT64
          impressions: INT64
          clicks: INT64
          reach: INT64
          cpm: FLOAT64
          cpc: FLOAT64
          ctr: FLOAT64

sync:
  schedule:
    shopify: "0 * * * *"
    facebook_ads: "0 */4 * * *"`,

            tracking_plan: `version: "1.0"
namespace: "\${CLIENT_ID}"
generated_at: null

categories:
  navigation:
    description: "Page views and navigation"
    color: "#3b82f6"

  ecommerce:
    description: "Shopping and purchase events"
    color: "#10b981"

  email:
    description: "Email engagement events"
    color: "#6366f1"

events:

  page_view:
    category: navigation
    description: "User viewed a page"
    source: $sources.browser_events
    trigger: "Page load complete"

    properties:
      page_path:
        type: string
        required: true
      page_title:
        type: string
      referrer:
        type: string
      utm_source:
        type: string
      utm_medium:
        type: string
      utm_campaign:
        type: string
      utm_content:
        type: string
      utm_term:
        type: string

    enriches:
      - $objects.Customer

    attribution:
      is_touchpoint: true
      channel_field: utm_source
      campaign_field: utm_campaign

  add_to_cart:
    category: ecommerce
    description: "User added product to cart"
    source: $sources.browser_events
    trigger: "Add to cart button clicked"

    properties:
      product_id:
        type: string
        required: true
      variant_id:
        type: string
      quantity:
        type: integer
        default: 1
      price:
        type: decimal

    enriches:
      - $objects.Customer

  checkout_started:
    category: ecommerce
    description: "User started checkout"
    source: $sources.browser_events
    trigger: "Checkout page loaded"

    properties:
      cart_total:
        type: decimal
      item_count:
        type: integer

    enriches:
      - $objects.Customer

  order_completed:
    category: ecommerce
    description: "Order completed"
    source: $sources.browser_events
    trigger: "Order confirmation page loaded"

    properties:
      order_id:
        type: string
        required: true
      revenue:
        type: decimal
        required: true
      currency:
        type: string
        default: "USD"
      products:
        type: array
        items:
          type: object
          properties:
            product_id: string
            quantity: integer
            price: decimal

    enriches:
      - $objects.Customer
      - $objects.Order

    revenue_impact: properties.revenue

    tests:
      - type: not_null
        fields: [order_id, revenue]
      - type: positive
        fields: [revenue]

validation:
  global:
    - rule: "activity_id must be unique"
      expression: "UNIQUE(activity_id)"
      action: reject

identity:
  stitching:
    primary_id: customer_id
    anonymous_id: anonymous_id
    trigger_events: [order_completed]
    lookback: 30d`,
        },
    },
];
