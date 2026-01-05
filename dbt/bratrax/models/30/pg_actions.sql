-- Primal Queen Actions
-- Powers: Actions Tab - Action board items
{{ config(
    materialized = 'view',
    alias = 'pq_actions'
) }}

SELECT
    action_id,
    created_at,

    title,
    description,

    -- Categorization
    category,
    linked_hypothesis,
    target_metric,

    -- Status
    status,
    owner_name,
    owner_initials,

    -- Progress
    progress_pct,
    target_value,
    current_value,

    -- Blockers
    blocker_description,
    client_id

FROM {{ source('primal_queen', 'actions') }}
