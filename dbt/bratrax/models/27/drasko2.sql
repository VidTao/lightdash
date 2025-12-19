
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
  `ads`.account_id AS `ads_account_id`,
  `ads`.account_name AS `ads_account_name`
FROM `bratrax-without-flattening`.`production_tables`.`ads_view` AS `ads`

WHERE (client_id = '08689082-13da-4a23-885d-ee5ba66fef50')
GROUP BY 1,2
ORDER BY `ads_account_id`
LIMIT 500
