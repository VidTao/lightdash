import type { OntologyGraphData } from './types';

/**
 * Sample pipeline data representing VidTao's compiled ontology.
 * Will be replaced by `bratrax compile --client X --output-json` output.
 */
export const VIDTAO_SAMPLE_DATA: OntologyGraphData = {
    nodes: [
        // Sources
        {
            id: 'src-facebook',
            kind: 'source',
            label: 'Facebook Ads',
            details: {
                tap: 'tap-facebook',
                streams: ['campaigns', 'adsets', 'ads', 'ad_insights'],
            },
        },
        {
            id: 'src-google',
            kind: 'source',
            label: 'Google Ads',
            details: {
                tap: 'tap-google-ads',
                streams: [
                    'campaigns',
                    'ad_groups',
                    'ads',
                    'campaign_performance',
                ],
            },
        },
        {
            id: 'src-shopify',
            kind: 'source',
            label: 'Shopify',
            details: {
                tap: 'tap-shopify',
                streams: ['orders', 'customers', 'products'],
            },
        },
        {
            id: 'src-postgres',
            kind: 'source',
            label: 'PostgreSQL',
            details: {
                tap: 'tap-postgres',
                streams: ['users', 'subscriptions'],
            },
        },

        // Streams
        {
            id: 'stream-fb-campaigns',
            kind: 'stream',
            label: 'campaigns',
            details: {
                source: 'Facebook Ads',
                fields: [
                    'campaign_id',
                    'campaign_name',
                    'status',
                    'objective',
                    'daily_budget',
                ],
            },
        },
        {
            id: 'stream-fb-insights',
            kind: 'stream',
            label: 'ad_insights',
            details: {
                source: 'Facebook Ads',
                fields: [
                    'campaign_id',
                    'impressions',
                    'clicks',
                    'spend',
                    'conversions',
                ],
            },
        },
        {
            id: 'stream-google-campaigns',
            kind: 'stream',
            label: 'campaign_performance',
            details: {
                source: 'Google Ads',
                fields: [
                    'campaign_id',
                    'campaign_name',
                    'impressions',
                    'clicks',
                    'cost',
                ],
            },
        },
        {
            id: 'stream-shopify-orders',
            kind: 'stream',
            label: 'orders',
            details: {
                source: 'Shopify',
                fields: [
                    'order_id',
                    'customer_id',
                    'total_price',
                    'created_at',
                    'financial_status',
                ],
            },
        },
        {
            id: 'stream-shopify-customers',
            kind: 'stream',
            label: 'customers',
            details: {
                source: 'Shopify',
                fields: [
                    'customer_id',
                    'email',
                    'first_name',
                    'last_name',
                    'orders_count',
                ],
            },
        },
        {
            id: 'stream-pg-users',
            kind: 'stream',
            label: 'users',
            details: {
                source: 'PostgreSQL',
                fields: ['id', 'email', 'plan', 'created_at'],
            },
        },

        // Flatten (Dataform models)
        {
            id: 'flatten-fb-campaigns',
            kind: 'flatten',
            label: 'cod.facebook_campaigns',
            details: {
                sqlx: 'facebook_campaigns.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    campaign_id: 'STRING',
                    campaign_name: 'STRING',
                    status: 'STRING',
                    objective: 'STRING',
                    daily_budget: 'FLOAT64',
                },
            },
        },
        {
            id: 'flatten-fb-insights',
            kind: 'flatten',
            label: 'cod.facebook_ad_insights',
            details: {
                sqlx: 'facebook_ad_insights.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    campaign_id: 'STRING',
                    impressions: 'INT64',
                    clicks: 'INT64',
                    spend: 'FLOAT64',
                    conversions: 'INT64',
                },
            },
        },
        {
            id: 'flatten-google-campaigns',
            kind: 'flatten',
            label: 'cod.google_campaigns',
            details: {
                sqlx: 'google_campaigns.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    campaign_id: 'STRING',
                    campaign_name: 'STRING',
                    impressions: 'INT64',
                    clicks: 'INT64',
                    cost: 'FLOAT64',
                },
            },
        },
        {
            id: 'flatten-shopify-orders',
            kind: 'flatten',
            label: 'cod.shopify_orders',
            details: {
                sqlx: 'shopify_orders.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    order_id: 'STRING',
                    customer_id: 'STRING',
                    total_price: 'FLOAT64',
                    created_at: 'TIMESTAMP',
                    financial_status: 'STRING',
                },
            },
        },
        {
            id: 'flatten-shopify-customers',
            kind: 'flatten',
            label: 'cod.shopify_customers',
            details: {
                sqlx: 'shopify_customers.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    customer_id: 'STRING',
                    email: 'STRING',
                    first_name: 'STRING',
                    last_name: 'STRING',
                    orders_count: 'INT64',
                },
            },
        },
        {
            id: 'flatten-pg-users',
            kind: 'flatten',
            label: 'cod.postgres_users',
            details: {
                sqlx: 'postgres_users.sqlx',
                type: 'table',
                dataset: 'cod',
                fields: {
                    user_id: 'STRING',
                    email: 'STRING',
                    plan: 'STRING',
                    created_at: 'TIMESTAMP',
                },
            },
        },

        // Dimension tables
        {
            id: 'dim-campaigns',
            kind: 'dim',
            label: 'dim_campaigns',
            details: {
                properties: [
                    'campaign_id',
                    'campaign_name',
                    'platform',
                    'status',
                    'objective',
                    'daily_budget',
                ],
                sources: ['cod.facebook_campaigns', 'cod.google_campaigns'],
                sqlx: 'dim_campaigns.sqlx',
            },
        },
        {
            id: 'dim-ad-performance',
            kind: 'dim',
            label: 'dim_ad_performance',
            details: {
                properties: [
                    'campaign_id',
                    'platform',
                    'impressions',
                    'clicks',
                    'spend',
                    'conversions',
                    'cpc',
                    'ctr',
                ],
                sources: ['cod.facebook_ad_insights', 'cod.google_campaigns'],
                computed: {
                    cpc: 'spend / NULLIF(clicks, 0)',
                    ctr: 'clicks / NULLIF(impressions, 0)',
                },
                sqlx: 'dim_ad_performance.sqlx',
            },
        },
        {
            id: 'dim-orders',
            kind: 'dim',
            label: 'dim_orders',
            details: {
                properties: [
                    'order_id',
                    'customer_id',
                    'total_price',
                    'created_at',
                    'financial_status',
                ],
                sources: ['cod.shopify_orders'],
                sqlx: 'dim_orders.sqlx',
            },
        },
        {
            id: 'dim-customers',
            kind: 'dim',
            label: 'dim_customers',
            details: {
                properties: [
                    'customer_id',
                    'email',
                    'full_name',
                    'orders_count',
                    'plan',
                ],
                sources: ['cod.shopify_customers', 'cod.postgres_users'],
                computed: { full_name: "CONCAT(first_name, ' ', last_name)" },
                sqlx: 'dim_customers.sqlx',
            },
        },

        // Lightdash dashboards
        {
            id: 'lh-campaign-overview',
            kind: 'lightdash',
            label: 'Campaign Overview',
            details: {
                charts: [
                    'Campaign Spend by Platform',
                    'CTR Trend',
                    'Top Campaigns',
                ],
                models: ['dim_campaigns', 'dim_ad_performance'],
            },
        },
        {
            id: 'lh-revenue',
            kind: 'lightdash',
            label: 'Revenue Dashboard',
            details: {
                charts: ['Revenue by Day', 'Orders by Status', 'AOV Trend'],
                models: ['dim_orders', 'dim_customers'],
            },
        },
    ],
    edges: [
        // Source -> Stream
        { source: 'src-facebook', target: 'stream-fb-campaigns' },
        { source: 'src-facebook', target: 'stream-fb-insights' },
        { source: 'src-google', target: 'stream-google-campaigns' },
        { source: 'src-shopify', target: 'stream-shopify-orders' },
        { source: 'src-shopify', target: 'stream-shopify-customers' },
        { source: 'src-postgres', target: 'stream-pg-users' },

        // Stream -> Flatten
        { source: 'stream-fb-campaigns', target: 'flatten-fb-campaigns' },
        { source: 'stream-fb-insights', target: 'flatten-fb-insights' },
        {
            source: 'stream-google-campaigns',
            target: 'flatten-google-campaigns',
        },
        { source: 'stream-shopify-orders', target: 'flatten-shopify-orders' },
        {
            source: 'stream-shopify-customers',
            target: 'flatten-shopify-customers',
        },
        { source: 'stream-pg-users', target: 'flatten-pg-users' },

        // Flatten -> Dim
        { source: 'flatten-fb-campaigns', target: 'dim-campaigns' },
        { source: 'flatten-google-campaigns', target: 'dim-campaigns' },
        { source: 'flatten-fb-insights', target: 'dim-ad-performance' },
        { source: 'flatten-google-campaigns', target: 'dim-ad-performance' },
        { source: 'flatten-shopify-orders', target: 'dim-orders' },
        { source: 'flatten-shopify-customers', target: 'dim-customers' },
        { source: 'flatten-pg-users', target: 'dim-customers' },

        // Dim -> Lightdash
        { source: 'dim-campaigns', target: 'lh-campaign-overview' },
        { source: 'dim-ad-performance', target: 'lh-campaign-overview' },
        { source: 'dim-orders', target: 'lh-revenue' },
        { source: 'dim-customers', target: 'lh-revenue' },
    ],
};
