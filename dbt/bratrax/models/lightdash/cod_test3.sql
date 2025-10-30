
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
  `cod_payments`.amount AS `cod_payments_amount`,
  `cod_payments`.buyer_bid AS `cod_payments_buyer_bid`,
  `cod_payments`.buyer_name AS `cod_payments_buyer_name`,
  `cod_payments`.client_id AS `cod_payments_client_id`,
  `cod_payments`.client_type AS `cod_payments_client_type`
FROM
  `bratrax-without-flattening`.`production_tables`.`cod_payments_view` AS `cod_payments`
GROUP BY
  1,
  2,
  3,
  4,
  5
ORDER BY
  `cod_payments_amount`
LIMIT
  500
