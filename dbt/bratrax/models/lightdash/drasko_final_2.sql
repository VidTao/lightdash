
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

WHERE (client_id = 'e62c4468-4c06-4786-a5de-f44e6c7062be')
GROUP BY 1,2,3
ORDER BY `ads_account_id`
LIMIT 500
