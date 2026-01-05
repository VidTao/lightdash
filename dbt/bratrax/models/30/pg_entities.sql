-- Primal Queen Entities
-- Powers: Ontology Tab - 28 entity definitions with Bratrax philosophy
{{ config(
    materialized = 'view',
    alias = 'pq_entities'
) }}

SELECT
    entity_id,
    entity_name,
    category,

    definition,
    source_system,
    formula,

    -- Bratrax philosophy
    domain,
    confidence_pct,
    falsifier,

    -- Dependencies
    used_in,
    depends_on

FROM {{ source('primal_queen', 'entities') }}
