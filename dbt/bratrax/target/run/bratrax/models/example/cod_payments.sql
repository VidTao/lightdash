

  create or replace view `bratrax-without-flattening`.`production_tables`.`cod_payments_view`
  OPTIONS()
  as -- @block_type: explore
-- @model_type: table
-- COD Payments model from bratrax-without-flattening.production_tables.cod_payments


SELECT
    payment_id,
    buyer_bid,
    buyer_name,
    client_type,
    invoice_number,
    payment_date,
    method,
    amount,
    processing_fee,
    currency,
    fee_percent,
    fee_amount,
    net_amount,
    recorded_by,
    recorded_by_name,
    created_at,
    updated_at,
    updated_by,
    slack_channel,
    slack_message_ts,
    slack_channel_2,
    slack_message_ts_2,
    notes,
    recipients,
    deliveries,
    scope,
    lead_buyer_id,
    client_id
FROM `bratrax-without-flattening`.`production_tables`.`cod_payments`;

