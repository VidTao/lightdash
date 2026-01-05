-- Primal Queen Signals
-- Powers: Signals Tab - Active signals feed
{{ config(
    materialized = 'view',
    alias = 'pq_signals'
) }}

SELECT
    signal_id,
    created_at,

    signal_type,
    title,
    description,

    -- Context
    affected_hypothesis,
    affected_metric,
    current_value,
    threshold_value,

    -- Status
    status,
    resolved_at

FROM {{ source('primal_queen', 'signals') }}
