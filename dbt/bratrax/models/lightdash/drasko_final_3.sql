
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
  `ads`.account_id AS `ads_account_id`,
  `ads`.account_name AS `ads_account_name`,
  `ads`.ad_id AS `ads_ad_id`
FROM `bratrax-without-flattening`.`production_tables`.`ads_view` AS `ads`

WHERE (client_id = '95d31546-a5e4-47a8-bc89-741538113978')
GROUP BY 1,2,3
ORDER BY `ads_account_id`
LIMIT 500
