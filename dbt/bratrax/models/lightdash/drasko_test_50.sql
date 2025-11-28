
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

WHERE (client_id = '3fe355c1-2e7b-4c18-b15e-1dd53d90a51f')
GROUP BY 1,2,3
ORDER BY `ads_account_id`
LIMIT 500
