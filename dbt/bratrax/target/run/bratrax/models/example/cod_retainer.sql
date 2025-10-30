

  create or replace view `bratrax-without-flattening`.`production_tables`.`cod_retainer_view`
  OPTIONS()
  as -- @block_type: explore
-- @model_type: table
-- COD Retainer model from bratrax-without-flattening.production_tables.cod_retainer


SELECT
    client_id,
    buyer_id,
    buyer_name,
    now_date,
    total_budget,
    total_processing_fee,
    total_fee_amount,
    total_net_amount,
    remaining_budget,
    budget_utilization_percent,
    budget_remaining_percent,
    last_payment_date,
    payment_count,
    total_spend,
    facebook_spend,
    google_spend,
    lead_count,
    revenue,
    cpl,
    active_days,
    last_activity_date,
    campaign_statuses,
    active_campaigns,
    total_daily_budget,
    estimated_days_remaining,
    budget_health_status,
    utilization_status,
    last_processed_at
FROM `bratrax-without-flattening`.`production_tables`.`cod_retainer`;

