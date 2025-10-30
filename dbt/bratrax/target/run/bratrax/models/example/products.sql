

  create or replace view `bratrax-without-flattening`.`production_tables`.`products_view`
  OPTIONS()
  as -- @block_type: explore
-- @model_type: table
-- Products model from bratrax-without-flattening.production_tables.products


SELECT
    client_id,
    write_key,
    platform,
    product_id,
    product_status,
    product_tags,
    collections,
    product_name,
    product_type,
    vendor,
    variants,
    product_inventory_quantity,
    created_at,
    updated_at,
    updated_date,
    processed_at
FROM `bratrax-without-flattening`.`production_tables`.`products`;

