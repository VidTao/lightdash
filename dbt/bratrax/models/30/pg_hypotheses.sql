-- Primal Queen Hypotheses
-- Powers: Hypotheses Tab - H1-H6 status tracking
{{ config(
    materialized = 'view',
    alias = 'pq_hypotheses'
) }}

SELECT
    hypothesis_id,
    statement,
    status,

    -- Linked metrics
    primary_metric,
    input_metrics,

    -- Falsification
    falsifier_condition,
    current_value,
    threshold_value,

    -- History
    last_status_change,
    days_in_current_status,
    client_id

FROM {{ source('primal_queen', 'hypotheses') }}
