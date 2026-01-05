
{{
  config(
    tags=['created-by-lightdash']
  )
}}
  
SELECT
    action_id,
    created_at,

    title,
    description,

    -- Categorization
    category,
    linked_hypothesis,
    target_metric,

    -- Status
    status,
    owner_name,
    owner_initials,

    -- Progress
    progress_pct,
    target_value,
    current_value,

    -- Blockers
    blocker_description

from

`bratrax-without-flattening`.`primal_queen`.`actions`
