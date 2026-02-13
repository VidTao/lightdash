import type { SourceConnector } from './types';

/**
 * Sample connector catalog. In production, this comes from the Meltano hub
 * or the compiler's known taps.
 */
export const CONNECTOR_CATALOG: SourceConnector[] = [
    {
        tap: 'tap-facebook',
        label: 'Facebook Ads',
        category: 'ads',
        available: true,
        streams: [
            {
                name: 'campaigns',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'campaign_name', type: 'STRING', selected: true },
                    { name: 'status', type: 'STRING', selected: true },
                    { name: 'objective', type: 'STRING', selected: true },
                    { name: 'daily_budget', type: 'FLOAT64', selected: true },
                    {
                        name: 'created_time',
                        type: 'TIMESTAMP',
                        selected: false,
                    },
                ],
            },
            {
                name: 'adsets',
                selected: false,
                fields: [
                    { name: 'adset_id', type: 'STRING', selected: true },
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'name', type: 'STRING', selected: true },
                    { name: 'targeting', type: 'JSON', selected: false },
                    { name: 'daily_budget', type: 'FLOAT64', selected: true },
                ],
            },
            {
                name: 'ad_insights',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'impressions', type: 'INT64', selected: true },
                    { name: 'clicks', type: 'INT64', selected: true },
                    { name: 'spend', type: 'FLOAT64', selected: true },
                    { name: 'conversions', type: 'INT64', selected: true },
                    { name: 'date_start', type: 'DATE', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-google-ads',
        label: 'Google Ads',
        category: 'ads',
        available: true,
        streams: [
            {
                name: 'campaigns',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'campaign_name', type: 'STRING', selected: true },
                    { name: 'status', type: 'STRING', selected: true },
                    {
                        name: 'advertising_channel_type',
                        type: 'STRING',
                        selected: true,
                    },
                    { name: 'budget_amount', type: 'FLOAT64', selected: true },
                ],
            },
            {
                name: 'campaign_performance',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'impressions', type: 'INT64', selected: true },
                    { name: 'clicks', type: 'INT64', selected: true },
                    { name: 'cost', type: 'FLOAT64', selected: true },
                    { name: 'conversions', type: 'FLOAT64', selected: true },
                    { name: 'date', type: 'DATE', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-shopify',
        label: 'Shopify',
        category: 'commerce',
        available: true,
        streams: [
            {
                name: 'orders',
                selected: false,
                fields: [
                    { name: 'order_id', type: 'STRING', selected: true },
                    { name: 'customer_id', type: 'STRING', selected: true },
                    { name: 'total_price', type: 'FLOAT64', selected: true },
                    { name: 'created_at', type: 'TIMESTAMP', selected: true },
                    {
                        name: 'financial_status',
                        type: 'STRING',
                        selected: true,
                    },
                    {
                        name: 'fulfillment_status',
                        type: 'STRING',
                        selected: false,
                    },
                ],
            },
            {
                name: 'customers',
                selected: false,
                fields: [
                    { name: 'customer_id', type: 'STRING', selected: true },
                    { name: 'email', type: 'STRING', selected: true },
                    { name: 'first_name', type: 'STRING', selected: true },
                    { name: 'last_name', type: 'STRING', selected: true },
                    { name: 'orders_count', type: 'INT64', selected: true },
                ],
            },
            {
                name: 'products',
                selected: false,
                fields: [
                    { name: 'product_id', type: 'STRING', selected: true },
                    { name: 'title', type: 'STRING', selected: true },
                    { name: 'product_type', type: 'STRING', selected: true },
                    { name: 'vendor', type: 'STRING', selected: true },
                    { name: 'price', type: 'FLOAT64', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-tiktok-ads',
        label: 'TikTok Ads',
        category: 'ads',
        available: true,
        streams: [
            {
                name: 'campaigns',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'campaign_name', type: 'STRING', selected: true },
                    { name: 'objective_type', type: 'STRING', selected: true },
                    { name: 'budget', type: 'FLOAT64', selected: true },
                ],
            },
            {
                name: 'ad_insights',
                selected: false,
                fields: [
                    { name: 'campaign_id', type: 'STRING', selected: true },
                    { name: 'impressions', type: 'INT64', selected: true },
                    { name: 'clicks', type: 'INT64', selected: true },
                    { name: 'spend', type: 'FLOAT64', selected: true },
                    { name: 'conversions', type: 'INT64', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-klaviyo',
        label: 'Klaviyo',
        category: 'crm',
        available: true,
        streams: [
            {
                name: 'profiles',
                selected: false,
                fields: [
                    { name: 'profile_id', type: 'STRING', selected: true },
                    { name: 'email', type: 'STRING', selected: true },
                    { name: 'first_name', type: 'STRING', selected: true },
                    { name: 'last_name', type: 'STRING', selected: true },
                ],
            },
            {
                name: 'events',
                selected: false,
                fields: [
                    { name: 'event_id', type: 'STRING', selected: true },
                    { name: 'event_name', type: 'STRING', selected: true },
                    { name: 'profile_id', type: 'STRING', selected: true },
                    { name: 'timestamp', type: 'TIMESTAMP', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-postgres',
        label: 'PostgreSQL',
        category: 'database',
        available: true,
        streams: [
            {
                name: 'users',
                selected: false,
                fields: [
                    { name: 'id', type: 'INT64', selected: true },
                    { name: 'email', type: 'STRING', selected: true },
                    { name: 'plan', type: 'STRING', selected: true },
                    { name: 'created_at', type: 'TIMESTAMP', selected: true },
                ],
            },
            {
                name: 'subscriptions',
                selected: false,
                fields: [
                    { name: 'id', type: 'INT64', selected: true },
                    { name: 'user_id', type: 'INT64', selected: true },
                    { name: 'plan_name', type: 'STRING', selected: true },
                    { name: 'status', type: 'STRING', selected: true },
                    { name: 'start_date', type: 'DATE', selected: true },
                ],
            },
        ],
    },
    {
        tap: 'tap-ga4',
        label: 'Google Analytics 4',
        category: 'analytics',
        available: false,
        streams: [],
    },
    {
        tap: 'tap-pinterest-ads',
        label: 'Pinterest Ads',
        category: 'ads',
        available: false,
        streams: [],
    },
];
