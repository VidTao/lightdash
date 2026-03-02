
{{
  config(
    tags=['created-by-lightdash']
  )
}}

SELECT
    -- Primary Keys / Dimensions
    payments.client_id,
    payments.bid,
    payments.payment_id,
    
    -- Client Info
    clients.company_name,
    
    -- Payment Details
    payments.invoice_number,
    TIMESTAMP_TRUNC(payments.payment_date, DAY) AS payment_date_day,
    payments.payment_method,
    payments.payment_type,
    payments.gross_amount,
    payments.fee_amount,
    payments.net_amount,
    
    -- Allocation Summary
    alloc.allocation_summary
    FROM (
    -- Base: only source of client_id
    SELECT
        client_id,
        bid,
        buyer_id,
        payment_id,
        invoice_number,
        payment_date,
        payment_method,
        payment_type,
        gross_amount,
        fee_amount,
        net_amount
    FROM `bratrax-without-flattening`.`cod`.`slack_payments`
) payments


    LEFT JOIN (
        SELECT
            bid,
            company_name
        FROM `bratrax-without-flattening`.`cod`.`clients`
    ) clients
        ON payments.bid = clients.bid
        -- Allocation summary (NO client_id in this subquery)
LEFT JOIN (
    SELECT
        payment_id,
        STRING_AGG(
            DISTINCT CONCAT(allocation_id, ': $', FORMAT("%'.2f", CAST(amount AS FLOAT64))),
            '\n'
        ) AS allocation_summary
    FROM `bratrax-without-flattening`.`cod`.`slack_payment_allocation`
    GROUP BY payment_id
) alloc
    ON payments.payment_id = alloc.payment_id