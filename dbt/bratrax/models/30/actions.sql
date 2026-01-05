-- @block_type: explore
-- @model_type: table
-- Primal Queen Actions - Action board items
{{ config(
    materialized = 'view',
    alias = 'pq_actions_view'
) }}

SELECT
    action_id,
    created_at,
    title,
    description,
    category,
    linked_hypothesis,
    target_metric,
    status,
    owner_name,
    owner_initials,
    progress_pct,
    target_value,
    current_value,
    blocker_description,
    client_id
FROM {{ source('primal_queen', 'actions') }}

