-- @block_type: explore
-- @model_type: table
-- Primal Queen Entities - 28 entity definitions with Bratrax philosophy
{{ config(
    materialized = 'view',
    alias = 'pq_entities_view'
) }}

SELECT
    entity_id,
    entity_name,
    category,
    definition,
    source_system,
    formula,
    domain,
    confidence_pct,
    falsifier,
    used_in,
    depends_on,
    client_id
FROM {{ source('primal_queen', 'entities') }}

