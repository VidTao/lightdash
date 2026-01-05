-- @block_type: explore
-- @model_type: table
-- Primal Queen Hypotheses - H1-H6 hypothesis tracking for Bratrax philosophy
{{ config(
    materialized = 'view',
    alias = 'pq_hypotheses_view'
) }}

SELECT
    hypothesis_id,
    statement,
    status,
    primary_metric,
    input_metrics,
    falsifier_condition,
    current_value,
    threshold_value,
    last_status_change,
    days_in_current_status,
    client_id
FROM {{ source('primal_queen', 'hypotheses') }}

