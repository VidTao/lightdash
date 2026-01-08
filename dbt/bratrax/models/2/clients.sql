-- @block_type: explore
-- @model_type: table
-- Clients - Client and buyer information with relationship types
{{ config(
    materialized = 'view',
    alias = 'clients_view'
) }}

SELECT
    buyer_id,
    bid,
    company_name,
    contact_name,
    relationship_types,
    client_id,
    status
FROM {{ source('production_tables_no_flat', 'clients') }}

