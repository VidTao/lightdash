
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
  `allocation_performance`.active_budget AS `allocation_performance_active_budget`,
  `allocation_performance`.allocation_id AS `allocation_performance_allocation_id`
FROM
  `bratrax-without-flattening`.`cod`.`allocation_performance` AS `allocation_performance`
GROUP BY
  1,
  2
ORDER BY
  `allocation_performance_active_budget`
LIMIT
  500
