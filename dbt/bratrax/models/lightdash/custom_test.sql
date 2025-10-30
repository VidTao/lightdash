
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
  `ads`.account_id AS `ads_account_id`,
  `ads`.account_name AS `ads_account_name`,
  `ads`.ad_id AS `ads_ad_id`
FROM
  `bratrax-without-flattening`.`production_tables`.`ads_view` AS `ads`
WHERE
  (
    client_id = '697b7a9c-afa2-43ff-a220-5aed94295d7f'
  )
GROUP BY
  1,
  2,
  3
ORDER BY
  `ads_account_id`
LIMIT
  500
