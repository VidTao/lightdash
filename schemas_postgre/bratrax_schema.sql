-- Ensure uuid-ossp extension is enabled (run once per database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. bratrax_write_keys
CREATE TABLE bratrax_write_keys (
    bratrax_write_key_id SERIAL PRIMARY KEY, 
    organization_id INTEGER NOT NULL,
    write_key VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(100) NOT NULL,
    store_name VARCHAR(255),
    store_url VARCHAR(2048),
    default_currency VARCHAR(10),
    timezone VARCHAR(100),
    project_uuid UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bwk_organization
        FOREIGN KEY(organization_id) 
        REFERENCES public.organizations(organization_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_bwk_project
        FOREIGN KEY(project_uuid)
        REFERENCES public.projects(project_uuid)
        ON DELETE SET NULL
);
CREATE INDEX idx_bwk_organization_id ON bratrax_write_keys(organization_id);

-- 2. bratrax_user_platform_credentials
CREATE TABLE bratrax_user_platform_credentials (
    bratrax_credential_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER,
    platform VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    refresh_token_expiry TIMESTAMPTZ,
    api_key TEXT,
    api_secret TEXT,
    shopify_store VARCHAR(255),
    long_lived_fb_token TEXT,
    cf2_workspace_id VARCHAR(255),
    cf2_workspace_url VARCHAR(255),
    ghl_account_id VARCHAR(255),
    ghl_client_id VARCHAR(255),
    ghl_client_secret TEXT,
    stripe_account_id VARCHAR(255),
    stripe_secret_key TEXT,
    aws_access_key VARCHAR(255),
    aws_secret_key TEXT,
    role_arn VARCHAR(255),
    sp_api_client_id VARCHAR(255),
    sp_api_client_secret TEXT,
    marketplaces JSONB,
    sales_data_granularity VARCHAR(255),
    amazon_ads_profile_id VARCHAR(255),
    amazon_ads_region VARCHAR(255),
    amazon_ads_endpoint VARCHAR(255),
    amazon_ads_client_id VARCHAR(255),
    amazon_ads_client_secret TEXT,
    amazon_ads_redirect_uri VARCHAR(255),
    klaviyo_client_id VARCHAR(255),
    klaviyo_client_secret TEXT,
    slack_workspace_id VARCHAR(255),
    slack_workspace_name VARCHAR(255),
    slack_channel_id VARCHAR(255),
    accounts_data JSONB,
    token_type VARCHAR(255),
    start_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bupc_user
        FOREIGN KEY(user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bupc_organization
        FOREIGN KEY(organization_id) 
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bupc_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE SET NULL
);
CREATE INDEX idx_bupc_user_platform ON bratrax_user_platform_credentials(user_id, platform);
CREATE INDEX idx_bupc_organization_platform ON bratrax_user_platform_credentials(organization_id, platform);
CREATE INDEX idx_bupc_write_key_platform ON bratrax_user_platform_credentials(bratrax_write_key_id, platform);

-- 3. bratrax_advertising_connections
CREATE TABLE bratrax_advertising_connections (
    bratrax_connection_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    platform_type VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    currency VARCHAR(10),
    timezone VARCHAR(100),
    manager_id VARCHAR(255),
    business_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bac_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE
);
CREATE INDEX idx_bac_organization_platform ON bratrax_advertising_connections(organization_id, platform_type);

-- 4. bratrax_expense_categories
CREATE TABLE bratrax_expense_categories (
    bratrax_category_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,

    CONSTRAINT fk_bec_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bec_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    UNIQUE (organization_id, category_name)
);

-- 5. bratrax_fixed_expenses
CREATE TABLE bratrax_fixed_expenses (
    bratrax_expense_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL, 
    bratrax_write_key_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    bratrax_category_id INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    is_ad_spend BOOLEAN DEFAULT FALSE,
    source VARCHAR(255),
    campaign_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bfe_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bfe_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bfe_bratrax_category
        FOREIGN KEY(bratrax_category_id)
        REFERENCES bratrax_expense_categories(bratrax_category_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_bfe_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bfe_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL
);
CREATE INDEX idx_bfe_organization_write_key ON bratrax_fixed_expenses(organization_id, bratrax_write_key_id);

-- 6. bratrax_payment_gateway_settings
CREATE TABLE bratrax_payment_gateway_settings (
    bratrax_gateway_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    gateway_name VARCHAR(255) NOT NULL,
    percentage_fee NUMERIC(5,2),
    fixed_fee NUMERIC(10,2),
    is_shopify_payments BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bpgs_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bpgs_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bpgs_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bpgs_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    UNIQUE(bratrax_write_key_id, gateway_name)
);
CREATE INDEX idx_bpgs_organization_write_key ON bratrax_payment_gateway_settings(organization_id, bratrax_write_key_id);

-- 7. bratrax_product_cogs_settings
CREATE TABLE bratrax_product_cogs_settings (
    bratrax_product_cost_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    platform_product_id VARCHAR(255) NOT NULL,
    sku VARCHAR(255),
    cogs_amount NUMERIC(10,2),
    handling_fee NUMERIC(10,2),
    marketplace VARCHAR(100),
    product_cost NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bpcs_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bpcs_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bpcs_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bpcs_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    UNIQUE (bratrax_write_key_id, platform_product_id, marketplace)
);
CREATE INDEX idx_bpcs_organization_write_key ON bratrax_product_cogs_settings(organization_id, bratrax_write_key_id);
CREATE INDEX idx_bpcs_platform_product_id ON bratrax_product_cogs_settings(platform_product_id);

-- 8. bratrax_products
CREATE TABLE bratrax_products (
    bratrax_product_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    platform_type VARCHAR(100) NOT NULL,
    platform_product_id VARCHAR(255) NOT NULL,
    title VARCHAR(512) NOT NULL,
    sku VARCHAR(255),
    price NUMERIC(12,2),
    quantity INTEGER DEFAULT 0,
    marketplace VARCHAR(100),
    image_url VARCHAR(2048),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bprod_organization_products -- Renamed constraint prefix
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bprod_bratrax_write_key_products -- Renamed constraint prefix
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_write_key_id, platform_product_id, marketplace)
);
CREATE INDEX idx_bprod_organization_write_key ON bratrax_products(organization_id, bratrax_write_key_id);
CREATE INDEX idx_bprod_platform_product_id ON bratrax_products(platform_product_id);

-- (Table #9 bratrax_report_subscriptions is REMOVED)

-- 10. bratrax_shipping_profiles
CREATE TABLE bratrax_shipping_profiles (
    bratrax_profile_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    profile_name VARCHAR(255) NOT NULL,
    is_worldwide BOOLEAN DEFAULT FALSE,
    regions JSONB,
    rate_type VARCHAR(50),
    shipping_rate NUMERIC(10,2),
    weight_tiers JSONB,
    fulfillment_methods JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bsp_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bsp_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bsp_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bsp_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL
);
CREATE INDEX idx_bsp_organization_write_key ON bratrax_shipping_profiles(organization_id, bratrax_write_key_id);

-- 11. bratrax_store_cogs_settings
CREATE TABLE bratrax_store_cogs_settings (
    bratrax_settings_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    enable_global_cogs BOOLEAN DEFAULT FALSE,
    enable_handling_fee BOOLEAN DEFAULT FALSE,
    global_handling_fee NUMERIC(10,2),
    bidirectional_cogs BOOLEAN DEFAULT FALSE,
    marketplace VARCHAR(100),
    platform_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bscs_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bscs_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bscs_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bscs_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    UNIQUE (bratrax_write_key_id, marketplace)
);
CREATE INDEX idx_bscs_organization_write_key ON bratrax_store_cogs_settings(organization_id, bratrax_write_key_id);

-- 12. bratrax_traffic_rules
CREATE TABLE bratrax_traffic_rules (
    bratrax_rule_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER, 
    rule_name VARCHAR(255) NOT NULL,
    conditions JSONB NOT NULL,
    action VARCHAR(100) NOT NULL,
    channel VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_btr_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_btr_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_btr_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_btr_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    UNIQUE(organization_id, bratrax_write_key_id, rule_name) 
);
CREATE INDEX idx_btr_organization_write_key ON bratrax_traffic_rules(organization_id, bratrax_write_key_id);

-- 13. bratrax_variable_expenses
CREATE TABLE bratrax_variable_expenses (
    bratrax_expense_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    bratrax_category_id INTEGER,
    metric VARCHAR(255),
    percentage NUMERIC(5,2) NOT NULL,
    source VARCHAR(255),
    campaign_name VARCHAR(255),
    is_ad_spend BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by_user_uuid UUID,
    updated_by_user_uuid UUID,

    CONSTRAINT fk_bve_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_bve_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bve_bratrax_category
        FOREIGN KEY(bratrax_category_id)
        REFERENCES bratrax_expense_categories(bratrax_category_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_bve_created_by_user
        FOREIGN KEY(created_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL,
    CONSTRAINT fk_bve_updated_by_user
        FOREIGN KEY(updated_by_user_uuid)
        REFERENCES public.users(user_uuid)
        ON DELETE SET NULL
);
CREATE INDEX idx_bve_organization_write_key ON bratrax_variable_expenses(organization_id, bratrax_write_key_id);

-- 14. bratrax_default_traffic_rules (Store-Level)
CREATE TABLE bratrax_default_traffic_rules (
    bratrax_def_rule_id SERIAL PRIMARY KEY, -- Renamed PK to avoid conflict
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    conditions JSONB NOT NULL,
    action VARCHAR(100) NOT NULL,
    channel VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bdfr_organization         -- Renamed constraint prefix
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bdfr_bratrax_write_key    -- Renamed constraint prefix
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_write_key_id, rule_name) 
);
CREATE INDEX idx_bdfr_organization_write_key ON bratrax_default_traffic_rules(organization_id, bratrax_write_key_id);

-- 15. bratrax_events (Store-Level)
CREATE TABLE bratrax_events (
    bratrax_event_id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    bratrax_write_key_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    platform VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_be_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_be_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_write_key_id, platform, name)
);
CREATE INDEX idx_be_organization_write_key ON bratrax_events(organization_id, bratrax_write_key_id);

-- 16. bratrax_properties (Store-Level)
CREATE TABLE bratrax_properties (
    bratrax_property_id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    bratrax_write_key_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bprop_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bprop_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_write_key_id, platform, name)
);
CREATE INDEX idx_bprop_organization_write_key ON bratrax_properties(organization_id, bratrax_write_key_id);

-- 17. bratrax_event_properties (Store-Level context)
CREATE TABLE bratrax_event_properties (
    bratrax_event_property_id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    bratrax_write_key_id INTEGER,
    bratrax_event_id INTEGER NOT NULL,
    bratrax_property_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bep_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bep_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bep_event
        FOREIGN KEY(bratrax_event_id)
        REFERENCES bratrax_events(bratrax_event_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bep_property
        FOREIGN KEY(bratrax_property_id)
        REFERENCES bratrax_properties(bratrax_property_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_event_id, bratrax_property_id) 
);
CREATE INDEX idx_bep_organization_write_key ON bratrax_event_properties(organization_id, bratrax_write_key_id);

-- 18. bratrax_periscope_events
CREATE TABLE bratrax_periscope_events (
    bratrax_periscope_event_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_advertising_connection_id INTEGER,
    account_id VARCHAR(255) NOT NULL,
    bratrax_event_id INTEGER NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bpse_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bpse_advertising_connection
        FOREIGN KEY(bratrax_advertising_connection_id)
        REFERENCES bratrax_advertising_connections(bratrax_connection_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_bpse_event
        FOREIGN KEY(bratrax_event_id)
        REFERENCES bratrax_events(bratrax_event_id) 
        ON DELETE CASCADE,
    UNIQUE (organization_id, account_id, bratrax_event_id, bratrax_advertising_connection_id)
);
CREATE INDEX idx_bpse_org_account_event ON bratrax_periscope_events(organization_id, account_id, bratrax_event_id);

-- 19. bratrax_periscope_event_destinations
CREATE TABLE bratrax_periscope_event_destinations (
    bratrax_destination_id SERIAL PRIMARY KEY,
    bratrax_periscope_event_id INTEGER NOT NULL,
    bratrax_advertising_connection_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bped_periscope_event
        FOREIGN KEY(bratrax_periscope_event_id)
        REFERENCES bratrax_periscope_events(bratrax_periscope_event_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bped_advertising_connection
        FOREIGN KEY(bratrax_advertising_connection_id)
        REFERENCES bratrax_advertising_connections(bratrax_connection_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_periscope_event_id, bratrax_advertising_connection_id)
);

-- 20. bratrax_crm_connections
CREATE TABLE bratrax_crm_connections (
    bratrax_connection_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    bratrax_write_key_id INTEGER NOT NULL,
    platform_type VARCHAR(100) NOT NULL,
    store_url VARCHAR(2048),
    store_name VARCHAR(255),
    currency VARCHAR(10),
    timezone VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bcc_organization
        FOREIGN KEY(organization_id)
        REFERENCES public.organizations(organization_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bcc_bratrax_write_key
        FOREIGN KEY(bratrax_write_key_id)
        REFERENCES bratrax_write_keys(bratrax_write_key_id)
        ON DELETE CASCADE,
    UNIQUE (bratrax_write_key_id) 
);
CREATE INDEX idx_bcc_organization_write_key ON bratrax_crm_connections(organization_id, bratrax_write_key_id);
