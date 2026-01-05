-- @block_type: explore
-- @model_type: table
-- Primal Queen Signals - Active signals feed for Bratrax dashboard
{{ config(
    materialized = 'view',
    alias = 'pq_signals_view'
) }}

SELECT
    signal_id,
    created_at,
    signal_type,
    title,
    description,
    affected_hypothesis,
    affected_metric,
    current_value,
    threshold_value,
    status,
    resolved_at,
    client_id
FROM {{ source('primal_queen', 'signals') }}

